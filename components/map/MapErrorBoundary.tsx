"use client";

import React, { Component, type ReactNode } from "react";
import { MapPinOff, RefreshCw } from "lucide-react";
import { captureException } from "@/lib/monitoring/sentry";

export interface MapErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    const errorId = `MAP-ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[MapErrorBoundary]", error, errorInfo);
    void captureException(error, {
      section: "Map",
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
      return (
        <div className="flex h-full min-h-[350px] w-full flex-col items-center justify-center rounded-eoc border border-severity-amber-600/40 bg-surface/90 p-6 text-foreground shadow-glow-amber">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-severity-amber-600/60 bg-severity-amber-600/10">
            <MapPinOff className="h-7 w-7 text-severity-amber-400" />
          </div>

          <p className="eoc-label mt-4 text-severity-amber-400">MAP SERVICE UNAVAILABLE</p>
          <h2 className="mt-1 text-base font-bold">Interactive map hit a rendering error</h2>
          <p className="mt-2 max-w-sm text-center text-xs text-slate-400">
            {this.props.fallbackMessage ||
              "The interactive map engine encountered an unexpected error. Emergency lists, shelter search, and broadcast tools remain operational."}
          </p>

          <p className="mt-2 text-[10px] font-mono text-slate-500">
            Error ID: {this.state.errorId}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-severity-amber-600 bg-severity-amber-600/10 px-4 py-2 text-xs font-bold text-severity-amber-400 transition hover:bg-severity-amber-600/20 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Map
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
