import { NextRequest, NextResponse } from "next/server";
import ffmpegStatic from "ffmpeg-static";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const FFMPEG = ffmpegStatic;
if (!FFMPEG) {
  throw new Error("ffmpeg-static binary not found");
}

function resolveYtdlpPath(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  const bundled = path.join(process.cwd(), "bin", "yt-dlp");
  if (fs.existsSync(bundled)) return bundled;
  return "/opt/homebrew/bin/yt-dlp";
}

const YTDLP = resolveYtdlpPath();

const SPAWN_ENV = {
  ...process.env,
  PATH: `${process.env.PATH}:/var/lang/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`,
};

const cookiesArgs: string[] = process.env.YTDLP_COOKIES
  ? ["--cookies", process.env.YTDLP_COOKIES]
  : [];

const YTDLP_COMMON_ARGS = ["--no-playlist", "--no-warnings", ...cookiesArgs];

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

function buildYtdlpArgs(videoId: string, isAudio: boolean): string[] {
  const fmt = isAudio
    ? "bestaudio/best"
    : "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best";

  return [
    ...YTDLP_COMMON_ARGS,
    "-f",
    fmt,
    "--no-part",
    "-o",
    "-",
    "--",
    videoId,
  ];
}

function buildFfmpegArgs(
  isAudio: boolean,
  startTime?: number,
  endTime?: number
): string[] {
  const args = ["-hide_banner", "-loglevel", "error", "-nostdin"];

  if (startTime !== undefined && startTime > 0) {
    args.push("-ss", String(startTime));
  }

  args.push("-i", "pipe:0");

  if (
    endTime !== undefined &&
    startTime !== undefined &&
    endTime > startTime
  ) {
    args.push("-t", String(endTime - startTime));
  }

  if (isAudio) {
    args.push(
      "-vn",
      "-acodec",
      "libmp3lame",
      "-q:a",
      "2",
      "-f",
      "mp3",
      "pipe:1"
    );
  } else {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
      "-movflags",
      "frag_keyframe+empty_moov",
      "-f",
      "mp4",
      "pipe:1"
    );
  }

  return args;
}

function killProcess(proc: ChildProcess | null) {
  if (!proc || proc.killed) return;
  proc.kill("SIGTERM");
}

function pipeDownload(
  videoId: string,
  isAudio: boolean,
  startTime?: number,
  endTime?: number
): ReadableStream<Uint8Array> {
  const needsFfmpeg =
    isAudio ||
    (startTime !== undefined && startTime > 0) ||
    (endTime !== undefined &&
      startTime !== undefined &&
      endTime > startTime);

  const ytdlp = spawn(YTDLP, buildYtdlpArgs(videoId, isAudio), {
    env: SPAWN_ENV,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let ffmpeg: ChildProcess | null = null;
  let output: NodeJS.ReadableStream;
  let stderr = "";
  let failed = false;

  const logStderr = (source: string, chunk: Buffer) => {
    const text = chunk.toString();
    stderr += text;
    if (text.trim()) console.error(`[${source}]`, text.trim());
  };

  ytdlp.stderr.on("data", (chunk: Buffer) => logStderr("yt-dlp", chunk));

  if (needsFfmpeg) {
    ffmpeg = spawn(FFMPEG, buildFfmpegArgs(isAudio, startTime, endTime), {
      stdio: ["pipe", "pipe", "pipe"],
    });

    ffmpeg.stderr.on("data", (chunk: Buffer) => logStderr("ffmpeg", chunk));
    ytdlp.stdout.pipe(ffmpeg.stdin);

    ytdlp.stdout.on("error", (err) => {
      failed = true;
      ffmpeg?.stdin.destroy(err);
    });

    ffmpeg.stdin.on("error", () => {
      // yt-dlp may close early if ffmpeg stops reading
    });

    output = ffmpeg.stdout;
  } else {
    output = ytdlp.stdout;
  }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      output.on("data", (chunk: Buffer) => {
        if (!failed) controller.enqueue(new Uint8Array(chunk));
      });

      const finish = (err?: Error) => {
        if (failed) return;
        failed = true;
        killProcess(ytdlp);
        killProcess(ffmpeg);

        if (err) {
          controller.error(err);
          return;
        }
        controller.close();
      };

      output.on("end", () => finish());
      output.on("error", (err) => finish(err));

      ytdlp.on("error", (err) => finish(err));
      ffmpeg?.on("error", (err) => finish(err));

      ytdlp.on("close", (code) => {
        if (code !== 0 && !failed) {
          finish(
            new Error(
              stderr.trim() || `yt-dlp exited with code ${code ?? "unknown"}`
            )
          );
        }
      });

      ffmpeg?.on("close", (code) => {
        if (code !== 0 && !failed) {
          finish(
            new Error(
              stderr.trim() || `ffmpeg exited with code ${code ?? "unknown"}`
            )
          );
        }
      });
    },
    cancel() {
      failed = true;
      killProcess(ytdlp);
      killProcess(ffmpeg);
    },
  });
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

  const readableStream = pipeDownload(videoId, isAudio, startTime, endTime);

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}.${ext}"`,
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
    },
  });
}
