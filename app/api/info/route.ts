import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    const { stdout } = await execFileAsync(
      YTDLP,
      [
        "--no-playlist",
        "--no-warnings",
        "--dump-json",
        "--extractor-args", "youtube:player_client=android,tv_embedded,web",
        "--", videoId,
      ],
      { env: SPAWN_ENV, timeout: 20_000 }
    );

    const data = JSON.parse(stdout) as {
      title?: string;
      uploader?: string;
      duration?: number;
      view_count?: number;
      thumbnail?: string;
      thumbnails?: { url: string; width?: number }[];
      formats?: {
        format_id: string;
        ext: string;
        acodec?: string;
        vcodec?: string;
        abr?: number;
        quality?: number;
        height?: number;
        fps?: number;
      }[];
    };

    // Best thumbnail: pick largest width, else last in array, else top-level
    const thumbs = data.thumbnails ?? [];
    const bestThumb =
      thumbs.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ??
      data.thumbnail ??
      null;

    const formats = data.formats ?? [];

    const audioFormats = formats
      .filter((f) => f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none"))
      .slice(0, 6)
      .map((f) => ({
        itag: f.format_id,
        mimeType: f.ext,
        bitrate: f.abr ? Math.round(f.abr * 1000) : 0,
        audioQuality: f.quality ?? 0,
      }));

    const videoFormats = formats
      .filter((f) => f.vcodec && f.vcodec !== "none" && f.ext === "mp4" && f.height)
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
      .slice(0, 6)
      .map((f) => ({
        itag: f.format_id,
        qualityLabel: `${f.height}p${f.fps ? f.fps : ""}`,
        container: f.ext,
      }));

    return NextResponse.json({
      videoId,
      title: data.title ?? "Unknown",
      author: data.uploader ?? "Unknown",
      duration: data.duration ?? 0,
      thumbnail: bestThumb,
      viewCount: String(data.view_count ?? 0),
      audioFormats,
      videoFormats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch info";
    console.error("[info]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
