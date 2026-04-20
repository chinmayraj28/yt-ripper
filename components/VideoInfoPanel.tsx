"use client";

import Image from "next/image";
import { formatDuration, formatViews, asciiBar } from "@/lib/utils";

interface VideoInfo {
  title: string;
  author: string;
  duration: number;
  thumbnail: string | null;
  viewCount: string;
}

interface Props {
  info: VideoInfo;
}

export default function VideoInfoPanel({ info }: Props) {
  const dur = info.duration;
  const maxDur = Math.max(dur, 600);

  return (
    <div className="panel panel-bright animate-fade-in delay-100">
      <div className="panel-header">
        <span>// METADATA DUMP</span>
        <span className="badge-ok">■ RESOLVED</span>
      </div>

      <div className="p-4 flex flex-col sm:flex-row gap-5">
        {/* Thumbnail */}
        {info.thumbnail && (
          <div
            className="shrink-0 relative"
            style={{
              border: "1px solid var(--border)",
              width: 160,
              height: 90,
              overflow: "hidden",
            }}
          >
            <Image
              src={info.thumbnail}
              alt="thumbnail"
              fill
              style={{ objectFit: "cover", filter: "saturate(0.6) contrast(1.1)" }}
              sizes="160px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)",
              }}
            />
            <div
              className="absolute bottom-0 right-0 text-xs px-1"
              style={{ background: "var(--fg)", color: "var(--bg)", fontWeight: 700 }}
            >
              {formatDuration(dur)}
            </div>
          </div>
        )}

        {/* Meta fields */}
        <div className="flex-1 space-y-2 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
          <MetaRow label="TITLE" value={info.title} glow />
          <MetaRow label="AUTHOR" value={info.author} />
          <MetaRow label="VIEWS" value={formatViews(info.viewCount)} />
          <MetaRow label="DURATION" value={formatDuration(dur)} />

          {/* Duration bar */}
          <div className="pt-1">
            <div style={{ color: "var(--fg-dim)", marginBottom: 4 }}>DURATION_BAR</div>
            <div
              className="text-xs font-mono"
              style={{ color: "var(--fg)", textShadow: "var(--glow-text)" }}
            >
              {asciiBar(dur, maxDur, 28)} {formatDuration(dur)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  glow,
}: {
  label: string;
  value: string;
  glow?: boolean;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="shrink-0 w-20"
        style={{ color: "var(--fg-dim)", letterSpacing: "0.1em" }}
      >
        {label}:
      </span>
      <span
        className="break-all"
        style={{
          color: "var(--fg)",
          textShadow: glow ? "var(--glow-text)" : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}
