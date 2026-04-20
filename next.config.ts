import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "@distube/ytdl-core", "youtubei.js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Bundle the yt-dlp binary into the /api/download function on Vercel
    outputFileTracingIncludes: {
      "/api/download": ["./bin/yt-dlp"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
