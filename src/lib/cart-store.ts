'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartState } from '@/types/cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items;
        // Check for duplicate (same product + size + frame + artworkBg)
        const existingIndex = items.findIndex(
          i =>
            i.productId === item.productId &&
            i.size === item.size &&
            i.frame === item.frame &&
            i.artworkBg === item.artworkBg
        );

        if (existingIndex >= 0) {
          const updated = [...items];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.quantity,
          };
          set({ items: updated, isOpen: true });
        } else {
          const id = `${item.productId}-${item.size}-${item.frame}-${item.artworkBg}-${Date.now()}`;
          set({ items: [...items, { ...item, id }], isOpen: true });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + (item.printPrice + item.framePrice) * item.quantity,
          0
        ),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'hangover-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
