import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import Link from "next/link";
import settings from "@/store-settings.json";
export default function CheckoutReturnPage() {
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-3xl mx-auto w-full px-4 py-16 flex-1"><section className="panel text-center space-y-6">
      <h1 className="text-3xl md:text-5xl font-bold">Back from checkout</h1>
      <p>Thank you for visiting {settings.serverName}. Check your Tebex receipt for payment confirmation and delivery details. This page cannot verify whether a payment completed.</p>
      <p>Your cart is still saved. Once you have confirmed your order, you can clear it from the cart page.</p>
      <Link href="/cart" className="action-button">Return to cart</Link>
      <p><a href={settings.discordLink} className="underline">Contact Discord support</a> if you need help with a confirmed purchase.</p>
    </section></main><Footer /></div>;
}
