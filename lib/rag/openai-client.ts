import OpenAI from "openai";

// ---------------------------------------------------------------------
// lib/rag/openai-client.ts
// Single shared OpenAI-compatible client for the RAG pipeline.
//
// Defaults to the DeepSeek API (OpenAI-compatible) since DeepSeek is the
// recommended RAG model for this platform. All settings can be overridden
// through environment variables so the pipeline runs against any
// OpenAI-compatible endpoint:
//   - OPENAI_API_KEY        : bearer token (DeepSeek / OpenAI / other)
//   - OPENAI_BASE_URL       : full base URL, e.g. DeepSeek's endpoint
//   - RAG_MODEL             : chat/completion model id (default deepseek-chat)
// ---------------------------------------------------------------------

const RAG_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";

const RAG_MODEL = process.env.RAG_MODEL || "deepseek-chat";

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
  baseURL: RAG_BASE_URL,
});

export { RAG_MODEL };

export { RAG_BASE_URL };