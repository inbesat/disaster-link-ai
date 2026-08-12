-- =====================================================================
-- 0002_enable_postgis.sql
-- Adds PostGIS geospatial capability to the SafeSphere schema.
-- NOTE: migration 0001 already creates these columns/indexes. Every
-- statement below is idempotent (IF NOT EXISTS), so running this on an
-- up-to-date database is a safe no-op and it also works standalone.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENABLE POSTGIS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------
-- 2. SPATIAL COLUMNS (SRID 4326 = WGS84 longitude/latitude)
-- ---------------------------------------------------------------------
-- Shelters: point location for "nearest available shelter" queries.
ALTER TABLE public.shelters
  ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Resources: point location where the stockpile is deployed, for
-- "nearest deployable supply" queries.
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Flood predictions: polygon of the predicted inundation area, for
-- ST_Intersects "which districts are affected" queries.
ALTER TABLE public.flood_predictions
  ADD COLUMN IF NOT EXISTS affected_area geometry(Polygon, 4326);

-- ---------------------------------------------------------------------
-- 3. GIST SPATIAL INDEXES
-- GiST is the PostGIS index type; it accelerates distance (<->) and
-- overlap (ST_DWithin / ST_Intersects) queries on geometry columns.
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shelters_location
  ON public.shelters USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_resources_location
  ON public.resources USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_flood_predictions_affected_area
  ON public.flood_predictions USING GIST (affected_area);
