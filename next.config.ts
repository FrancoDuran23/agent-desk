import type { NextConfig } from "next";

// basePath / assetPrefix are injected by Webflow Cloud from the mount path.
// Do not hard-code them here — the platform overwrites next.config at build time.
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // `next dev --hostname 0.0.0.0` otherwise blocks the HMR socket from 127.0.0.1
  // and the client never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.COSMIC_MOUNT_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "",
  },
};

export default nextConfig;
