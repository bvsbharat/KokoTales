/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;