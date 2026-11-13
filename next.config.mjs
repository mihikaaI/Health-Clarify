/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * "/" serves the scroll page in public/scroll/ (published from scrollcraft/builds/healthclarify
   * with `node scrollcraft/sync-to-app.mjs`). The previous home page is untouched in
   * app/page.tsx and is reachable at /classic while this rewrite is in place.
   */
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/scroll/index.html' }]
    };
  }
};
export default nextConfig;
