import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  pageExtensions: [
    "client.tsx",
    "client.ts",
    "client.jsx",
    "client.js",
    "tsx",
    "ts",
    "jsx",
    "js",
  ],
};

export default nextConfig;
