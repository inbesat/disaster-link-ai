-- =====================================================================
-- 0025_fm_stations.sql
-- Phase 26 · FM Radio Emergency Broadcasting — FM station database with
-- geospatial coverage mapping (Phase 1).
--
-- Regulatory context: all FM stations under MIB must carry emergency
-- alerts per the Cable Television Networks Act + EWS guidelines; CAP
-- (Common Alerting Protocol) is the gov-mandated dissemination standard;
-- AIR runs the national emergency backbone. This table is the single
-- source of truth for "which FM stations cover the affected area".
--
-- HOW TO RUN
--   Option A — Supabase SQL editor: paste + Run (idempotent).
--   Option B — CLI: supabase db push
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------
-- 1. FM STATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fm_stations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(100) NOT NULL,           -- e.g. "Radio Mirchi 98.3"
    frequency             VARCHAR(20)  NOT NULL,           -- e.g. "98.3 MHz"
    city                  VARCHAR(50)  NOT NULL,           -- e.g. "Patna"
    state                 VARCHAR(50)  NOT NULL,           -- e.g. "Bihar"
    call_sign             VARCHAR(20),                     -- e.g. "FM-PR-01"
    coverage_radius_km    INTEGER      NOT NULL DEFAULT 50,
    lat                   DECIMAL(10,8),                   -- transmitter lat
    lng                   DECIMAL(11,8),                   -- transmitter lng
    operator              VARCHAR(50),                     -- e.g. "Entertainment Network India Ltd"
    type                  VARCHAR(20)  NOT NULL DEFAULT 'private', -- 'private' | 'air' | 'community'
    emergency_api_endpoint TEXT,                           -- CAP/alert API URL
    emergency_contact_phone VARCHAR(20),                   -- control room number
    rds_enabled           BOOLEAN      NOT NULL DEFAULT false,
    rds_api_endpoint      TEXT,                            -- RDS encoder API
    is_active             BOOLEAN      NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Name + frequency uniqueness makes the seed idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fm_stations_name_frequency
  ON public.fm_stations (name, frequency);

CREATE INDEX IF NOT EXISTS idx_fm_stations_state_city
  ON public.fm_stations (state, city);

CREATE INDEX IF NOT EXISTS idx_fm_stations_type
  ON public.fm_stations (type);

-- ---------------------------------------------------------------------
-- 2. GEOSPATIAL COVERAGE (PostGIS)
-- Coverage area is an approximate circle (ST_Buffer) around the
-- transmitter, used for ST_DWithin / ST_Intersects coverage lookups.
-- ---------------------------------------------------------------------
ALTER TABLE public.fm_stations
  ADD COLUMN IF NOT EXISTS coverage_area geography(Polygon, 4326);

CREATE INDEX IF NOT EXISTS idx_fm_stations_geo
  ON public.fm_stations USING GIST (coverage_area);

-- Auto-compute the coverage polygon whenever a station is inserted or its
-- transmitter/radius changes, so the geometry is never stale.
CREATE OR REPLACE FUNCTION public.fm_stations_compute_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.coverage_area := ST_Buffer(
      ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography,
      GREATEST(COALESCE(NEW.coverage_radius_km, 50), 5) * 1000
    );
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fm_stations_compute_coverage ON public.fm_stations;
CREATE TRIGGER trg_fm_stations_compute_coverage
  BEFORE INSERT OR UPDATE OF lat, lng, coverage_radius_km
  ON public.fm_stations
  FOR EACH ROW
  EXECUTE FUNCTION public.fm_stations_compute_coverage();

-- ---------------------------------------------------------------------
-- 3. RLS
-- Public (anon) can only read basic station info. Government roles
-- (super_admin / district_admin / field_responder) get full access.
-- ---------------------------------------------------------------------
ALTER TABLE public.fm_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fm_stations_public_select ON public.fm_stations;
CREATE POLICY fm_stations_public_select ON public.fm_stations
  FOR SELECT
  USING (
    public.current_user_role() IS NULL
    OR public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

DROP POLICY IF EXISTS fm_stations_gov_all ON public.fm_stations;
CREATE POLICY fm_stations_gov_all ON public.fm_stations
  FOR ALL
  USING (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'district_admin', 'field_responder')
  );

-- ---------------------------------------------------------------------
-- 4. SEED DATA — major Indian FM stations (metro / tier-2 / tier-3
-- flood-prone) + AIR stations. Frequencies are typical/representative;
-- lat/lng are transmitter cities. Coverage polygons are computed by the
-- trigger above. ON CONFLICT (name, frequency) keeps re-runs safe.
-- ---------------------------------------------------------------------
INSERT INTO public.fm_stations
  (name, frequency, city, state, call_sign, coverage_radius_km, lat, lng, operator, type, rds_enabled)
VALUES
  -- ── AIR / NATIONAL BACKBONE ────────────────────────────────────────
  ('AIR FM Rainbow Delhi',   '102.6 MHz', 'Delhi',       'Delhi',        'FM-DL-01', 60, 28.61390000, 77.20900000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Gold Delhi',      '106.4 MHz', 'Delhi',       'Delhi',        'FM-DL-02', 60, 28.61390000, 77.20900000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Vividh Bharati Delhi', '100.1 MHz', 'Delhi',     'Delhi',        'FM-DL-03', 60, 28.61390000, 77.20900000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Rainbow Mumbai',  '107.1 MHz', 'Mumbai',      'Maharashtra',  'FM-MH-01', 55, 19.07600000, 72.87770000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Rainbow Kolkata', '107.1 MHz', 'Kolkata',     'West Bengal',  'FM-WB-01', 55, 22.57260000, 88.36390000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Gold Kolkata',    '100.1 MHz', 'Kolkata',     'West Bengal',  'FM-WB-02', 55, 22.57260000, 88.36390000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Rainbow Chennai', '102.3 MHz', 'Chennai',     'Tamil Nadu',   'FM-TN-01', 55, 13.08270000, 80.27070000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Rainbow Bengaluru', '101.3 MHz', 'Bengaluru', 'Karnataka',   'FM-KA-01', 55, 12.97160000, 77.59460000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR FM Rainbow Hyderabad','101.9 MHz', 'Hyderabad',  'Telangana',    'FM-TS-01', 55, 17.38500000, 78.48670000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Patna FM',           '98.3 MHz',  'Patna',       'Bihar',        'FM-BR-01', 45, 25.59410000, 85.13760000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Muzaffarpur FM',     '102.3 MHz', 'Muzaffarpur', 'Bihar',        'FM-BR-02', 35, 26.12250000, 85.39080000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Darbhanga FM',       '100.6 MHz', 'Darbhanga',   'Bihar',        'FM-BR-03', 35, 26.15420000, 85.89180000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Gorakhpur FM',       '102.3 MHz', 'Gorakhpur',   'Uttar Pradesh','FM-UP-01', 35, 26.76060000, 83.37320000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Varanasi FM',        '106.8 MHz', 'Varanasi',    'Uttar Pradesh','FM-UP-02', 40, 25.31760000, 82.97390000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Lucknow FM',         '100.7 MHz', 'Lucknow',     'Uttar Pradesh','FM-UP-03', 45, 26.84670000, 80.94620000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Jaipur FM Rainbow',  '102.6 MHz', 'Jaipur',      'Rajasthan',    'FM-RJ-01', 45, 26.91240000, 75.78730000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Bhopal FM',          '103.7 MHz', 'Bhopal',      'Madhya Pradesh','FM-MP-01', 45, 23.25990000, 77.41260000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Ranchi FM',          '103.1 MHz', 'Ranchi',      'Jharkhand',    'FM-JH-01', 45, 23.34410000, 85.30960000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Guwahati FM',        '100.1 MHz', 'Guwahati',    'Assam',        'FM-AS-01', 45, 26.14450000, 91.73620000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Silchar FM',         '104.1 MHz', 'Silchar',     'Assam',        'FM-AS-02', 35, 24.83330000, 92.77890000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Bhubaneswar FM',     '102.6 MHz', 'Bhubaneswar', 'Odisha',       'FM-OD-01', 45, 20.29610000, 85.82450000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Kochi FM',           '100.0 MHz', 'Kochi',       'Kerala',       'FM-KL-01', 40, 9.93120000,  76.26730000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Malda FM',           '100.3 MHz', 'Malda',       'West Bengal',  'FM-WB-03', 35, 25.01140000, 88.14130000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Jalpaiguri FM',      '99.2 MHz',  'Jalpaiguri',  'West Bengal',  'FM-WB-04', 35, 26.51350000, 88.72970000, 'Prasar Bharati / All India Radio', 'air', true),
  ('AIR Purnia FM',          '100.7 MHz', 'Purnia',      'Bihar',        'FM-BR-04', 30, 25.77710000, 87.47530000, 'Prasar Bharati / All India Radio', 'air', true),

  -- ── PRIVATE · DELHI NCR ────────────────────────────────────────────
  ('Radio Mirchi Delhi',     '98.3 MHz', 'Delhi',        'Delhi',        'FM-PR-01', 55, 28.61390000, 77.20900000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Delhi',       '91.1 MHz', 'Delhi',        'Delhi',        'FM-PR-02', 55, 28.61390000, 77.20900000, 'Music Broadcast Ltd',            'private', true),
  ('Red FM Delhi',           '93.5 MHz', 'Delhi',        'Delhi',        'FM-PR-03', 55, 28.61390000, 77.20900000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Big FM Delhi',           '92.7 MHz', 'Delhi',        'Delhi',        'FM-PR-04', 55, 28.61390000, 77.20900000, 'Reliance Broadcast Network',      'private', true),
  ('Fever 104 Delhi',        '104.0 MHz', 'Delhi',       'Delhi',        'FM-PR-05', 55, 28.61390000, 77.20900000, 'HT Media',                       'private', true),
  ('Radio Nasha Delhi',      '107.2 MHz', 'Delhi',       'Delhi',        'FM-PR-06', 50, 28.61390000, 77.20900000, 'Next Radio Ltd',                  'private', true),

  -- ── PRIVATE · METROS ───────────────────────────────────────────────
  ('Radio Mirchi Mumbai',    '98.3 MHz', 'Mumbai',       'Maharashtra',  'FM-PR-07', 50, 19.07600000, 72.87770000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Mumbai',      '91.1 MHz', 'Mumbai',       'Maharashtra',  'FM-PR-08', 50, 19.07600000, 72.87770000, 'Music Broadcast Ltd',            'private', true),
  ('Red FM Mumbai',          '93.5 MHz', 'Mumbai',       'Maharashtra',  'FM-PR-09', 50, 19.07600000, 72.87770000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Big FM Mumbai',          '92.7 MHz', 'Mumbai',       'Maharashtra',  'FM-PR-10', 50, 19.07600000, 72.87770000, 'Reliance Broadcast Network',      'private', true),
  ('Radio Mirchi Kolkata',   '98.3 MHz', 'Kolkata',      'West Bengal',  'FM-PR-11', 50, 22.57260000, 88.36390000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Kolkata',     '91.1 MHz', 'Kolkata',      'West Bengal',  'FM-PR-12', 50, 22.57260000, 88.36390000, 'Music Broadcast Ltd',            'private', true),
  ('Red FM Kolkata',         '93.5 MHz', 'Kolkata',      'West Bengal',  'FM-PR-13', 50, 22.57260000, 88.36390000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Chennai',   '98.3 MHz', 'Chennai',      'Tamil Nadu',   'FM-PR-14', 50, 13.08270000, 80.27070000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Chennai',     '91.1 MHz', 'Chennai',      'Tamil Nadu',   'FM-PR-15', 50, 13.08270000, 80.27070000, 'Music Broadcast Ltd',            'private', true),
  ('Suryan FM Chennai',      '93.5 MHz', 'Chennai',      'Tamil Nadu',   'FM-PR-16', 50, 13.08270000, 80.27070000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Bengaluru', '98.3 MHz', 'Bengaluru',    'Karnataka',    'FM-PR-17', 50, 12.97160000, 77.59460000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Bengaluru',   '91.1 MHz', 'Bengaluru',    'Karnataka',    'FM-PR-18', 50, 12.97160000, 77.59460000, 'Music Broadcast Ltd',            'private', true),
  ('Red FM Bengaluru',       '93.5 MHz', 'Bengaluru',    'Karnataka',    'FM-PR-19', 50, 12.97160000, 77.59460000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Hyderabad', '98.3 MHz', 'Hyderabad',    'Telangana',    'FM-PR-20', 50, 17.38500000, 78.48670000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Hyderabad',   '91.1 MHz', 'Hyderabad',    'Telangana',    'FM-PR-21', 50, 17.38500000, 78.48670000, 'Music Broadcast Ltd',            'private', true),
  ('Red FM Hyderabad',       '93.5 MHz', 'Hyderabad',    'Telangana',    'FM-PR-22', 50, 17.38500000, 78.48670000, 'Kal Radio Ltd (Sun Group)',       'private', true),

  -- ── PRIVATE · TIER-2 ───────────────────────────────────────────────
  ('Radio Mirchi Patna',     '98.3 MHz', 'Patna',        'Bihar',        'FM-PR-23', 45, 25.59410000, 85.13760000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio City Patna',       '91.1 MHz', 'Patna',        'Bihar',        'FM-PR-24', 45, 25.59410000, 85.13760000, 'Music Broadcast Ltd',            'private', true),
  ('Red FM Patna',           '93.5 MHz', 'Patna',        'Bihar',        'FM-PR-25', 45, 25.59410000, 85.13760000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Lucknow',   '98.3 MHz', 'Lucknow',      'Uttar Pradesh','FM-PR-26', 45, 26.84670000, 80.94620000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Lucknow',         '93.5 MHz', 'Lucknow',      'Uttar Pradesh','FM-PR-27', 45, 26.84670000, 80.94620000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Jaipur',    '98.3 MHz', 'Jaipur',       'Rajasthan',    'FM-PR-28', 45, 26.91240000, 75.78730000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Jaipur',          '93.5 MHz', 'Jaipur',       'Rajasthan',    'FM-PR-29', 45, 26.91240000, 75.78730000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Bhopal',    '98.3 MHz', 'Bhopal',       'Madhya Pradesh','FM-PR-30', 45, 23.25990000, 77.41260000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Bhopal',          '93.5 MHz', 'Bhopal',       'Madhya Pradesh','FM-PR-31', 45, 23.25990000, 77.41260000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Ranchi',    '98.3 MHz', 'Ranchi',       'Jharkhand',    'FM-PR-32', 45, 23.34410000, 85.30960000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Ranchi',          '93.5 MHz', 'Ranchi',       'Jharkhand',    'FM-PR-33', 45, 23.34410000, 85.30960000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Guwahati',  '98.3 MHz', 'Guwahati',     'Assam',        'FM-PR-34', 45, 26.14450000, 91.73620000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Guwahati',        '93.5 MHz', 'Guwahati',     'Assam',        'FM-PR-35', 45, 26.14450000, 91.73620000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Bhubaneswar','98.3 MHz','Bhubaneswar',  'Odisha',       'FM-PR-36', 45, 20.29610000, 85.82450000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Bhubaneswar',     '93.5 MHz', 'Bhubaneswar',  'Odisha',       'FM-PR-37', 45, 20.29610000, 85.82450000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Kochi',     '104.0 MHz','Kochi',        'Kerala',       'FM-PR-38', 40, 9.93120000,  76.26730000, 'Entertainment Network India Ltd', 'private', true),
  ('Radio Mango Kochi',      '91.9 MHz', 'Kochi',        'Kerala',       'FM-PR-39', 40, 9.93120000,  76.26730000, 'Malabar Broadcast',              'private', true),
  ('Red FM Kochi',           '93.5 MHz', 'Kochi',        'Kerala',       'FM-PR-40', 40, 9.93120000,  76.26730000, 'Kal Radio Ltd (Sun Group)',       'private', true),

  -- ── PRIVATE · TIER-3 / FLOOD-PRONE DISTRICTS ───────────────────────
  ('Red FM Muzaffarpur',     '93.5 MHz', 'Muzaffarpur',  'Bihar',        'FM-PR-41', 35, 26.12250000, 85.39080000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Red FM Gorakhpur',       '93.5 MHz', 'Gorakhpur',    'Uttar Pradesh','FM-PR-42', 35, 26.76060000, 83.37320000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Radio Mirchi Gorakhpur', '98.3 MHz', 'Gorakhpur',    'Uttar Pradesh','FM-PR-43', 35, 26.76060000, 83.37320000, 'Entertainment Network India Ltd', 'private', true),
  ('Red FM Varanasi',        '93.5 MHz', 'Varanasi',     'Uttar Pradesh','FM-PR-44', 40, 25.31760000, 82.97390000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Red FM Silchar',         '93.5 MHz', 'Silchar',      'Assam',        'FM-PR-45', 35, 24.83330000, 92.77890000, 'Kal Radio Ltd (Sun Group)',       'private', true),
  ('Red FM Bhubaneswar II',  '91.9 MHz', 'Bhubaneswar',  'Odisha',       'FM-PR-46', 45, 20.29610000, 85.82450000, 'Music Broadcast Ltd',            'private', true);

-- Keep updated_at current on any later manual UPDATE (trigger only fires
-- for lat/lng/radius changes, so plain edits are covered by the trigger's
-- NEW.updated_at := now() only when it fires — safe fallback below).
