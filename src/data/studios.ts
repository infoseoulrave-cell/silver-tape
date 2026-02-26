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
  {
    id: 'void',
    slug: 'void',
    name: 'VOID.',
    nameKo: '보이드',
    accentColor: '#A0A0B0',
    description: 'Contemplative minimalism. Art stripped to its irreducible essence.',
    descriptionKo: '관조적 미니멀리즘. 본질만 남긴 디지털 아트.',
    tagline: 'Less Is Everything',
    taglineKo: '비움의 미학',
    socialLinks: {
      instagram: 'https://instagram.com/void.studio',
    },
    isActive: true,
    createdAt: '2026-02-26',
  },
];

export function getStudioBySlug(slug: string): Studio | undefined {
  return STUDIOS.find(s => s.slug === slug);
}

export function getActiveStudios(): Studio[] {
  return STUDIOS.filter(s => s.isActive);
}
