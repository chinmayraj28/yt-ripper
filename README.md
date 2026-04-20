# YT-RIPPER // AUDIO EXTRACTION TERMINAL

```
██╗   ██╗████████╗    ██████╗ ██╗██████╗ ██████╗ ███████╗██████╗
╚██╗ ██╔╝╚══██╔══╝    ██╔══██╗██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
 ╚████╔╝    ██║       ██████╔╝██║██████╔╝██████╔╝█████╗  ██████╔╝
  ╚██╔╝     ██║       ██╔══██╗██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗
   ██║      ██║       ██║  ██║██║██║     ██║     ███████╗██║  ██║
   ╚═╝      ╚═╝       ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝
```

> Advanced YouTube audio/video extraction terminal — built with Next.js 16, yt-dlp, and ffmpeg.

![terminal-green-on-black hacker aesthetic](https://img.shields.io/badge/theme-HACKER%20TERMINAL-33ff00?style=flat-square&labelColor=0a0a0a&color=33ff00)
![Next.js](https://img.shields.io/badge/Next.js-16-33ff00?style=flat-square&labelColor=0a0a0a)
![TypeScript](https://img.shields.io/badge/TypeScript-5-33ff00?style=flat-square&labelColor=0a0a0a)
![License](https://img.shields.io/badge/license-MIT-33ff00?style=flat-square&labelColor=0a0a0a)

---

## `> FEATURES`

```
[OK] MP3 extraction        — VBR Q2 (~190kbps), libmp3lame
[OK] MP4 download          — H.264/AAC, adaptive stream merge
[OK] Precision trimming    — visual timeline + dual sliders + manual hh:mm:ss input
[OK] Section download      — extract any time range from any video
[OK] Live terminal log     — real-time pipeline status in the UI
[OK] ASCII progress bar    — [████████░░░░] style
[OK] CRT scanline overlay  — authentic phosphor monitor aesthetic
[OK] Typewriter animations — shell-style boot sequence on load
```

---

## `> STACK`

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Font | JetBrains Mono (via `next/font`) |
| Metadata | youtubei.js (YouTube Innertube API) |
| Download | yt-dlp (URL resolution) |
| Processing | fluent-ffmpeg + ffmpeg-static |

---

## `> PREREQUISITES`

- **Node.js** 18+
- **yt-dlp** installed and available on `$PATH`

```bash
# macOS
brew install yt-dlp

# Linux
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Windows (via pip)
pip install yt-dlp
```

---

## `> INSTALL`

```bash
git clone https://github.com/your-username/yt-ripper
cd yt-ripper
npm install
```

---

## `> RUN`

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open `http://localhost:3000`.

---

## `> USAGE`

```
1. Paste a YouTube URL into the input terminal
2. Press [ EXECUTE ] or hit Enter
3. Inspect the metadata dump (title, author, duration, views)
4. Enable TRIM ENGINE and drag the sliders to select a time range
5. Select output format: ♫ MP3 or ▶ MP4
6. Press [ DOWNLOAD ] — the pipeline streams directly to your browser
```

---

## `> ARCHITECTURE`

```
app/
├── api/
│   ├── info/route.ts      GET  ?url=  →  video metadata (youtubei.js)
│   └── download/route.ts  POST        →  trimmed stream (yt-dlp + ffmpeg)
├── page.tsx               client orchestrator
├── layout.tsx             JetBrains Mono, metadata
└── globals.css            full terminal design system

components/
├── TerminalHeader         ASCII logo, live clock, boot status
├── UrlInput               shell prompt input + live log
├── VideoInfoPanel         metadata dump + thumbnail + ASCII bar
├── TrimControls           visual timeline, sliders, manual inputs
├── FormatSelector         MP3/MP4 tabs + quality presets
├── DownloadPanel          pipeline log + ASCII progress bar
└── ScanlineOverlay        fixed CRT phosphor effect

lib/
└── utils.ts               formatDuration, asciiBar, secondsToTimeString
```

### Download pipeline

```
yt-dlp -g [format]        →  HLS stream URL(s)
         ↓
ffmpeg [video URL]         →  setStartTime / setDuration (trim)
       [audio URL]         →  libmp3lame (MP3) or x264/AAC (MP4)
         ↓
ReadableStream             →  chunked Transfer-Encoding to browser
```

> **Why yt-dlp?** Both `ytdl-core` and `youtubei.js` fail to resolve playable URLs for current YouTube responses due to cipher and NSIG obfuscation. `yt-dlp` is actively maintained and handles these mitigations automatically.

---

## `> ENVIRONMENT`

| Variable | Default | Description |
|---|---|---|
| `YTDLP_PATH` | `/opt/homebrew/bin/yt-dlp` | Override yt-dlp binary path |

---

## `> DISCLAIMER`

```
// WARNING: FOR PERSONAL & EDUCATIONAL USE ONLY
// Downloading copyrighted content without permission may violate
// YouTube's Terms of Service and applicable copyright law.
// The authors assume no liability for misuse.
```

---

## `> LICENSE`

MIT
