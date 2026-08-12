-- =====================================================================
-- 0001_initial_schema.sql
-- SafeSphere Platform — Base Schema
-- Target: Supabase (PostgreSQL 15+) — run in the Supabase SQL Editor
-- Requires: PostGIS (geospatial) + pgvector (RAG embeddings)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;   -- geometry types, GiST indexes, spatial functions
CREATE EXTENSION IF NOT EXISTS vector;    -- vector(n) type + HNSW index for RAG search
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 2. SHARED updated_at TRIGGER
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 3. USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  name       text,
  role       text NOT NULL DEFAULT 'responder'
             CHECK (role IN ('admin', 'responder', 'viewer', 'field_responder')),
  district   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 4. DISASTER EVENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.disaster_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'flood'
             CHECK (type IN ('flood', 'cyclone', 'earthquake', 'landslide', 'drought', 'other')),
  status     text NOT NULL DEFAULT 'monitoring'
             CHECK (status IN ('monitoring', 'active', 'resolved')),
  district   text,
  -- Optional epicenter point for the event
  epicenter  geometry(Point, 4326),
  started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_disaster_events
  BEFORE UPDATE ON public.disaster_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 5. FLOOD PREDICTIONS
-- PostGIS: point location + affected area polygon
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.flood_predictions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_event_id    uuid REFERENCES public.disaster_events(id) ON DELETE CASCADE,
  district             text NOT NULL,
  -- Severity vocabulary mirrors the UI theme tokens:
  -- safe (green) / watch (amber) / warning (red) / critical (purple)
  risk_level           text NOT NULL DEFAULT 'watch'
                       CHECK (risk_level IN ('safe', 'watch', 'warning', 'critical')),
  predicted_time       timestamptz NOT NULL,
  predicted_water_level numeric,
  confidence           numeric CHECK (confidence >= 0 AND confidence <= 1),
  -- PostGIS Point (WGS84 lat/long). SRID 4326 for interoperability with
  -- Mapbox/Google Maps and ST_DWithin distance queries.
  location             geometry(Point, 4326) NOT NULL,
  -- Polygon of the predicted inundation area for ST_Intersects
  -- "which districts are affected" queries.
  affected_area        geometry(Polygon, 4326),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_flood_predictions
  BEFORE UPDATE ON public.flood_predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 6. SHELTERS
-- PostGIS: point location
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.shelters (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  district          text,
  capacity          integer NOT NULL CHECK (capacity >= 0),
  current_occupancy integer NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  status            text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'full', 'closed')),
  contact           text,
  -- PostGIS Point (WGS84). Drives "nearest available shelter" lookups.
  location          geometry(Point, 4326) NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_shelters
  BEFORE UPDATE ON public.shelters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 7. RESOURCES
-- PostGIS: point location (where the resource stockpile is deployed)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'other'
             CHECK (type IN ('boat', 'medical', 'food', 'water', 'vehicle', 'personnel', 'communication', 'other')),
  quantity   integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit       text,
  status     text NOT NULL DEFAULT 'available'
             CHECK (status IN ('available', 'reserved', 'deployed', 'depleted')),
  -- PostGIS Point (WGS84). Enables "nearest deployable supply" queries.
  location   geometry(Point, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_resources
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 8. RESOURCE ALLOCATIONS (join of resources -> disaster events)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.resource_allocations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id        uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  disaster_event_id  uuid NOT NULL REFERENCES public.disaster_events(id) ON DELETE CASCADE,
  shelter_id         uuid REFERENCES public.shelters(id) ON DELETE SET NULL,
  allocated_quantity integer NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  allocated_at       timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_resource_allocations
  BEFORE UPDATE ON public.resource_allocations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_resource_allocations_resource_id
  ON public.resource_allocations (resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_disaster_event_id
  ON public.resource_allocations (disaster_event_id);

-- =====================================================================
-- 9. ALERT LOGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_event_id uuid REFERENCES public.disaster_events(id) ON DELETE SET NULL,
  -- Matches severity theme: safe / watch / warning / critical
  severity          text NOT NULL DEFAULT 'watch'
                    CHECK (severity IN ('safe', 'watch', 'warning', 'critical')),
  channel           text NOT NULL DEFAULT 'sms'
                    CHECK (channel IN ('sms', 'email', 'push', 'siren')),
  message           text NOT NULL,
  sent_at           timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_logs_severity
  ON public.alert_logs (severity, sent_at DESC);

-- =====================================================================
-- 10. EMERGENCY DOCUMENTS (RAG knowledge base)
-- Contains a pgvector embedding for vector similarity search.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.emergency_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_event_id uuid REFERENCES public.disaster_events(id) ON DELETE SET NULL,
  title             text NOT NULL,
  doc_type          text NOT NULL DEFAULT 'plan'
                    CHECK (doc_type IN ('plan', 'procedure', 'contact', 'report')),
  content           text NOT NULL,
  -- Embedding vector, 1536 dimensions (OpenAI text-embedding-3-small /
  -- text-embedding-ada-002). Used for RAG search over emergency plans.
  embedding         vector(1536),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_emergency_documents
  BEFORE UPDATE ON public.emergency_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 11. SPATIAL + VECTOR INDEXES
-- =====================================================================
-- GiST index on flood prediction points. Speeds up proximity queries like
-- "all floods within 10 km of district X":
--   SELECT * FROM flood_predictions
--   WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(lon, lat), 4326), 0.1);
CREATE INDEX IF NOT EXISTS idx_flood_predictions_location
  ON public.flood_predictions USING GIST (location);

-- GiST index on flood forecast polygons. Speeds up overlap queries like
-- "which predicted inundation areas intersect this district boundary":
--   SELECT * FROM flood_predictions
--   WHERE ST_Intersects(affected_area, ST_SetSRID(:districtBoundary, 4326));
CREATE INDEX IF NOT EXISTS idx_flood_predictions_affected_area
  ON public.flood_predictions USING GIST (affected_area);

-- GiST index on shelter points. Powers "nearest available shelter" ordering:
--   SELECT * FROM shelters ORDER BY location <-> :point LIMIT 5;
CREATE INDEX IF NOT EXISTS idx_shelters_location
  ON public.shelters USING GIST (location);

-- GiST index on resource points. Powers "nearest deployable supply":
--   SELECT * FROM resources ORDER BY location <-> :point LIMIT 5;
CREATE INDEX IF NOT EXISTS idx_resources_location
  ON public.resources USING GIST (location);

-- HNSW index on document embeddings. Approximate nearest-neighbour search
-- for RAG. vector_cosine_ops matches cosine_distance, the metric used by
-- OpenAI embedding models:
--   SELECT * FROM emergency_documents
--   ORDER BY embedding <=> :query_embedding LIMIT 5;
CREATE INDEX IF NOT EXISTS idx_emergency_documents_embedding
  ON public.emergency_documents USING hnsw (embedding vector_cosine_ops);
