"use client";

import { useRef, useState } from "react";
import { Loader2, FileUp, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { ingestDocument } from "@/app/actions/documents";
import RAGDebugger from "@/components/rag/RAGDebugger";
import CostTracker from "@/components/rag/CostTracker";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const DISTRICTS = ["Patna", "Ernakulam", "Kamrup", "Kochi", "Guwahati"];

const DOCUMENT_TYPES = [
  "Evacuation Protocol",
  "DDMP (District Disaster Management Plan)",
  "Medical Triaging",
  "Shelter Management",
  "Resource Allocation",
  "Communication & Alerts",
  "Other",
];

const DEFAULT_DOCUMENT_TYPE = DOCUMENT_TYPES[1];

export default function KnowledgeBasePage() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [district, setDistrict] = useState<string>(DISTRICTS[0]);
  const [documentType, setDocumentType] = useState<string>(DEFAULT_DOCUMENT_TYPE);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ingested: number;
    chunks: number;
    message?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function titleFor(file: File): string {
    return file.name.replace(/\.[a-zA-Z0-9]+$/, "").trim() || "Untitled document";
  }

  async function handleSubmit() {
    if (!file) {
      toast.error("Select a PDF to upload first.");
      return;
    }
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", titleFor(file));
    formData.append("district", district);
    formData.append("document_type", documentType);

    const res = await ingestDocument(formData);
    setLoading(false);

    if (res.ok && res.ingested > 0) {
      toast.success(
        `Ingested ${res.ingested} chunk${res.ingested === 1 ? "" : "s"} into the knowledge base.`,
      );
      setResult({ ingested: res.ingested, chunks: res.chunks });
    } else {
      const message = res.message ?? "Could not ingest the document.";
      toast.error(message);
      setResult({ ingested: 0, chunks: res.chunks, message });
    }
    setFile(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (inputRef.current) (inputRef.current as any).value = "";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="eoc-label text-accent">
          RAG {t("knowledge_base").toUpperCase()} · PHASE 15
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t("knowledge_base")}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload District Disaster Management Plans (DDMPs) and SOPs. They are
          chunked, embedded, and made retrievable by the AI planner via vector
          search.
        </p>
      </div>

      {/* Top row: cost-transparency widget (Step 10) */}
      <div className="mb-6">
        <CostTracker />
      </div>

      <div className="rounded-eoc border border-border bg-surface p-6 shadow-glow-accent">
        {/* Drag-and-drop upload zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload PDF"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped && dropped.type === "application/pdf") {
              setFile(dropped);
              setResult(null);
            } else if (dropped) {
              toast.error("Please drop a PDF file.");
            }
          }}
          className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-eoc border-2 border-dashed px-4 text-center transition ${
            dragOver
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-surface-muted/40 text-slate-400"
          }`}
        >
          <FileUp className="h-8 w-8" aria-hidden />
          <p className="text-sm font-semibold">
            {file ? file.name : "Drag & drop a PDF here, or tap to browse"}
          </p>
          <p className="text-[11px] text-slate-500">
            The document is chunked into overlapping segments and embedded via
            pgvector (1536-dim).
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) setFile(picked);
          }}
        />

        {/* Metadata fields */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="eoc-label">DISTRICT TAG</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-sm outline-none focus:border-accent"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="eoc-label">DOCUMENT TYPE</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-sm outline-none focus:border-accent"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={loading || !file}
          onClick={() => void handleSubmit()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-glow-accent transition hover:bg-sky-300 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Chunking and embedding document…
            </>
          ) : (
            "Upload to Knowledge Base"
          )}
        </button>

        {/* Result summary */}
        {result && !loading && (
          <div className="mt-5 flex items-start gap-3 rounded-eoc border border-severity-green-600/50 bg-severity-green-600/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-severity-green-400" aria-hidden />
            <div>
              <p className="text-sm font-bold text-severity-green-300">
                {result.ingested > 0
                  ? `Stored ${result.ingested} chunk${result.ingested === 1 ? "" : "s"} (${result.chunks} total).`
                  : "Document not stored."}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {result.message ??
                  "The AI planner can now retrieve these segments with vector search."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RAG transparency / debugger (Step 7) */}
      <RAGDebugger />
    </div>
  );
}