import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const execFileAsync = promisify(execFile);

// Resolution order:
//  1. YTDLP_PATH env var (explicit override)
//  2. ./bin/yt-dlp bundled by postinstall (works on Vercel)
//  3. Common Homebrew path for local dev on macOS
function resolveYtdlpPath(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  const bundled = path.join(process.cwd(), "bin", "yt-dlp");
  if (fs.existsSync(bundled)) return bundled;
  return "/opt/homebrew/bin/yt-dlp";
}

const YTDLP = resolveYtdlpPath();

const SPAWN_ENV = {
  ...process.env,
  // Include Node.js binary dir so yt-dlp can use it as its JS runtime
  // (/var/lang/bin is Vercel Lambda's Node path; others cover local envs)
  PATH: `${process.env.PATH}:/home/chinmay/.bun/bin:/var/lang/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`,
};

const cookiesArgs: string[] = process.env.YTDLP_COOKIES
  ? ["--cookies", process.env.YTDLP_COOKIES]
  : [];

const YTDLP_COMMON_ARGS = [
  "--no-playlist",
  "--no-warnings",
  "--js-runtimes", "bun",
  ...cookiesArgs,
];

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").slice(0, 80);
}

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveStreamUrls(
  videoId: string,
  isAudio: boolean
): Promise<{ videoUrl?: string; audioUrl: string }> {
  const fmt = isAudio
    ? "bestaudio/best"
    : "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best";

  const { stdout } = await execFileAsync(
    YTDLP,
    [...YTDLP_COMMON_ARGS, "-g", "-f", fmt, "--", videoId],
    { env: SPAWN_ENV, timeout: 30_000 }
  );

  const urls = stdout.trim().split("\n").filter(Boolean);

  if (isAudio || urls.length === 1) {
    return { audioUrl: urls[0] };
  }
  // Two lines → video URL first, audio URL second
  return { videoUrl: urls[0], audioUrl: urls[1] };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, format, startTime, endTime, title } = body as {
    url: string;
    format: "mp3" | "mp4";
    startTime?: number;
    endTime?: number;
    title?: string;
  };

  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  const isAudio = format === "mp3";
  const filename = sanitizeFilename(title ?? "download");
  const contentType = isAudio ? "audio/mpeg" : "video/mp4";
  const ext = isAudio ? "mp3" : "mp4";

  // ── Resolve URLs before opening response ──────────────────────────────────
  let streamUrls: { videoUrl?: string; audioUrl: string };
  try {
    streamUrls = await resolveStreamUrls(videoId, isAudio);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resolve stream URL";
    console.error("[yt-dlp -g]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── Build ffmpeg command ───────────────────────────────────────────────────
  const readableStream = new ReadableStream<Uint8Array>({
    start(controller) {
      const passThrough = new PassThrough();

      // If two URLs: video stream + audio stream (adaptive)
      const cmd = streamUrls.videoUrl
        ? ffmpeg(streamUrls.videoUrl).input(streamUrls.audioUrl)
        : ffmpeg(streamUrls.audioUrl);

      // Trim: -ss before input = segment-accurate seeking on HLS
      if (startTime !== undefined && startTime > 0) {
        cmd.setStartTime(startTime);
      }
      if (endTime !== undefined && startTime !== undefined && endTime > startTime) {
        cmd.setDuration(endTime - startTime);
      }

      if (isAudio) {
        cmd.noVideo().audioCodec("libmp3lame").audioQuality(2).format("mp3");
      } else if (streamUrls.videoUrl) {
        // Merge two adaptive streams
        cmd
          .outputOptions([
            "-map 0:v:0",
            "-map 1:a:0",
            "-movflags frag_keyframe+empty_moov",
            "-preset ultrafast",
          ])
          .videoCodec("libx264")
          .audioCodec("aac")
          .format("mp4");
      } else {
        // Single muxed stream
        cmd
          .videoCodec("libx264")
          .audioCodec("aac")
          .format("mp4")
          .outputOptions(["-movflags frag_keyframe+empty_moov", "-preset ultrafast"]);
      }

      cmd
        .on("error", (err) => {
          console.error("[ffmpeg]", err.message);
          controller.error(err);
        })
        .pipe(passThrough);

      passThrough.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      passThrough.on("end", () => controller.close());
      passThrough.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}.${ext}"`,
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
    },
  });
}
