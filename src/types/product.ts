export type CategoryId = 'fine' | 'blk' | 'fun' | 'pop' | 'art' | 'witty';

export type FrameColor = 'black' | 'white' | 'walnut' | 'none';

export type PrintVersion = 'poster' | 'art-only';

export interface MatVariant {
  id: string;
  name: string;
  nameKo: string;
  image: string;
}

export interface PosterVariant {
  id: string;
  name: string;
  nameKo: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  category: CategoryId;
  artist: string;
  description: string;
  descriptionKo: string;
  image: string;
  artImage: string;
  posterImage?: string;
  posterVariants?: PosterVariant[];
  matVariants: MatVariant[];
  tags: string[];
  featured: boolean;
  editionSize: number;
  createdAt: string;
  hasPosterVersion: boolean;
}

export interface Category {
  id: CategoryId;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  coverImage: string;
  gridArea: string;
}

export interface SizeOption {
  id: string;
  label: string;
  dimensions: string;
  printPrice: number;
  frameAddon: number;
}

export interface FrameOption {
  id: FrameColor;
  name: string;
  nameKo: string;
  swatchGradient: string;
}
