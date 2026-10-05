import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/lib/products";
import { sanitizeCart, type CartItem } from "@/lib/cart-validation";
import { MAX_QUANTITY, MAX_CART_ITEMS } from "@/lib/validation";
export type { CartItem };
type CartStore = {
  items: CartItem[]; hydrated: boolean; hydrate: () => void;
  addItem: (product: Product) => string | null;
  removeItem: (id: string) => void; updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void; getTotalPrice: () => number; getItemCount: () => number;
};
export const useCartStore = create<CartStore>()(persist((set, get) => ({
  items: [], hydrated: false, hydrate: () => set({ hydrated: true }),
  addItem: product => {
    const valid = sanitizeCart([{ product, quantity: 1 }])[0];
    if (!valid) return "This product is unavailable. Please refresh the store.";
    const current = get().items;
    if (current.some(item => item.product.currency !== product.currency)) return "Please check out or clear the cart before adding another currency.";
    const existing = current.find(item => item.product.id === product.id);
    if (existing && (product.disableQuantity || existing.quantity >= MAX_QUANTITY)) return "This item is already at its maximum quantity.";
    if (!existing && current.length >= MAX_CART_ITEMS) return "Your cart is full. Please check out first.";
    set({ items: existing ? current.map(item => item.product.id === product.id ? { product: valid.product, quantity: item.quantity + 1 } : item) : [...current, valid] });
    return null;
  },
  removeItem: id => set({ items: get().items.filter(item => item.product.id !== id) }),
  updateQuantity: (id, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) return;
    if (quantity === 0) { get().removeItem(id); return; }
    set({ items: get().items.map(item => item.product.id === id ? { ...item, quantity: item.product.disableQuantity ? 1 : quantity } : item) });
  },
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}), {
  name: "rx-gaming-cart", skipHydration: true,
  storage: createJSONStorage(() => ({
    getItem: name => { try { const raw = localStorage.getItem(name); if (raw) JSON.parse(raw); return raw; } catch { return null; } },
    setItem: (name, value) => { try { localStorage.setItem(name, value); } catch { /* Cart remains usable for this session. */ } },
    removeItem: name => { try { localStorage.removeItem(name); } catch { /* Storage may be disabled. */ } },
  })),
  partialize: state => ({ items: state.items }),
  merge: (persisted, current) => ({ ...current, items: sanitizeCart((persisted as { items?: unknown } | null)?.items) }),
}));
