"use client";

import { useEffect, useState } from "react";

const ASCII_LOGO = `
██╗   ██╗████████╗    ██████╗ ██╗██████╗ ██████╗ ███████╗██████╗
╚██╗ ██╔╝╚══██╔══╝    ██╔══██╗██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
 ╚████╔╝    ██║       ██████╔╝██║██████╔╝██████╔╝█████╗  ██████╔╝
  ╚██╔╝     ██║       ██╔══██╗██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗
   ██║      ██║       ██║  ██║██║██║     ██║     ███████╗██║  ██║
   ╚═╝      ╚═╝       ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝`.trim();

const STATUS_LINES = [
  "sys.audio.extraction v2.4.1",
  "ffmpeg engine :: READY",
  "ytdl-core :: CONNECTED",
  "trim engine :: ACTIVE",
];

export default function TerminalHeader() {
  const [time, setTime] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().replace("T", " ").slice(0, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setStatusIdx((i) => (i + 1) % STATUS_LINES.length),
      2500
    );
    return () => clearInterval(id);
  }, []);

  return (
    <header className="grid-bg border-b" style={{ borderColor: "var(--border)" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-1 text-xs"
        style={{ background: "var(--fg)", color: "var(--bg)", fontFamily: "var(--font-mono)" }}
      >
        <span className="font-bold tracking-widest">
          ROOT@YT-RIPPER:~#
        </span>
        <span className="opacity-70">{time}</span>
        <span className="font-bold">PID:7734 &nbsp;[OK]</span>
      </div>

      {/* ASCII logo + status */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-6 py-6">
        <div className="ascii-art" style={{ fontSize: "clamp(5px, 1vw, 12px)" }}>
          {ASCII_LOGO}
        </div>

        <div
          className="text-xs space-y-1 min-w-[260px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}
        >
          {STATUS_LINES.map((line, i) => (
            <div key={line} className="flex items-center gap-2">
              <span
                className="pulse-dot"
                style={{
                  background: i === statusIdx ? "var(--fg)" : "var(--fg-muted)",
                  boxShadow: i === statusIdx ? "0 0 6px var(--fg)" : "none",
                  transition: "all 0.3s",
                }}
              />
              <span
                style={{
                  color: i === statusIdx ? "var(--fg)" : "var(--fg-dim)",
                  textShadow: i === statusIdx ? "var(--glow-text)" : "none",
                  transition: "all 0.3s",
                }}
              >
                {line}
              </span>
            </div>
          ))}

          <div className="pt-2" style={{ color: "var(--border-bright)", opacity: 0.4 }}>
            {"─".repeat(36)}
          </div>
          <div style={{ color: "var(--amber)", textShadow: "var(--glow-amber)" }}>
            ⚠ FOR PERSONAL USE ONLY. RESPECT COPYRIGHT.
          </div>
        </div>
      </div>

      {/* Command line */}
      <div
        className="px-6 pb-3 text-xs flex items-center gap-2"
        style={{ color: "var(--fg-dim)", fontFamily: "var(--font-mono)" }}
      >
        <span>$</span>
        <span className="typewriter-slow" style={{ color: "var(--fg)", textShadow: "var(--glow-text)" }}>
          ./yt-ripper --mode=extract --trim=enabled --output=mp3,mp4 --quality=high
        </span>
        <span className="cursor" />
      </div>
    </header>
  );
}
