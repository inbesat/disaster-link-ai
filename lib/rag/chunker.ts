// ---------------------------------------------------------------------
// lib/rag/chunker.ts
// Document chunking + PDF parsing for the RAG pipeline.
//
// Large emergency SOP / plan PDFs won't fit in the LLM context window, so we
// split them into overlapping chunks using LangChain's high-quality
// RecursiveCharacterTextSplitter, then each chunk can be embedded and
// retrieved independently. PDF parsing uses pdf-parse with a graceful
// fallback so a malformed file never crashes the ingestion flow.
// ---------------------------------------------------------------------

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";
import { sanitizeRagText } from "@/lib/ai/llm-guard";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

/**
 * Split raw text into overlapping chunks. Returns an array of strings that
 * are suitable for embedding and storage in the knowledge base.
 */
export async function chunkText(
  text: string,
  chunkSize = 1000,
  chunkOverlap = 200,
): Promise<string[]> {
  if (!text || typeof text !== "string") return [];
  if (text.trim().length === 0) return [];

  // Configure a splitter with the requested sizes (defaults match the
  // module-level instance) and split by sensible boundaries.
  const configured = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });
  const chunks = await configured.splitText(text);
  return chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

/**
 * Convert a PDF file buffer into raw text using pdf-parse. On any failure the
 * number of errors is logged and an empty string is returned so downstream
 * chunking (which ignores empty input) can proceed without interrupting the
 * ingestion pipeline.
 */
export async function extractTextFromPDF(
  buffer: Buffer | Uint8Array,
): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const rawText = result?.text ?? "";
    return sanitizeRagText(rawText);
  } catch (error: unknown) {
    console.warn("[rag] PDF text extraction failed:", error);
    return "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export { splitter };