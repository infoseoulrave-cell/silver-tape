import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/studio/hangover',
        permanent: true,
      },
      {
        source: '/products/:slug',
        destination: '/studio/hangover/:slug',
        permanent: true,
      },
      {
        source: '/category/:category',
        destination: '/studio/hangover/category/:category',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
