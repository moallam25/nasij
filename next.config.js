/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent webpack from bundling react-pdf — it needs Node native APIs (canvas,
  // fs, etc.) that are unavailable in the webpack bundle. Without this Vercel
  // build fails, producing an empty deployment that returns 404.
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config) => {
    // canvas is a native optional peer of react-pdf; alias it to false so
    // webpack doesn't error when it can't resolve it in the server bundle.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};
module.exports = nextConfig;
