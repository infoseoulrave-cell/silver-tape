import type { Studio } from '@/types/studio';

export const STUDIOS: Studio[] = [
  {
    id: 'hangover',
    slug: 'hangover',
    name: 'HANGOVER',
    nameKo: '행오버',
    logo: '/images/studios/hangover-logo.webp',
    accentColor: '#2d2d2d',
    description: 'Graphic art posters that hit different. Visual Excess. Wall Obsession.',
    descriptionKo: '감각을 자극하는 그래픽 아트 포스터. 과잉의 미학, 벽에 대한 집착.',
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
    name: 'MONORO.',
    nameKo: '모노로',
    logo: '/images/studios/void-logo.webp',
    accentColor: '#A0A0B0',
    description: 'Contemplative minimalism. Art stripped to its irreducible essence.',
    descriptionKo: '관조적 미니멀리즘. 본질만 남긴 디지털 아트.',
    tagline: 'Less Is Everything',
    taglineKo: '비움의 미학',
    socialLinks: {
      instagram: 'https://instagram.com/monoro.studio',
    },
    isActive: true,
    createdAt: '2026-02-26',
  },
  {
    id: 'sensibility',
    slug: 'sensibility',
    name: 'SENSIBILITY STAIR',
    nameKo: '감각의 계단',
    logo: '/images/studios/sensibility-logo.webp',
    accentColor: '#E63B2E',
    description: 'Curated visual collisions. Design, photography, and object studies that sharpen the senses through contrast and materiality.',
    descriptionKo: '감각을 깨우는 시각적 충돌. 대비와 물성을 통해 감각을 벼리는 디자인, 사진, 오브제 스터디.',
    tagline: 'Ascend Through Sensation',
    taglineKo: '감각으로 오르다',
    socialLinks: {
      instagram: 'https://instagram.com/sensibility.stair',
    },
    isActive: true,
    createdAt: '2026-02-26',
  },
  {
    id: 'phantom-reel',
    slug: 'phantom-reel',
    name: 'ONE WAY TICKET',
    nameKo: '원웨이 티켓',
    logo: '/images/studios/phantom-reel-logo.webp',
    accentColor: '#2A6B7C',
    description: 'Recovered transmissions from nowhere. Surreal conceptual photography through the lens of vintage film — lunar archives, liminal spaces, and material studies that feel found, not made.',
    descriptionKo: '어디에도 없는 곳에서 수신된 필름. 빈티지 필름의 렌즈를 통해 바라본 초현실 컨셉츄얼 포토그래피 — 달의 기록, 리미널 스페이스, 발견된 듯한 물성 스터디.',
    tagline: 'Found Footage from Nowhere',
    taglineKo: '어디에도 없는 곳에서 발견된 필름',
    socialLinks: {
      instagram: 'https://instagram.com/onewayticket.studio',
    },
    isActive: true,
    createdAt: '2026-02-27',
  },
];

export function getStudioBySlug(slug: string): Studio | undefined {
  return STUDIOS.find(s => s.slug === slug);
}

export function getActiveStudios(): Studio[] {
  return STUDIOS.filter(s => s.isActive);
}
