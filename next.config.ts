import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
