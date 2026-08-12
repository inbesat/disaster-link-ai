-- =====================================================================
-- 0003_enable_pgvector.sql
-- Adds pgvector + RAG document storage to the SafeSphere schema.
-- Emergency response plans are stored here with doc_type = 'plan'.
-- NOTE: statements are idempotent (IF NOT EXISTS) so this migration is
-- safe whether or not 0001 has already been applied.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENABLE pgvector
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- 2. RAG DOCUMENT TABLE
-- Columns: id, title, content, metadata (jsonb), embedding vector(1536)
-- If the table already exists (created by 0001), this statement is a
-- no-op and the ALTER statements below guarantee the required columns.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  content    text NOT NULL,
  metadata   jsonb,
  -- 1536-dim embedding for OpenAI text-embedding-3-small / ada-002
  embedding  vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. GUARANTEE COLUMNS (no-op if already present)
-- ---------------------------------------------------------------------
ALTER TABLE public.emergency_documents
  ADD COLUMN IF NOT EXISTS metadata jsonb;

ALTER TABLE public.emergency_documents
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ---------------------------------------------------------------------
-- 4. HNSW INDEX (approximate nearest neighbour search)
-- vector_cosine_ops matches cosine_distance, the metric used by OpenAI
-- embedding models:
--   SELECT * FROM emergency_documents
--   ORDER BY embedding <=> :query_embedding LIMIT 5;
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_emergency_documents_embedding
  ON public.emergency_documents USING hnsw (embedding vector_cosine_ops);
