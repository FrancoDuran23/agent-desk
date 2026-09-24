import type { NextConfig } from "next";

// basePath / assetPrefix are injected by Webflow Cloud from the mount path.
// Do not hard-code them here — the platform overwrites next.config at build time.
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.COSMIC_MOUNT_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "",
  },
};

export default nextConfig;
