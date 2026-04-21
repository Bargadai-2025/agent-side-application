import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  serverExternalPackages: ["canvas", "mongoose", "cloudinary"],
  async rewrites() {
    // This looks at your .env file first. If it's not present, it falls back to Railway
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://agent-backend-dashboard-production.up.railway.app";
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

};

// Disable PWA for now to fix mobile issues
export default nextConfig;
