import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gray-matter"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [{ source: "/", destination: "/system", permanent: false }];
  },
};

export default nextConfig;
