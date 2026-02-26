import type { SizeOption, FrameOption } from '@/types/product';

export const SIZE_OPTIONS: SizeOption[] = [
  { id: '20x30', label: '20×30cm', dimensions: '200 × 300mm', printPrice: 25000, frameAddon: 87000 },
  { id: '30x40', label: '30×40cm', dimensions: '300 × 400mm', printPrice: 35000, frameAddon: 120000 },
  { id: '40x50', label: '40×50cm', dimensions: '400 × 500mm', printPrice: 49000, frameAddon: 180000 },
  { id: '50x75', label: '50×75cm', dimensions: '500 × 750mm', printPrice: 69000, frameAddon: 235000 },
];

export const FRAME_OPTIONS: FrameOption[] = [
  { id: 'black', name: 'Black', nameKo: '블랙', swatchGradient: 'linear-gradient(135deg, #2a2a2a, #111)' },
  { id: 'white', name: 'White', nameKo: '화이트', swatchGradient: 'linear-gradient(135deg, #fff, #ebe8e2)' },
  { id: 'walnut', name: 'Walnut', nameKo: '월넛', swatchGradient: 'linear-gradient(135deg, #6b432a, #3d250f)' },
  { id: 'none', name: 'Print Only', nameKo: '없음', swatchGradient: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50%/8px 8px' },
];

export function calculatePrice(sizeId: string, hasFrame: boolean): { total: number; printPrice: number; frameAddon: number } {
  const size = SIZE_OPTIONS.find(s => s.id === sizeId) ?? SIZE_OPTIONS[0];
  const frameAddon = hasFrame ? size.frameAddon : 0;
  return {
    total: size.printPrice + frameAddon,
    printPrice: size.printPrice,
    frameAddon,
  };
}
