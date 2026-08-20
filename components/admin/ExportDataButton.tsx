"use client";

import { Download } from "lucide-react";

interface ExportDataButtonProps<T extends object> {
  data: T[];
  filename: string;
  label?: string;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );

  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\r\n");
}

export default function ExportDataButton<T extends object>({
  data,
  filename,
  label = "Export CSV",
}: ExportDataButtonProps<T>) {
  const handleExport = () => {
    const rows = data as Record<string, unknown>[];
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-md border border-panel-border bg-panel px-4 py-2 text-sm font-medium text-foreground transition hover:border-amber-400/50 hover:text-amber-300"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}