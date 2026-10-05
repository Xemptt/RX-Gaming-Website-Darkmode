import type { Product } from "./products";
import { MAX_CART_ITEMS, MAX_QUANTITY } from "./validation";
export type CartItem = { product: Product; quantity: number };
export function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const result: CartItem[] = [];
  for (const item of value.slice(0, MAX_CART_ITEMS)) {
    const p = item?.product;
    if (!p || typeof p.id !== "string" || !/^[1-9]\d{0,14}$/.test(p.id) || result.some(i => i.product.id === p.id) ||
      typeof p.name !== "string" || !p.name.trim() || p.name.length > 200 || !Number.isFinite(p.price) || p.price < 0 || p.price > 1000000 ||
      typeof p.currency !== "string" || !/^[A-Z]{3}$/.test(p.currency) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) continue;
    result.push({ product: { id: p.id, name: p.name, price: p.price, currency: p.currency,
      category: ["ranks", "packages", "other"].includes(p.category) ? p.category : "other",
      mode: "all", color: "#7C3AED", isPromo: false, img: typeof p.img === "string" && (/^https:\/\//.test(p.img) || /^\/[\w./-]+$/.test(p.img)) ? p.img : "/1.png",
      disableQuantity: p.disableQuantity === true, recurring: p.recurring === true,
    }, quantity: p.disableQuantity ? 1 : item.quantity });
  }
  return result;
}

