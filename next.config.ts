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
};

export default nextConfig;
