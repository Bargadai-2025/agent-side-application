import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  serverExternalPackages: ["canvas", "mongoose", "cloudinary"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://agent-backend-dashboard-production.up.railway.app/api/:path*',
      },
    ];
  },
};

// Disable PWA for now to fix mobile issues
export default nextConfig;
