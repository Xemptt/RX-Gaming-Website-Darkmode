export const MAX_QUANTITY = 99;
export const MAX_CART_ITEMS = 30;
export function trustedTebexUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (url.hostname === "tebex.io" || url.hostname.endsWith(".tebex.io")) ? url.href : null;
  } catch { return null; }
}
export function validateCheckoutItems(value: unknown): Array<{ packageId: string; quantity: number }> | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CART_ITEMS) return null;
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item.packageId !== "string" || !/^[1-9]\d{0,14}$/.test(item.packageId) || seen.has(item.packageId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) return null;
    seen.add(item.packageId);
  }
  return value.map(({ packageId, quantity }) => ({ packageId, quantity }));
}

