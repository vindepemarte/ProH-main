import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // By leaving remotePatterns empty, we allow local images from the /public folder.
    remotePatterns: [],
  },
  // Add cache control headers
  async headers() {
    return [
      {
        // Apply cache headers to all API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Apply cache headers to all pages
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // Generate build ID based on timestamp to bust cache on deploy
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
