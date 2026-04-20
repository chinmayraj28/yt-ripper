#!/usr/bin/env node
/**
 * Downloads the correct yt-dlp binary for the current platform into ./bin/yt-dlp.
 * Run automatically via `postinstall`. Safe to re-run (skips if already present).
 * Required for Vercel deployment where yt-dlp is not pre-installed.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const BIN_DIR = path.join(__dirname, "..", "bin");
const YTDLP_PATH = path.join(BIN_DIR, "yt-dlp");

if (fs.existsSync(YTDLP_PATH)) {
  console.log("yt-dlp already present, skipping download.");
  process.exit(0);
}

const platform = process.platform;
const arch = process.arch;

// Map to yt-dlp release asset names
const ASSET_MAP = {
  linux: { x64: "yt-dlp_linux", arm64: "yt-dlp_linux_aarch64" },
  darwin: { x64: "yt-dlp_macos_legacy", arm64: "yt-dlp_macos" },
};

const assets = ASSET_MAP[platform];
if (!assets) {
  console.log(`[yt-dlp] Platform "${platform}" not auto-downloadable — skipping.`);
  process.exit(0);
}

const filename = assets[arch] ?? assets.x64;
const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${filename}`;

fs.mkdirSync(BIN_DIR, { recursive: true });

console.log(`[yt-dlp] Downloading ${filename} for ${platform}/${arch}...`);
try {
  execSync(`curl -fsSL "${url}" -o "${YTDLP_PATH}" && chmod +x "${YTDLP_PATH}"`, {
    stdio: "inherit",
  });
  console.log(`[yt-dlp] Saved to ${YTDLP_PATH}`);
} catch (err) {
  console.warn(`[yt-dlp] Download failed: ${err.message}`);
  console.warn("[yt-dlp] Falling back to system yt-dlp if available.");
}
