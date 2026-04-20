"use client";

import { useState, useRef } from "react";

interface VideoInfo {
  title: string;
  author: string;
  duration: number;
  thumbnail: string | null;
  viewCount: string;
  audioFormats: { itag: number; audioBitrate: number; audioCodec: string }[];
  videoFormats: { itag: number; qualityLabel: string; container: string }[];
}

interface Props {
  onInfo: (info: VideoInfo, url: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export default function UrlInput({ onInfo, loading, setLoading }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pushLog = (msg: string) => setLog((prev) => [...prev.slice(-4), msg]);

  async function handleFetch() {
    setError("");
    if (!url.trim()) {
      setError("ERR: no target URL provided");
      return;
    }
    setLoading(true);
    setLog([]);
    pushLog("> initializing connection...");
    pushLog(`> target: ${url.slice(0, 50)}...`);

    try {
      pushLog("> querying yt servers...");
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(`ERR ${res.status}: ${data.error}`);
        pushLog(`> [FAILED] ${data.error}`);
        return;
      }

      pushLog(`> [OK] metadata received`);
      pushLog(`> title: "${data.title.slice(0, 40)}"`);
      onInfo(data, url);
    } catch {
      setError("ERR: network failure — check connection");
      pushLog("> [ERR] connection dropped");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleFetch();
  }

  return (
    <div className="panel animate-fade-in">
      <div className="panel-header">
        <span>// INPUT TERMINAL</span>
        <span style={{ opacity: 0.6 }}>ctrl+enter to execute</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Prompt + input */}
        <div className="flex items-center gap-3">
          <span
            className="shrink-0 text-sm font-bold"
            style={{ color: "var(--amber)", textShadow: "var(--glow-amber)" }}
          >
            root@ripper:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input flex-1"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="YouTube URL"
          />
        </div>

        {/* Log output */}
        {log.length > 0 && (
          <div
            className="text-xs space-y-0.5 pl-2"
            style={{
              borderLeft: "2px solid var(--border)",
              color: "var(--fg-dim)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {log.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.includes("[OK]")
                    ? "var(--fg)"
                    : line.includes("[ERR]") || line.includes("[FAILED]")
                    ? "var(--red)"
                    : "var(--fg-dim)",
                  textShadow: line.includes("[OK]") ? "var(--glow-text)" : "none",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="badge-err text-xs font-bold">{error}</div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            className="btn btn-large"
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? "FETCHING..." : "EXECUTE"}
          </button>
          <button
            className="btn"
            onClick={() => {
              setUrl("");
              setError("");
              setLog([]);
            }}
            disabled={loading}
          >
            CLEAR
          </button>
          {loading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-dim)" }}>
              <span className="pulse-dot" />
              <span>resolving...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
