/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep @react-pdf/renderer out of the webpack bundle — it relies on
    // Node-only native APIs (canvas, fs) that webpack cannot polyfill.
    // "serverExternalPackages" (Next 15 stable) is not recognised by 14.x;
    // the correct key here is experimental.serverComponentsExternalPackages.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config) => {
    // canvas is an optional native peer of react-pdf. Alias to false so
    // webpack emits an empty stub instead of a build error when it walks
    // the dependency graph (even with serverComponentsExternalPackages the
    // alias is a useful safety net for any transitive client-bundle trace).
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};
module.exports = nextConfig;
