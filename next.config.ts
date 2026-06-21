import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sojourner.simcentral.org',
      },
    ],
  },
};

export default nextConfig;
