/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // OneSignal service worker must be served with:
        //   - Service-Worker-Allowed: / so it can control the entire origin
        //   - Cache-Control: no-cache so Vercel CDN never serves a stale copy
        //   - Correct MIME type so the browser registers it as a SW
        source: '/OneSignalSDKWorker.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
  experimental: {
    // Keep @react-pdf/renderer out of webpack — it is ESM-only (type:module)
    // and depends on Node-only APIs (canvas, fs, yoga-layout native addon).
    // Without this, webpack tries to bundle it and the Vercel Linux build
    // fails. The correct key for Next.js 14.x is
    // experimental.serverComponentsExternalPackages; "serverExternalPackages"
    // is the Next 15 stable spelling and is silently ignored here.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent the client bundle from failing when a transitive import
      // references Node-only built-ins. These are never shipped to browsers.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false,
      };
    }
    // Alias canvas to false on the server side as well: react-pdf optionally
    // requires it at module load time; without this alias webpack emits an
    // error even when the package itself is marked external.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};
module.exports = nextConfig;
