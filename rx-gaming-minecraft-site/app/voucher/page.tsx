import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import settings from "@/store-settings.json";
export default function VoucherPage() {
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
      <section className="panel bg-[#1E1B4B] text-white relative overflow-hidden grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 relative z-10"><h1 className="text-3xl md:text-5xl font-black uppercase">Vouchers &amp; gift cards</h1>
          <p className="text-cyan-200 leading-relaxed">Have a store gift card or promotional code? Add your chosen items in the official Tebex store, then enter the code at checkout.</p>
          <a className="action-button" href={settings.tebexMainStore}>Open official store →</a>
          <p className="text-sm">In-game reward vouchers may use a different redemption method. <a href={settings.discordLink} className="underline">Contact our Discord support</a> for instructions. No code is redeemed on this page.</p>
        </div>
        <img src="/voucher.png" alt="" className="w-full max-h-80 object-contain" />
      </section>
    </main><Footer /></div>;
}
