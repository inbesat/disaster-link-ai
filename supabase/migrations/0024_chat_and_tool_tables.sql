-- =====================================================================
-- 0024_chat_and_tool_tables.sql
-- Phase 10/11 · Persistence — chat sessions, messages, and tool call logs.
--
-- Run in Supabase SQL editor: paste + Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CHAT SESSIONS — one row per AI planning conversation
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title      TEXT NOT NULL DEFAULT 'New Conversation',
    district   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_demo    BOOLEAN NOT NULL DEFAULT false,
    session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at);

-- RLS: users see only their own sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_sessions_owner ON public.chat_sessions;
CREATE POLICY chat_sessions_owner ON public.chat_sessions
  FOR ALL USING (
    user_id = auth.uid()
    OR public.current_user_role() IN ('super_admin', 'district_admin')
    OR user_id IS NULL  -- demo sessions
  );

-- ---------------------------------------------------------------------
-- 2. CHAT MESSAGES — individual messages within a session
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role       TEXT NOT NULL,  -- user | assistant | tool
    content    TEXT NOT NULL,
    tool_name  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- RLS: access via parent session ownership
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_session_owner ON public.chat_messages;
CREATE POLICY chat_messages_session_owner ON public.chat_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM public.chat_sessions)
  );

-- ---------------------------------------------------------------------
-- 3. TOOL CALL LOGS — persistent record of AI tool invocations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tool_call_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tool_name   TEXT NOT NULL,
    input       JSONB,
    output      JSONB,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    success     BOOLEAN NOT NULL DEFAULT true,
    error       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_call_logs_tool_name ON public.tool_call_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_call_logs_created_at ON public.tool_call_logs(created_at);

-- RLS: gov users can read logs; only system can insert
ALTER TABLE public.tool_call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tool_call_logs_read ON public.tool_call_logs;
CREATE POLICY tool_call_logs_read ON public.tool_call_logs
  FOR SELECT USING (
    public.current_user_role() IN ('super_admin', 'district_admin')
  );

-- =====================================================================
-- VERIFY:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN ('chat_sessions','chat_messages','tool_call_logs');
-- All should show rowsecurity = true.
-- =====================================================================
