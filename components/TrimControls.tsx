"use client";

import { secondsToTimeString } from "@/lib/utils";

interface Props {
  duration: number;
  startTime: number;
  endTime: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}

export default function TrimControls({
  duration,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  enabled,
  onToggle,
}: Props) {
  const selectedDuration = endTime - startTime;
  const pctStart = (startTime / duration) * 100;
  const pctEnd = (endTime / duration) * 100;

  function handleStartChange(v: number) {
    if (v < endTime - 1) onStartChange(v);
  }

  function handleEndChange(v: number) {
    if (v > startTime + 1) onEndChange(v);
  }

  return (
    <div className="panel animate-fade-in delay-200">
      <div className="panel-header panel-header-amber">
        <span>// TRIM ENGINE</span>
        <button
          onClick={() => onToggle(!enabled)}
          className="text-xs font-bold px-2 py-0.5 cursor-pointer"
          style={{
            background: enabled ? "var(--bg)" : "transparent",
            color: enabled ? "var(--amber)" : "rgba(0,0,0,0.5)",
            border: "1px solid rgba(0,0,0,0.3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {enabled ? "[ENABLED]" : "[DISABLED]"}
        </button>
      </div>

      <div
        className="p-4 space-y-5"
        style={{ opacity: enabled ? 1 : 0.35, transition: "opacity 0.2s" }}
      >
        {/* Timeline visualization */}
        <div>
          <div className="flex justify-between text-xs mb-2" style={{ color: "var(--fg-dim)" }}>
            <span>00:00</span>
            <span style={{ color: "var(--amber)", textShadow: "var(--glow-amber)" }}>
              SELECTION: {secondsToTimeString(startTime)} → {secondsToTimeString(endTime)}{" "}
              ({secondsToTimeString(selectedDuration)})
            </span>
            <span>{secondsToTimeString(duration)}</span>
          </div>

          {/* Visual timeline */}
          <div
            className="relative h-5"
            style={{ background: "var(--fg-muted)", border: "1px solid var(--border)" }}
          >
            {/* Selected region */}
            <div
              className="absolute top-0 h-full"
              style={{
                left: `${pctStart}%`,
                width: `${pctEnd - pctStart}%`,
                background: "var(--amber)",
                opacity: 0.5,
                boxShadow: "0 0 6px var(--amber)",
              }}
            />
            {/* Start marker */}
            <div
              className="absolute top-0 h-full w-0.5"
              style={{ left: `${pctStart}%`, background: "var(--fg)", boxShadow: "var(--glow)" }}
            />
            {/* End marker */}
            <div
              className="absolute top-0 h-full w-0.5"
              style={{ left: `${pctEnd}%`, background: "var(--fg)", boxShadow: "var(--glow)" }}
            />
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <SliderRow
            label="START"
            value={startTime}
            min={0}
            max={duration}
            onChange={handleStartChange}
            disabled={!enabled}
            color="green"
          />
          <SliderRow
            label="END"
            value={endTime}
            min={0}
            max={duration}
            onChange={handleEndChange}
            disabled={!enabled}
            color="amber"
          />
        </div>

        {/* Manual time inputs */}
        <div className="flex gap-6 text-xs">
          <TimeInput
            label="START_TIME"
            value={secondsToTimeString(startTime)}
            onChange={(val) => {
              const secs = parseTimeInput(val);
              if (!isNaN(secs)) handleStartChange(Math.min(secs, duration));
            }}
            disabled={!enabled}
          />
          <TimeInput
            label="END_TIME"
            value={secondsToTimeString(endTime)}
            onChange={(val) => {
              const secs = parseTimeInput(val);
              if (!isNaN(secs)) handleEndChange(Math.min(secs, duration));
            }}
            disabled={!enabled}
          />
        </div>

        {/* ASCII duration bar */}
        <div className="text-xs" style={{ color: "var(--amber)", textShadow: "var(--glow-amber)" }}>
          {`EXTRACT: [${buildBar(startTime, endTime, duration, 30)}] ${Math.round((selectedDuration / duration) * 100)}%`}
        </div>
      </div>
    </div>
  );
}

function buildBar(start: number, end: number, total: number, width: number): string {
  const s = Math.round((start / total) * width);
  const e = Math.round((end / total) * width);
  return (
    "░".repeat(s) +
    "█".repeat(Math.max(0, e - s)) +
    "░".repeat(Math.max(0, width - e))
  );
}

function parseTimeInput(val: string): number {
  const parts = val.split(":").map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled: boolean;
  color: "green" | "amber";
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "var(--fg-dim)" }}>{label}:</span>
        <span
          style={{
            color: color === "amber" ? "var(--amber)" : "var(--fg)",
            textShadow: color === "amber" ? "var(--glow-amber)" : "var(--glow-text)",
          }}
        >
          {secondsToTimeString(value)}
        </span>
      </div>
      <input
        type="range"
        className={color === "amber" ? "amber-thumb" : ""}
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ color: "var(--fg-dim)", letterSpacing: "0.1em" }}>{label}:</span>
      <input
        type="text"
        className="terminal-input"
        style={{ width: "100px" }}
        defaultValue={value}
        key={value}
        onBlur={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="mm:ss"
        spellCheck={false}
      />
    </div>
  );
}
