import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
};

export default nextConfig;
