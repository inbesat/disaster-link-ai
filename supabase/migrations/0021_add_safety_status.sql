-- ---------------------------------------------------------------------
-- 0021_add_safety_status.sql — Phase 13 · Step 4 · SMS fallback status
--
-- Citizens with no internet text "SAFE" to the Twilio webhook
-- (app/api/webhooks/sms). The status is persisted here so family and
-- responders can see it — mirroring the in-app drip:i-am-safe flow
-- (which is per-browser localStorage only).
--
-- Mirrors the new fields on prisma/schema.prisma (User.safetyStatus /
-- User.lastSafeAt). Run in the Supabase SQL editor:
--   psql "$DATABASE_URL" -f supabase/migrations/0021_add_safety_status.sql
-- ---------------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS safety_status TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_safe_at   TIMESTAMPTZ;

COMMENT ON COLUMN users.safety_status IS
  'Phase 13 · Step 4 — SMS-fallback safety status (unknown | safe).';
COMMENT ON COLUMN users.last_safe_at IS
  'Phase 13 · Step 4 — when the citizen last texted SAFE to the webhook.';
