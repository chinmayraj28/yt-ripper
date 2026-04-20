"use client";

import { useState } from "react";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import TerminalHeader from "@/components/TerminalHeader";
import UrlInput from "@/components/UrlInput";
import VideoInfoPanel from "@/components/VideoInfoPanel";
import TrimControls from "@/components/TrimControls";
import FormatSelector, { type Format } from "@/components/FormatSelector";
import DownloadPanel from "@/components/DownloadPanel";

interface VideoInfo {
  title: string;
  author: string;
  duration: number;
  thumbnail: string | null;
  viewCount: string;
  audioFormats: { itag: number; audioBitrate: number; audioCodec: string }[];
  videoFormats: { itag: number; qualityLabel: string; container: string }[];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [url, setUrl] = useState("");

  const [format, setFormat] = useState<Format>("mp3");
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [selectedItag, setSelectedItag] = useState<number | null>(null);

  function handleInfo(data: VideoInfo, resolvedUrl: string) {
    setInfo(data);
    setUrl(resolvedUrl);
    setStartTime(0);
    setEndTime(data.duration);
    setSelectedItag(null);
  }

  return (
    <div
      className="min-h-screen grid-bg"
      style={{ fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)" }}
    >
      <ScanlineOverlay />
      <TerminalHeader />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Boot sequence */}
        <div
          className="text-xs space-y-0.5 animate-fade-in"
          style={{ color: "var(--fg-dim)", fontFamily: "var(--font-mono)" }}
        >
          {[
            "[BOOT] kernel loaded :: audio-extraction-v2",
            "[BOOT] ffmpeg engine started",
            "[BOOT] ytdl interface ready",
            "[BOOT] all systems nominal — awaiting input",
          ].map((line, i) => (
            <div
              key={i}
              className={`animate-fade-in delay-${(i + 1) * 100}`}
            >
              <span style={{ color: "var(--fg)" }}>▸</span> {line}
            </div>
          ))}
        </div>

        <hr className="divider" />

        {/* URL Input */}
        <UrlInput onInfo={handleInfo} loading={loading} setLoading={setLoading} />

        {/* Results — only when info is loaded */}
        {info && (
          <>
            <VideoInfoPanel info={info} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrimControls
                duration={info.duration}
                startTime={startTime}
                endTime={endTime}
                onStartChange={setStartTime}
                onEndChange={setEndTime}
                enabled={trimEnabled}
                onToggle={setTrimEnabled}
              />

              <FormatSelector
                format={format}
                onChange={setFormat}
                videoFormats={info.videoFormats}
                selectedItag={selectedItag}
                onItagChange={setSelectedItag}
              />
            </div>

            <DownloadPanel
              url={url}
              title={info.title}
              format={format}
              startTime={startTime}
              endTime={endTime}
              trimEnabled={trimEnabled}
              selectedItag={selectedItag}
              duration={info.duration}
            />
          </>
        )}

        {/* Footer */}
        <footer
          className="text-xs pt-4 pb-8 space-y-1"
          style={{ color: "var(--fg-muted)", borderTop: "1px solid var(--border)" }}
        >
          <div>{"// YT-RIPPER v2.4.1 :: AUDIO EXTRACTION TERMINAL"}</div>
          <div>{"// built with next.js + ffmpeg + ytdl-core"}</div>
          <div style={{ color: "var(--red)", textShadow: "var(--glow-red)" }}>
            {"// WARNING: USE FOR PERSONAL & EDUCATIONAL PURPOSES ONLY"}
          </div>
        </footer>
      </main>
    </div>
  );
}
