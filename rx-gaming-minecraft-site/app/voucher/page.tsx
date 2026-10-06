"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import settings from "@/store-settings.json";
export default function VoucherPage() {
  const router = useRouter();
  const [voucherType, setVoucherType] = useState<"coupon" | "giftcard">("coupon");
  const [voucherCode, setVoucherCode] = useState("");
  const [error, setError] = useState("");
  function continueToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = voucherCode.trim();
    if (!code || code.length > 128 || /[\u0000-\u001f\u007f]/.test(code)) {
      setError("Enter a valid gift card or discount code.");
      return;
    }
    try {
      sessionStorage.setItem("rx-voucher-type", voucherType);
      sessionStorage.setItem("rx-voucher-code", code);
      router.push("/cart");
    } catch {
      setError("Your browser could not save the code. Please allow site storage and try again.");
    }
  }
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
      <section className="panel bg-[#1E1B4B] text-white relative overflow-hidden grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 relative z-10"><h1 className="text-3xl md:text-5xl font-black uppercase">Vouchers &amp; gift cards</h1>
          <p className="text-cyan-200 leading-relaxed">Have a Tebex gift card or discount code? Enter it here, then add items to your cart. We’ll apply it to your Tebex basket before secure checkout.</p>
          <form onSubmit={continueToCart} className="space-y-3" aria-label="Redeem a Tebex code">
            <label htmlFor="voucher-type" className="block font-bold">Code type</label>
            <select id="voucher-type" value={voucherType} onChange={event => setVoucherType(event.target.value as "coupon" | "giftcard")} className="w-full border-4 border-frame p-3 text-foreground">
              <option value="coupon">Discount code</option>
              <option value="giftcard">Gift card</option>
            </select>
            <label htmlFor="voucher-code" className="block font-bold">{voucherType === "giftcard" ? "Gift card number" : "Discount code"}</label>
            <input id="voucher-code" type="text" value={voucherCode} onChange={event => { setVoucherCode(event.target.value); setError(""); }} maxLength={128} autoComplete="off" spellCheck={false} required className="w-full border-4 border-frame p-3 text-foreground" />
            {error && <p role="alert" className="font-bold text-red-200">{error}</p>}
            <button type="submit" className="action-button">Continue to cart →</button>
          </form>
          <p className="text-sm">Tebex checks the code and confirms any balance or discount at checkout. <a href={settings.tebexMainStore} className="underline">Open the official store</a>.</p>
          <p className="text-sm">For in-game reward vouchers, <a href={settings.discordLink} className="underline">contact our Discord support</a>.</p>
        </div>
        <img src="/voucher.png" alt="" className="w-full max-h-80 object-contain" />
      </section>
    </main><Footer /></div>;
}
