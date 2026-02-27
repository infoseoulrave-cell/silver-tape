import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SILVERTAPE - Curated Art. Every Wall.',
    short_name: 'SILVERTAPE',
    description: '큐레이션 아트 프린트 플랫폼. 모든 벽에 예술을.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0f0f0',
    theme_color: '#1a1a1a',
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
