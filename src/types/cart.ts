import type { FrameColor } from './product';

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  studioId: string;
  studioName: string;
  studioSlug: string;
  size: string;
  frame: FrameColor;
  artworkBg: string;
  quantity: number;
  printPrice: number;
  framePrice: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}
