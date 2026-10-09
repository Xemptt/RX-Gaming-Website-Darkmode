"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { useCartStore } from "@/store/cart";
import { MAX_QUANTITY } from "@/lib/validation";
import settings from "@/store-settings.json";

function formatPackageDescription(description: string) {
  return description
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code: string) => {
      const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
      if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
      const value = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isRankProduct(product: Product) {
  const title = product.name.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return product.category === "ranks" || /^(?:(?:insanecraft|rlcraft|rank|vip)\s+)?(?:extreme|mental|loony|nutty|crazy|insane|adventurer|champion|warlord|dragonborn)(?:\s+(?:rank|vip|package|pack|upgrade)){0,2}$/i.test(title);
}

function PackageCartControls({ product, onFeedback }: { product: Product; onFeedback: (message: string) => void }) {
  const quantity = useCartStore(state => state.items.find(item => item.product.id === product.id)?.quantity ?? 0);
  const hydrated = useCartStore(state => state.hydrated);
  const controls = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  useEffect(() => {
    if (moveFocus.current) {
      controls.current?.querySelector<HTMLElement>("[data-cart-action]")?.focus();
      moveFocus.current = false;
    }
  }, [quantity]);

  const increase = () => {
    const store = useCartStore.getState();
    const previous = store.items.find(item => item.product.id === product.id)?.quantity ?? 0;
    const error = store.addItem(product);
    if (error) { onFeedback(error); return; }
    moveFocus.current = previous === 0;
    const count = useCartStore.getState().items.find(item => item.product.id === product.id)?.quantity ?? 0;
    onFeedback(`${product.name} added. Quantity in cart: ${count}.`);
  };

  const decrease = () => {
    const store = useCartStore.getState();
    const count = store.items.find(item => item.product.id === product.id)?.quantity ?? 0;
    if (!count) return;
    moveFocus.current = count === 1;
    store.updateQuantity(product.id, count - 1);
    const remaining = useCartStore.getState().items.find(item => item.product.id === product.id)?.quantity ?? 0;
    onFeedback(remaining === 0 ? `${product.name} removed from your cart.` : `${product.name}. Quantity in cart: ${remaining}.`);
  };

  return <div ref={controls} className="mt-auto space-y-3">
    {hydrated && quantity > 0 ? <>
      <div role="group" aria-label={`Quantity of ${product.name} in cart`} className="flex items-center justify-between gap-3">
        <button type="button" className="quantity-button shrink-0" onClick={decrease} aria-label={quantity === 1 ? `Remove ${product.name} from cart` : `Decrease quantity of ${product.name}`}>−</button>
        <span className="text-sm font-bold text-center">In cart: {quantity}</span>
        <button type="button" className="quantity-button shrink-0" onClick={increase} disabled={product.disableQuantity || quantity >= MAX_QUANTITY} aria-label={`Increase quantity of ${product.name}`}>+</button>
      </div>
      {product.disableQuantity && <p className="text-xs text-muted text-center">Limited to one per order.</p>}
      <Link data-cart-action href="/cart" className="action-button w-full" aria-label={`Go to cart with ${product.name}`}>Go to cart →</Link>
    </> : <button data-cart-action type="button" disabled={!hydrated} className="action-button w-full" onClick={increase}>Add to cart</button>}
  </div>;
}

export default function Catalog({ realm }: { realm: string }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setProducts(null); }, [realm]);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch(`/api/tebex/catalog?realm=${encodeURIComponent(realm)}`, {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) { setProducts(data.products); setError(""); }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load products.");
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [realm, attempt]);
  return <section aria-label="Store products" className="space-y-6">
    <p className="text-sm text-muted">Prices and availability are updated from Tebex. Applicable taxes, discounts and the final total are confirmed at checkout before you pay.</p>
    <p role="status" className="font-bold text-accent min-h-6">{feedback}</p>
    {error && <div role="alert" className="panel space-y-4"><h2 className="text-xl font-bold">{products === null ? "Store temporarily unavailable" : "Prices could not be refreshed"}</h2><p>{error}</p>{products !== null && <p>The last available products are shown below. Tebex will confirm current prices and availability at checkout.</p>}<button className="action-button" onClick={() => setAttempt(attempt + 1)}>Try again</button> <a className="underline font-bold" href={settings.tebexMainStore}>Visit the official Tebex store</a></div>}
    {products === null ? (!error && <p role="status" className="panel">Loading available products…</p>) :
      products.length === 0 ? <div className="panel space-y-4"><h2 className="text-xl font-bold">No packages available yet</h2><p>Check the official store or come back soon.</p><a href={settings.tebexMainStore} className="action-button">Open official store</a></div> :
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(product => <article className="panel flex flex-col gap-4" key={product.id}>
        <div className="relative h-40 overflow-hidden bg-black/20">
          <img src={product.img} alt="" className="w-full h-full object-contain" loading="lazy" onError={event => { if (!event.currentTarget.src.endsWith("/1.png")) event.currentTarget.src = "/1.png"; }} />
          {isRankProduct(product) && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-2 pb-2 pt-8 text-center text-sm sm:text-base uppercase tracking-wide text-white [text-shadow:2px_2px_0px_#000]">
            {product.name}
          </span>}
        </div>
        <h2 className="text-xl font-bold break-words">{product.name}</h2>
        {product.isPromo && <span className="self-start bg-[#ffcc00] text-black px-2 py-1 text-sm font-bold">On sale</span>}
        <p className="text-2xl text-accent font-bold">{product.price.toFixed(2)} {product.currency}</p>
        <p className="text-xs leading-relaxed text-muted">Taxes may vary by location. Final total confirmed at Tebex checkout.</p>
        {product.description && formatPackageDescription(product.description) && <div className="border-t border-frame/60 pt-3">
          <h3 className="text-sm font-bold mb-1">What’s included</h3>
          <p className="text-sm text-muted whitespace-pre-line">{formatPackageDescription(product.description)}</p>
        </div>}
        {product.recurring && <p className="text-sm font-bold">Subscription — billing period and renewal terms are shown at checkout.</p>}
        <PackageCartControls product={product} onFeedback={setFeedback} />
      </article>)}</div>}
    <Link href="/cart" className="inline-block underline font-bold">View cart →</Link>
  </section>;
}

