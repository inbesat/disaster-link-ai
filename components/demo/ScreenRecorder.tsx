"use client";

// ---------------------------------------------------------------------
// components/demo/ScreenRecorder.tsx — Phase 15 · Step 8 · Highlight Reel.
//
// Hidden pitch utility that records the /demo screen straight to disk —
// a 60-second highlight reel for Twitter / LinkedIn / the Devpost video.
//
//   • An almost-invisible red record dot pins to the bottom-right corner
//     of the presentation screen (mount inside DemoPresentation).
//   • Click 1 → navigator.mediaDevices.getDisplayMedia() — the browser
//     lets the presenter pick the tab/window, then recording starts.
//   • Click 2 → the captured stream is written to a .webm file and the
//     download starts instantly (no server involved — fully client-side).
//   • If the presenter ends sharing from the browser toolbar mid-take,
//     the reel is finalised automatically instead of going to waste.
//
// MediaRecorder output is .webm (Chrome/Edge/Firefox native). For an .mp4
// the clip would need server-side or ffmpeg transcoding — .webm uploads
// directly to Devpost/X/LinkedIn in practice.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type RecorderState = "idle" | "requesting" | "recording";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatElapsed(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ScreenRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  // Set once the component unmounts — ends-of-tracks from our own cleanup
  // must NOT auto-finalise/download a reel the presenter never saved.
  const detachedRef = useRef(false);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const finalizeDownload = (recorder: MediaRecorder) => {
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bharat-shakti-demo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  // Cleanup on unmount — stop the stream but do not auto-download.
  useEffect(() => {
    return () => {
      detachedRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopTracks();
      recorderRef.current = null;
    };
  }, []);

  async function toggle() {
    if (state === "recording") {
      recorderRef.current?.stop();
      setState("idle");
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    if (state === "requesting") return;

    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      toast.error("Screen recording is not supported in this browser.");
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.addEventListener("ended", () => {
        // Browser toolbar "Stop sharing" — finalise so the take isn't lost.
        if (!detachedRef.current && recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      });

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        if (!detachedRef.current) finalizeDownload(recorder);
        stopTracks();
        recorderRef.current = null;
      });

      recorder.start(250);
      setState("recording");
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
      toast.success("Recording — click the red dot again to save your reel.");
    } catch {
      // Permission denied or the share picker was cancelled — stay quiet.
      setState("idle");
      toast.error("Screen capture cancelled.");
    }
  }

  const isRecording = state === "recording";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === "requesting"}
      aria-label={isRecording ? "Stop recording and download highlight reel" : "Record pitch highlight reel"}
      title="Highlight reel (records the tab)"
      className={`group fixed bottom-5 right-5 z-10 flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 backdrop-blur-md transition
        ${
          isRecording
            ? "border-red-400/70 bg-red-500/20 text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.35)]"
            : "border-white/10 bg-black/50 text-slate-400 opacity-40 hover:opacity-100"
        }`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {isRecording && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            isRecording ? "bg-red-400" : "bg-white/60"
          }`}
        />
      </span>
      <span className="font-mono text-[10px] font-bold tabular-nums">
        {isRecording ? formatElapsed(elapsed) : "REC"}
      </span>
    </button>
  );
}