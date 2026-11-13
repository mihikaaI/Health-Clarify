import type { MetadataRoute } from 'next';

/** Lets people add HealthClarify to their phone's home screen. No offline caching: reports are never stored by the app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HealthClarify', short_name: 'HealthClarify', description: 'Plain-language help to understand your lab report. Educational only.',
    start_url: '/', display: 'standalone', background_color: '#faf6ee', theme_color: '#0b3b3a', lang: 'en-IN',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
