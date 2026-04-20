"use client";

export type Format = "mp3" | "mp4";

interface Props {
  format: Format;
  onChange: (f: Format) => void;
  videoFormats: { itag: number; qualityLabel: string }[];
  selectedItag: number | null;
  onItagChange: (itag: number | null) => void;
}

export default function FormatSelector({
  format,
  onChange,
  videoFormats,
  selectedItag,
  onItagChange,
}: Props) {
  return (
    <div className="panel animate-fade-in delay-300">
      <div className="panel-header">
        <span>// OUTPUT FORMAT</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Format tabs */}
        <div className="flex">
          <button
            className={`format-tab ${format === "mp3" ? "active" : ""}`}
            onClick={() => onChange("mp3")}
          >
            ♫ MP3
          </button>
          <button
            className={`format-tab format-tab-amber ${format === "mp4" ? "active" : ""}`}
            onClick={() => onChange("mp4")}
          >
            ▶ MP4
          </button>
        </div>

        {/* Format details */}
        <div className="text-xs space-y-1" style={{ color: "var(--fg-dim)" }}>
          {format === "mp3" ? (
            <>
              <InfoRow label="CODEC" value="libmp3lame" />
              <InfoRow label="QUALITY" value="VBR Q2 (~190kbps)" />
              <InfoRow label="CONTAINER" value=".mp3" />
              <InfoRow label="TRIM" value="SUPPORTED ✓" glow />
            </>
          ) : (
            <>
              <InfoRow label="CODEC" value="H.264 + AAC" />
              <InfoRow label="CONTAINER" value=".mp4" />
              <InfoRow label="TRIM" value="SUPPORTED ✓" glow />
              {videoFormats.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div style={{ color: "var(--fg-dim)", letterSpacing: "0.1em" }}>
                    QUALITY_PRESET:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`format-tab format-tab-amber ${selectedItag === null ? "active" : ""}`}
                      style={{ padding: "3px 10px", fontSize: "11px" }}
                      onClick={() => onItagChange(null)}
                    >
                      AUTO
                    </button>
                    {videoFormats.map((vf) => (
                      <button
                        key={vf.itag}
                        className={`format-tab format-tab-amber ${selectedItag === vf.itag ? "active" : ""}`}
                        style={{ padding: "3px 10px", fontSize: "11px" }}
                        onClick={() => onItagChange(vf.itag)}
                      >
                        {vf.qualityLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  glow,
}: {
  label: string;
  value: string;
  glow?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0" style={{ color: "var(--fg-dim)" }}>
        {label}:
      </span>
      <span
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
