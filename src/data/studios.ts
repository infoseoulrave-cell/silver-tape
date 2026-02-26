import type { Studio } from '@/types/studio';

export const STUDIOS: Studio[] = [
  {
    id: 'hangover',
    slug: 'hangover',
    name: 'HANGOVER',
    nameKo: '행오버',
    accentColor: '#BFFF00',
    description: 'AI-generated graphic art posters. Visual Excess. Wall Obsession.',
    descriptionKo: 'AI가 만든 그래픽 아트 포스터. 예술에 취하다.',
    tagline: 'Get Wasted on Art',
    taglineKo: '예술에 취하다',
    socialLinks: {
      instagram: 'https://instagram.com/hangover.art',
    },
    isActive: true,
    createdAt: '2026-02-25',
  },
];

export function getStudioBySlug(slug: string): Studio | undefined {
  return STUDIOS.find(s => s.slug === slug);
}

export function getActiveStudios(): Studio[] {
  return STUDIOS.filter(s => s.isActive);
}
