"use client";

import { useState } from "react";
import { secondsToTimeString } from "@/lib/utils";
import type { Format } from "./FormatSelector";

interface Props {
  url: string;
  title: string;
  format: Format;
  startTime: number;
  endTime: number;
  trimEnabled: boolean;
  selectedItag: number | null;
  duration: number;
}

type DownloadState = "idle" | "downloading" | "done" | "error";

export default function DownloadPanel({
  url,
  title,
  format,
  startTime,
  endTime,
  trimEnabled,
  selectedItag,
  duration,
}: Props) {
  const [state, setState] = useState<DownloadState>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const pushLog = (msg: string) => setLog((p) => [...p, msg]);

  async function handleDownload() {
    setState("downloading");
    setLog([]);
    setProgress(0);

    pushLog(`> initializing download pipeline...`);
    pushLog(`> format: ${format.toUpperCase()}`);

    if (trimEnabled) {
      pushLog(
        `> trim: ${secondsToTimeString(startTime)} → ${secondsToTimeString(endTime)}`
      );
    } else {
      pushLog(`> trim: disabled (full track)`);
    }

    pushLog(`> spawning ffmpeg process...`);

    // Animate progress while streaming
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 3, 85);
      setProgress(Math.round(fakeProgress));
    }, 400);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          format,
          startTime: trimEnabled ? startTime : undefined,
          endTime: trimEnabled ? endTime : undefined,
          itag: format === "mp4" ? selectedItag : undefined,
          title,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json();
        pushLog(`> [ERR] ${err.error}`);
        setState("error");
        setProgress(0);
        return;
      }

      pushLog(`> receiving stream...`);
      setProgress(90);

      const blob = await res.blob();
      const ext = format === "mp3" ? "mp3" : "mp4";
      const fileName = `${title.replace(/[^\w\s]/g, "").trim().replace(/\s+/g, "_").slice(0, 60)}.${ext}`;

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);

      setProgress(100);
      pushLog(`> [OK] download complete: ${fileName}`);
      pushLog(`> file size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      setState("done");
    } catch (err) {
      clearInterval(progressInterval);
      pushLog(`> [ERR] ${err instanceof Error ? err.message : "unknown error"}`);
      setState("error");
      setProgress(0);
    }
  }

  const pctStr = `${progress}%`;
  const barWidth = 26;
  const filled = Math.round((progress / 100) * barWidth);

  return (
    <div
      className="panel panel-bright animate-fade-in delay-400"
      style={{ borderColor: state === "error" ? "var(--red)" : undefined }}
    >
      <div
        className="panel-header"
        style={{
          background:
            state === "error"
              ? "var(--red)"
              : state === "done"
              ? "var(--fg)"
              : "var(--fg)",
        }}
      >
        <span>// DOWNLOAD PIPELINE</span>
        <span>
          {state === "idle" && "READY"}
          {state === "downloading" && "PROCESSING..."}
          {state === "done" && "[OK] COMPLETE"}
          {state === "error" && "[ERR] FAILED"}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Config summary */}
        <div className="text-xs space-y-1" style={{ color: "var(--fg-dim)" }}>
          <div>
            <span style={{ color: "var(--fg-dim)" }}>OUTPUT: </span>
            <span style={{ color: "var(--fg)", textShadow: "var(--glow-text)" }}>
              {format.toUpperCase()}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--fg-dim)" }}>TRIM: </span>
            <span style={{ color: trimEnabled ? "var(--amber)" : "var(--fg-dim)" }}>
              {trimEnabled
                ? `${secondsToTimeString(startTime)} → ${secondsToTimeString(endTime)} (${secondsToTimeString(endTime - startTime)})`
                : "DISABLED (FULL TRACK)"}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--fg-dim)" }}>TOTAL_DUR: </span>
            <span style={{ color: "var(--fg)" }}>{secondsToTimeString(duration)}</span>
          </div>
        </div>

        <hr className="divider" />

        {/* Progress bar */}
        {(state === "downloading" || state === "done") && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "var(--fg-dim)" }}>
              <span>PROGRESS</span>
              <span style={{ color: "var(--fg)" }}>{pctStr}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: pctStr }} />
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--fg)", textShadow: "var(--glow-text)" }}
            >
              {`[${"█".repeat(filled)}${"░".repeat(barWidth - filled)}] ${pctStr}`}
            </div>
          </div>
        )}

        {/* Terminal log */}
        {log.length > 0 && (
          <div
            className="text-xs space-y-0.5 max-h-32 overflow-y-auto p-2"
            style={{
              border: "1px solid var(--border)",
              background: "rgba(0,5,0,0.5)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {log.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.includes("[OK]")
                    ? "var(--fg)"
                    : line.includes("[ERR]")
                    ? "var(--red)"
                    : "var(--fg-dim)",
                  textShadow: line.includes("[OK]") ? "var(--glow-text)" : "none",
                }}
              >
                {line}
              </div>
            ))}
            {state === "downloading" && (
              <div style={{ color: "var(--fg-dim)" }}>
                {">"} <span className="cursor" style={{ width: "0.5em", height: "0.8em" }} />
              </div>
            )}
          </div>
        )}

        {/* Button */}
        <div className="flex gap-4 items-center">
          <button
            className={`btn btn-large ${format === "mp4" ? "btn-amber" : ""}`}
            onClick={handleDownload}
            disabled={state === "downloading"}
          >
            {state === "downloading"
              ? "PROCESSING"
              : state === "done"
              ? "DOWNLOAD AGAIN"
              : `DOWNLOAD ${format.toUpperCase()}`}
          </button>

          {state !== "idle" && (
            <button
              className="btn"
              onClick={() => {
                setState("idle");
                setLog([]);
                setProgress(0);
              }}
            >
              RESET
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
