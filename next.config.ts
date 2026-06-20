import type { NextConfig } from "next";

function getDevPort() {
  const portFlagIndex = process.argv.findIndex(
    (value) => value === "--port" || value === "-p",
  );

  if (portFlagIndex >= 0) {
    return process.argv[portFlagIndex + 1] || "3000";
  }

  return process.env.PORT || "3000";
}

const isDevelopment = process.env.NODE_ENV === "development";
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  distDir: isDevelopment ? `.next-dev-${getDevPort()}` : ".next",
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  // Image optimizer pipeline — next/image proxies preview images, resizes
  // them down to the rendered width, and serves AVIF/WebP. Same-origin
  // /api/walrus/[blobId] URLs are auto-allowed. Direct aggregator URLs
  // need explicit remotePatterns.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.walrus.space" },
      { protocol: "https", hostname: "**.walrus-testnet.walrus.space" },
      { protocol: "https", hostname: "**.walrus.site" },
      { protocol: "https", hostname: "aggregator.walrus-testnet.walrus.space" },
      { protocol: "https", hostname: "aggregator.walrus.space" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
