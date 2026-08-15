import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.110'],
  async redirects() {
    return [
      { source: '/sensors', destination: '/tricorder', permanent: true },
    ];
  },
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
