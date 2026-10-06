"use client";
import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart";
import { MAX_QUANTITY, trustedTebexUrl } from "@/lib/validation";
import settings from "@/store-settings.json";
export default function CartPage() {
  const { items, hydrated, removeItem, updateQuantity, clearCart } = useCartStore();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [voucherType, setVoucherType] = useState<"coupon" | "giftcard">("coupon");
  const [voucherCode, setVoucherCode] = useState("");
  const [resume, setResume] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    setResume(new URLSearchParams(window.location.search).get("resume") === "1");
    try {
      setUsername(sessionStorage.getItem("rx-checkout-username") || "");
      setVoucherCode(sessionStorage.getItem("rx-voucher-code") || "");
      setVoucherType(sessionStorage.getItem("rx-voucher-type") === "giftcard" ? "giftcard" : "coupon");
    } catch {}
    const restore = () => { pending.current = false; setProcessing(false); };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const currencies = new Set(items.map(item => item.product.currency));
  const checkout = async () => {
    if (pending.current || !items.length) return;
    pending.current = true; setProcessing(true); setError("");
    try {
      sessionStorage.setItem("rx-checkout-username", username.trim());
      if (voucherCode.trim()) {
        sessionStorage.setItem("rx-voucher-type", voucherType);
        sessionStorage.setItem("rx-voucher-code", voucherCode.trim());
      } else {
        sessionStorage.removeItem("rx-voucher-type");
        sessionStorage.removeItem("rx-voucher-code");
      }
    } catch {}
    try {
      const response = await fetch("/api/tebex/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), resume, voucherType, voucherCode: voucherCode.trim(), items: items.map(item => ({ packageId: item.product.id, quantity: item.quantity })) }), signal: AbortSignal.timeout(60000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start checkout.");
      const url = trustedTebexUrl(data.checkoutUrl);
      if (!url) throw new Error("The checkout address was invalid. Please try again.");
      // Keep the local cart on cancel, error, and return. A return URL is not proof of payment.
      window.location.assign(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Checkout is unavailable. Your cart is saved.");
      setResume(false);
      window.history.replaceState(null, "", "/cart");
      setProcessing(false); pending.current = false;
    }
  };
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
      <section className="panel bg-[#ffcc00]"><h1 className="text-4xl md:text-6xl font-black uppercase">Your cart</h1><p className="mt-3 font-bold">Review your items before continuing to secure checkout.</p></section>
      {!hydrated ? <p role="status">Loading your cart…</p> : !items.length ? <div className="panel text-center py-16 space-y-6"><h2 className="text-2xl font-bold">Your cart is empty</h2><Link className="action-button" href="/store/main">Browse the store →</Link></div> :
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <section aria-label="Cart items" className="space-y-4">
            {items.map(({ product, quantity }) => <article key={product.id} className="panel flex flex-wrap items-center gap-4">
              <img src={product.img} alt="" className="h-16 w-16 object-contain" onError={event => { if (!event.currentTarget.src.endsWith("/1.png")) event.currentTarget.src = "/1.png"; }} />
              <div className="flex-1 min-w-32"><h2 className="text-lg font-bold break-words">{product.name}</h2><p>{(product.price * quantity).toFixed(2)} {product.currency}</p>{product.recurring && <p className="text-sm">Subscription</p>}</div>
              <div className="flex items-center gap-2">
                <button disabled={processing} className="quantity-button" aria-label={`Decrease quantity of ${product.name}`} onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                <span aria-label={`Quantity: ${quantity}`} className="w-8 text-center font-bold">{quantity}</span>
                <button disabled={processing || product.disableQuantity || quantity >= MAX_QUANTITY} className="quantity-button" aria-label={`Increase quantity of ${product.name}`} onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                <button disabled={processing} className="quantity-button" aria-label={`Remove ${product.name}`} onClick={() => removeItem(product.id)}>✕</button>
              </div>
            </article>)}
            <button disabled={processing} onClick={clearCart} className="underline font-bold py-3">Clear cart</button>
          </section>
          <form onSubmit={event => { event.preventDefault(); void checkout(); }} className="panel space-y-5" aria-label="Checkout">
            <h2 className="text-2xl font-bold">Order summary</h2>
            <p className="text-sm">Estimated subtotal</p>
            {currencies.size === 1 ? <p className="text-3xl font-bold text-accent">{total.toFixed(2)} {items[0].product.currency}</p> : <p role="alert">Please remove items until your cart uses one currency.</p>}
            <label htmlFor="minecraft-username" className="block font-bold">Minecraft Java username</label>
            <input id="minecraft-username" name="username" type="text" required minLength={3} maxLength={16} pattern="[A-Za-z0-9_]{3,16}" value={username} disabled={processing} onChange={event => setUsername(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby="username-help" className="w-full border-4 border-frame p-3" />
            <p id="username-help" className="text-xs">Use the exact Java username that should receive these items.</p>
            <label htmlFor="voucher-type" className="block font-bold">Voucher type</label>
            <select id="voucher-type" value={voucherType} disabled={processing} onChange={event => setVoucherType(event.target.value as "coupon" | "giftcard")} className="w-full border-4 border-frame p-3">
              <option value="coupon">Discount code</option>
              <option value="giftcard">Gift card</option>
            </select>
            <label htmlFor="voucher-code" className="block font-bold">{voucherType === "giftcard" ? "Gift card number" : "Discount code"}</label>
            <input id="voucher-code" type="text" value={voucherCode} disabled={processing} maxLength={128} autoComplete="off" spellCheck={false} onChange={event => setVoucherCode(event.target.value)} aria-describedby="voucher-help" className="w-full border-4 border-frame p-3" />
            <p id="voucher-help" className="text-xs">Optional. Tebex will validate your code and confirm the final total.</p>
            <p className="text-sm leading-relaxed">Tebex confirms your email, taxes and final price. No payment is taken on this page.</p>
            <p className="text-sm"><Link href="/documents/1" className="underline">Terms of Service</Link> · <Link href="/documents/2" className="underline">Privacy Policy</Link></p>
            {resume && <p role="status" className="text-sm font-bold">Back from account verification? Continue to prepare your order.</p>}
            {error && <p role="alert" className="text-error font-bold">{error}</p>}
            <button disabled={processing || currencies.size !== 1} type="submit" className="action-button w-full">{processing ? "Preparing checkout…" : resume ? "Continue checkout" : "Checkout with Tebex"}</button>
            <a href={settings.tebexMainStore} className="block underline text-sm">Open the official store separately</a>
            <p className="text-xs text-muted">Your cart stays saved until you clear it. The separate store link does not transfer these items.</p>
          </form>
        </div>}
    </main><Footer /></div>;
}
