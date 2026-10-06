"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { useCartStore } from "@/store/cart";
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

export default function Catalog({ realm }: { realm: string }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attempt, setAttempt] = useState(0);
  const addItem = useCartStore(state => state.addItem);
  const hydrated = useCartStore(state => state.hydrated);
  useEffect(() => {
    const controller = new AbortController();
    setProducts(null); setError("");
    fetch(`/api/tebex/catalog?realm=${encodeURIComponent(realm)}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data.products; })
      .then(data => setProducts(data))
      .catch(error => { if (!controller.signal.aborted) setError(error.message || "Unable to load products."); });
    return () => controller.abort();
  }, [realm, attempt]);
  return <section aria-label="Store products" className="space-y-6">
    <p className="text-sm text-muted">Prices and availability come from the official store. Confirm your account, discounts and final total at Tebex checkout.</p>
    <p role="status" className="font-bold text-accent min-h-6">{feedback}</p>
    {error ? <div role="alert" className="panel space-y-4"><h2 className="text-xl font-bold">Store temporarily unavailable</h2><p>{error}</p><button className="action-button" onClick={() => setAttempt(attempt + 1)}>Try again</button> <a className="underline font-bold" href={settings.tebexMainStore}>Visit the official Tebex store</a></div> :
      products === null ? <p role="status" className="panel">Loading available products…</p> :
      products.length === 0 ? <div className="panel space-y-4"><h2 className="text-xl font-bold">No packages available yet</h2><p>Check the official store or come back soon.</p><a href={settings.tebexMainStore} className="action-button">Open official store</a></div> :
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(product => <article className="panel flex flex-col gap-4" key={product.id}>
        <img src={product.img} alt="" className="w-full h-40 object-contain" loading="lazy" onError={event => { if (!event.currentTarget.src.endsWith("/1.png")) event.currentTarget.src = "/1.png"; }} />
        <h2 className="text-xl font-bold break-words">{product.name}</h2>
        <p className="text-2xl text-accent font-bold">{product.price.toFixed(2)} {product.currency}</p>
        {product.description && formatPackageDescription(product.description) && <div className="border-t border-frame/60 pt-3">
          <h3 className="text-sm font-bold mb-1">What’s included</h3>
          <p className="text-sm text-muted whitespace-pre-line">{formatPackageDescription(product.description)}</p>
        </div>}
        {product.recurring && <p className="text-sm font-bold">Subscription — billing period and renewal terms are shown at checkout.</p>}
        <button disabled={!hydrated} className="action-button mt-auto" onClick={() => { const error = addItem(product); setFeedback(error || `${product.name} added. Quantity in cart: ${useCartStore.getState().items.find(item => item.product.id === product.id)?.quantity}.`); }}>Add to cart</button>
      </article>)}</div>}
    <Link href="/cart" className="inline-block underline font-bold">View cart →</Link>
  </section>;
}

