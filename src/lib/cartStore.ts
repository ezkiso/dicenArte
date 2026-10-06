import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  priceClp: number;
  quantity: number;
  imageUrl?: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalClp: () => number;
}

// RF-06: carrito persistido en localStorage para que sobreviva a recargas de página.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + quantity, existing.stock || 99);
        } else {
          items.push({ ...item, quantity });
        }
        set({ items });
      },
      updateQuantity: (productId, quantity) => {
        set({
          items: get()
            .items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      clear: () => set({ items: [] }),
      totalClp: () => get().items.reduce((sum, i) => sum + i.priceClp * i.quantity, 0),
    }),
    { name: "dicenarte-cart", skipHydration: true }
  )
);
