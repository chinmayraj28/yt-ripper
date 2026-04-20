import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

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
    const yt = await Innertube.create({ retrieve_player: true });
    const info = await yt.getInfo(videoId);
    const basic = info.basic_info;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adaptive: any[] = (info.streaming_data?.adaptive_formats as any[]) ?? [];

    const audioFormats = adaptive
      .filter((f) => f.has_audio && !f.has_video)
      .slice(0, 6)
      .map((f) => ({
        itag: f.itag,
        mimeType: f.mime_type,
        bitrate: f.bitrate,
        audioQuality: f.audio_quality ?? "unknown",
      }));

    const videoFormats = adaptive
      .filter((f) => f.has_video && f.has_audio)
      .slice(0, 6)
      .map((f) => ({
        itag: f.itag,
        qualityLabel: f.quality_label ?? "auto",
        mimeType: f.mime_type,
      }));

    const thumbnails = (basic.thumbnail as { url: string }[]) ?? [];
    const thumbnail = thumbnails[thumbnails.length - 1]?.url ?? null;

    return NextResponse.json({
      videoId,
      title: basic.title ?? "Unknown",
      author: basic.author ?? "Unknown",
      duration: basic.duration ?? 0,
      thumbnail,
      viewCount: basic.view_count?.toString() ?? "0",
      audioFormats,
      videoFormats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
