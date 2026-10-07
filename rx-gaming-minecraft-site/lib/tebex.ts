import type { Product, ProductCategory, ProductMode } from "./products";
import { getRealm } from "./realms";

export class StoreUnavailableError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}
const apiRoot = "https://headless.tebex.io/api";
function tebexErrorDetail(body: string): string | undefined {
  try {
    const payload = JSON.parse(body);
    const candidates: unknown[] = [payload?.message, payload?.error, payload?.detail];
    if (Array.isArray(payload?.errors)) candidates.push(...payload.errors);
    else if (payload?.errors && typeof payload.errors === "object") {
      for (const value of Object.values(payload.errors)) {
        candidates.push(...(Array.isArray(value) ? value : [value]));
      }
    }
    const detail = candidates.find((value): value is string => typeof value === "string" && value.trim());
    return detail
      ?.replace(/<[^>]*>/g, " ")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  } catch {
    return undefined;
  }
}
export function accountPath(path: string) {
  const token = process.env.TEBEX_PUBLIC_TOKEN || process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN;
  if (!token) throw new StoreUnavailableError("The store is not configured yet.");
  return `/accounts/${encodeURIComponent(token)}${path}`;
}
export async function tebexRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiRoot}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
    cache: "no-store", signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const detail = tebexErrorDetail(await response.text());
    const reason = detail ? ` Tebex said: ${detail}` : "";
    const statusText = response.status >= 500 ? "is unavailable" : "rejected the request";
    throw new StoreUnavailableError(
      `Tebex ${statusText} (HTTP ${response.status}).${reason} Please try again or visit the official store.`,
      response.status,
    );
  }
  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
export function getServerModeLabel(mode: string) { return getRealm(mode)?.name || "Network"; }
type Category = {
  name: string; slug?: string; parent?: { name?: string; slug?: string } | null;
  packages?: Array<{ id: number; name: string; description?: string | null; total_price: number; currency: string; image?: string | null; disable_quantity?: boolean; type?: string }>;
};
function detectMode(text: string): ProductMode {
  if (/insanecraft|\binsane\b|\banarchy\b/i.test(text)) return "anarchy";
  if (/rlcraft|\bsurvival\b/i.test(text)) return "survival";
  if (/skywars/i.test(text)) return "skywars";
  if (/practice/i.test(text)) return "practice";
  return "all";
}
const rankArtwork: Array<{ name: RegExp; slug: string }> = [
  { name: /\b(?:extreme|adventurer)\b/i, slug: "extreme" },
  { name: /\b(?:mental|champion)\b/i, slug: "mental" },
  { name: /\bloony\b/i, slug: "loony" },
  { name: /\b(?:nutty|warlord)\b/i, slug: "nutty" },
  { name: /\bcrazy\b/i, slug: "crazy" },
  { name: /\binsane\b/i, slug: "insane" },
  { name: /\bdragonborn\b/i, slug: "dragonborn" },
];
const insanecraftRankRewards: Record<string, string> = {
  extreme: `<h4>💠 EXTREME RANK</h4>
    <p><strong>✨ Small quality-of-life perks and a solid start in InsaneCraft.</strong></p>
    <p><strong>🎁 RANK PERKS</strong></p>
    <ul>
      <li>🏠 5 homes</li>
      <li>🎒 <code>/kit extreme</code></li>
      <li>🛠️ <code>/hat</code></li>
      <li>🧰 <code>/workbench</code></li>
      <li>🏷️ Extreme prefix in-game</li>
      <li>🌐 May join private betas and whitelisted servers</li>
    </ul>
    <p>⬆️ Higher InsaneCraft ranks inherit these perks.</p>`,
  mental: `<h4>💠 MENTAL RANK</h4>
    <p><strong>✨ More convenience and cosmetic perks.</strong></p>
    <p>📈 Includes everything from Extreme, plus:</p>
    <p><strong>🎁 RANK PERKS</strong></p>
    <ul>
      <li>🏠 6 homes total</li>
      <li>🔐 3 PlayerVaultsX vaults total</li>
      <li>🎒 <code>/kit mental</code></li>
      <li>🧰 <code>/enderchest</code></li>
      <li>🎭 Dog pet and Diamond Hat</li>
      <li>🏷️ Mental prefix in-game</li>
    </ul>`,
  loony: `<h4>💠 LOONY RANK</h4>
    <p><strong>✨ More storage and ways to personalise your character.</strong></p>
    <p>📈 Includes everything from Extreme and Mental, plus:</p>
    <p><strong>🎁 RANK PERKS</strong></p>
    <ul>
      <li>🏠 7 homes total</li>
      <li>🔐 4 PlayerVaultsX vaults total</li>
      <li>🎒 <code>/kit loony</code></li>
      <li>✏️ <code>/nick</code></li>
      <li>🎭 Glacial Steed mount and Happy emote</li>
      <li>🏷️ Loony prefix in-game</li>
    </ul>`,
  nutty: `<h4>💠 NUTTY RANK</h4>
    <p><strong>✨ More homes, useful commands and cosmetics.</strong></p>
    <p>📈 Includes everything from Extreme, Mental and Loony, plus:</p>
    <p><strong>🎁 RANK PERKS</strong></p>
    <ul>
      <li>🏠 8 homes total</li>
      <li>🔐 5 PlayerVaultsX vaults total</li>
      <li>🎒 <code>/kit nutty</code></li>
      <li>🛠️ <code>/repair</code> and <code>/feed</code></li>
      <li>🎭 Creeper morph and Ender Aura particle effect</li>
      <li>🏷️ Nutty prefix in-game</li>
    </ul>`,
  crazy: `<h4>💠 CRAZY RANK</h4>
    <p><strong>✨ Big quality-of-life upgrades and standout cosmetics.</strong></p>
    <p>📈 Includes everything from Extreme, Mental, Loony and Nutty, plus:</p>
    <p><strong>🎁 RANK PERKS</strong></p>
    <ul>
      <li>🏠 11 homes total</li>
      <li>🔐 6 PlayerVaultsX vaults total</li>
      <li>🎒 <code>/kit crazy</code></li>
      <li>❤️ <code>/heal</code></li>
      <li>🎭 Firework gadget and Rainbow projectile effect</li>
      <li>🏷️ Crazy prefix in-game</li>
    </ul>`,
  insane: `<h4>💠 INSANE RANK</h4>
    <p><strong>✨ The highest InsaneCraft donor tier.</strong></p>
    <p>📈 Includes everything from Extreme, Mental, Loony, Nutty and Crazy, plus:</p>
    <p><strong>🎁 RANK PERKS</strong></p>
    <ul>
      <li>🏠 13 homes total</li>
      <li>🔐 7 PlayerVaultsX vaults total</li>
      <li>🎒 <code>/kit insane</code></li>
      <li>🪽 <code>/fly</code></li>
      <li>🎭 Dragon mount and Warden pet</li>
      <li>🏷️ Insane prefix in-game</li>
    </ul>`,
};
function getInsanecraftRankRewards(name: string): string | undefined {
  const title = name.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const match = /^(?:(?:insanecraft|rank|vip)\s+)?(extreme|mental|loony|nutty|crazy|insane)(?:\s+(?:rank|vip|package|pack|upgrade)){0,2}$/i.exec(title);
  return match ? insanecraftRankRewards[match[1].toLowerCase()] : undefined;
}
function getRankArtwork(name: string, category: ProductCategory, mode: ProductMode): string | undefined {
  const realm = mode === "anarchy" ? "insanecraft" : mode === "survival" ? "rlcraft" : undefined;
  const title = name.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const rank = rankArtwork.find(entry => entry.name.test(title));
  const knownRankTitle = /^(?:(?:insanecraft|rlcraft|rank|vip)\s+)?(?:extreme|mental|loony|nutty|crazy|insane|adventurer|champion|warlord|dragonborn)(?:\s+(?:rank|vip|package|pack|upgrade)){0,2}$/i.test(title);
  if (category !== "ranks" && !knownRankTitle) return undefined;
  if (rank?.slug === "dragonborn" && mode !== "survival") return undefined;
  return realm && rank ? `/ranks/${realm}/rank-${rank.slug}.webp` : undefined;
}
export async function fetchCatalog(signal?: AbortSignal): Promise<Product[]> {
  const json = await tebexRequest(accountPath("/categories?includePackages=1"), { signal });
  if (!Array.isArray(json.data)) throw new StoreUnavailableError("The store returned an invalid catalog.");
  const result = new Map<string, Product>();
  for (const category of json.data as Category[]) {
    if (!category || typeof category.name !== "string" || !Array.isArray(category.packages)) continue;
    const parentMode = detectMode(`${category.parent?.name || ""} ${category.parent?.slug || ""}`);
    const mode = parentMode !== "all" ? parentMode : detectMode(`${category.name} ${category.slug || ""}`);
    const kind: ProductCategory = /rank|vip/i.test(category.name) ? "ranks" : /package|bundle/i.test(category.name) ? "packages" : "other";
    for (const pkg of category.packages) {
      if (!pkg || !Number.isSafeInteger(pkg.id) || pkg.id <= 0 || typeof pkg.name !== "string" || !Number.isFinite(pkg.total_price) || pkg.total_price < 0 || !/^[A-Z]{3}$/.test(pkg.currency)) continue;
      const id = String(pkg.id);
      const productMode = mode !== "all" ? mode : detectMode(pkg.name);
      const existing = result.get(id);
      if (existing) {
        const modes = new Set(Array.isArray(existing.mode) ? existing.mode : [existing.mode]);
        modes.add(productMode);
        existing.mode = modes.has("all") ? "all" : [...modes];
        continue;
      }
      result.set(id, {
        id, name: pkg.name, description: typeof pkg.description === "string" ? pkg.description : undefined,
        price: pkg.total_price, currency: pkg.currency,
        disableQuantity: pkg.disable_quantity === true, recurring: pkg.type === "subscription",
        isPromo: false, category: kind, mode: productMode, color: "#7C3AED",
        img: typeof pkg.image === "string" && /^https:\/\//.test(pkg.image) ? pkg.image : "/1.png",
      });
    }
  }
  return [...result.values()];
}
export async function fetchTebexProducts(mode: string) {
  const target = getRealm(mode)?.mode;
  if (!target) return [];
  return (await fetchCatalog())
    .filter(product => product.mode === "all" || product.mode === target || (Array.isArray(product.mode) && (product.mode.includes(target) || product.mode.includes("all"))))
    .map(product => ({
      ...product,
      description: target === "anarchy" ? getInsanecraftRankRewards(product.name) ?? product.description : product.description,
      img: getRankArtwork(product.name, product.category, target) ?? product.img,
    }));
}
