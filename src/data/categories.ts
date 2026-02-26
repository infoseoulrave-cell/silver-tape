import type { Category } from '@/types/product';

export const CATEGORIES: Category[] = [
  {
    id: 'fine',
    name: 'FINE',
    nameKo: '파인',
    description: 'Fine art & expressionism. Bold strokes meet raw emotion.',
    descriptionKo: '파인 아트 & 표현주의. 대담한 붓질이 감정과 만난다.',
    coverImage: '/images/products/artsy/artsy-001-poster-black.jpg',
    gridArea: 'fine',
  },
  {
    id: 'blk',
    name: 'BLACK',
    nameKo: '블랙',
    description: 'Dark & moody surrealism. Chrome dreams in shadow.',
    descriptionKo: '다크 & 무디 초현실주의. 그림자 속 크롬 꿈.',
    coverImage: '/images/products/blk/blk-001-poster-black.jpg',
    gridArea: 'blk',
  },
  {
    id: 'fun',
    name: 'FUN',
    nameKo: '펀',
    description: 'Quirky & whimsical pop surrealism that makes you smile.',
    descriptionKo: '미소 짓게 만드는 기발하고 위트 있는 팝 초현실주의.',
    coverImage: '/images/products/fun/fun-001-poster-black.jpg',
    gridArea: 'fun',
  },
  {
    id: 'pop',
    name: 'POP',
    nameKo: '팝',
    description: 'Bold pop art. Vibrant colors and cultural commentary.',
    descriptionKo: '대담한 팝 아트. 강렬한 색감과 문화 평론.',
    coverImage: '/images/products/pop/pop-001-poster-black.jpg',
    gridArea: 'pop',
  },
  {
    id: 'art',
    name: 'ART',
    nameKo: '아트',
    description: 'Pure AI-generated art. Where technology meets imagination.',
    descriptionKo: '순수 AI 생성 아트. 기술과 상상의 만남.',
    coverImage: '/images/products/art/art-001-art.webp',
    gridArea: 'art',
  },
  {
    id: 'witty',
    name: 'WITTY',
    nameKo: '위티',
    description: 'Clever conceptual art. Think twice, smile once.',
    descriptionKo: '영리한 컨셉 아트. 두 번 생각하고, 한 번 미소 짓다.',
    coverImage: '/images/products/witty/wit-001-art.webp',
    gridArea: 'witty',
  },
];

export function getCategoryById(id: string) {
  return CATEGORIES.find(c => c.id === id);
}
