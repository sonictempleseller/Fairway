import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Avatar uploads can be up to 5 MB (enforced server-side); give a
      // little headroom for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
