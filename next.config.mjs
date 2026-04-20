import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  serverExternalPackages: ["canvas", "mongoose", "cloudinary"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

// Disable PWA for now to fix mobile issues
export default nextConfig;
