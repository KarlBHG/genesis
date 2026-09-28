import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gray-matter"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      {
        source: "/contradictions",
        destination: "/anomalies#contradictions",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
