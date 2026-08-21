"use client";

import React, { Component, type ReactNode } from "react";
import { RefreshCw, AlertTriangle, LifeBuoy } from "lucide-react";
import { captureException } from "@/lib/monitoring/sentry";

export interface SectionErrorBoundaryProps {
  sectionName: string;
  fallbackMessage?: string;
  children: ReactNode;
  onReset?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    const errorId = `SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`[SectionErrorBoundary:${this.props.sectionName}]`, error, errorInfo);
    void captureException(error, {
      section: this.props.sectionName,
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development";
      const { sectionName, fallbackMessage } = this.props;
      const { error, errorId } = this.state;

      return (
        <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-eoc border border-severity-amber-600/40 bg-surface/80 p-6 text-foreground shadow-glow-amber">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-severity-amber-600/50 bg-severity-amber-600/10">
            <AlertTriangle className="h-6 w-6 text-severity-amber-400" />
          </div>

          <p className="eoc-label mt-3 text-severity-amber-400">
            {sectionName.toUpperCase()} DEGRADED
          </p>
          <h2 className="mt-1 text-base font-semibold">Something went wrong</h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            {fallbackMessage || `${sectionName} is temporarily unavailable. Other parts of SafeSphere are functioning normally.`}
          </p>

          <p className="mt-2 text-[10px] font-mono text-slate-500">
            ID: {errorId}
          </p>

          {isDev && error && (
            <div className="mt-3 max-h-28 w-full overflow-y-auto rounded border border-border bg-black/60 p-2 text-left text-[11px] text-severity-red-300">
              <p className="font-bold">{error.name}: {error.message}</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-severity-amber-600 bg-severity-amber-600/10 px-3 py-1.5 text-xs font-bold text-severity-amber-400 transition hover:bg-severity-amber-600/20 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry {sectionName}
            </button>
            <a
              href={`mailto:support@safesphere.gov.in?subject=Issue Report [${errorId}]`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent hover:text-white"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              Support
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
