-- =====================================================================
-- 0011_seed_emergency_documents.sql
-- Seeds the emergency_documents knowledge base (RAG) with a few reference
-- plans. Embeddings are left NULL here; the retrieval layer falls back to
-- keyword search when no embedding provider is configured. When an embedding
-- model IS available, POST /api/retrieval/embed back-fills the vectors.
-- Run in: Supabase Dashboard -> SQL Editor -> Run (after 0010).
-- =====================================================================

INSERT INTO public.emergency_documents (title, doc_type, content, metadata)
SELECT title, doc_type, content, metadata
FROM (VALUES
  (
    'Flood Evacuation Standard Operating Procedure',
    'procedure'::text,
    'In a CRITICAL flood risk, the District Control Room must: 1) Immediately place affected riverside wards under EVACUATE status via the Command Center. 2) Activate the Mass Evacuation Planner and assign evacuees to the nearest open shelter within 10 km. 3) Deploy buses and NDRF boats per the fleet allocation result; lead convoy with a road-flood safety check. 4) Broadcast an alert to responders by SMS and browser push, and publish the evacuation zones. 5) Track convoys on the Evacuation Tracker until all villages are marked COMPLETE.',
    '{"audience":"district_admin","hazard":["flood","cyclone"]}'::jsonb
  ),
  (
    'Shelter Management & Capacity Protocol',
    'procedure'::text,
    'Shelters accept evacuees while current_occupancy is below capacity. When occupancy reaches capacity, set shelter status to FULL and alert the command center to route evacuees to the next nearest available shelter. Maintain water, food, medical kits, and electricity. Field responders update real-time occupancy from the Field Occupancy Updater. Use the shelter CSV import to bulk-register shelters with lat/lng and facilities.',
    '{"audience":"field_responder","hazard":["flood","landslide"]}'::jsonb
  ),
  (
    'Critical Alert Distribution Rules',
    'procedure'::text,
    'Critical alerts (risk_level CRITICAL or EVACUATE) are texted via SMS to all field responders and broadcast to the in-app notification center and browser push. Alerts are de-duplicated to one per district per 6 hours. The Alert Simulator can force a demo alert without affecting real recipients. Responders must acknowledge alerts from the notification center for audit logging.',
    '{"audience":"district_admin","hazard":["flood","cyclone"]}'::jsonb
  ),
  (
    'Flood Risk Levels and Responses',
    'report'::text,
    'Risk levels GATE: SAFE no action; WATCH continue weather monitoring, pre-position boats; WARNING prepare evacuation and notify vulnerable villages; EVACUATE/Critical move people to shelters immediately. The What-If Simulator and the 72-hour forecast time-slider show how predicted rainfall changes the risk polygon and affected population estimate.',
    '{"audience":"all","hazard":["flood"]}'::jsonb
  )
) AS seed(title, doc_type, source)
WHERE NOT EXISTS (SELECT 1 FROM public.emergency_documents LIMIT 1);