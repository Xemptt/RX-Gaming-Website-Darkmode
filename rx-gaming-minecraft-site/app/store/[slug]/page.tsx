import { notFound } from "next/navigation";
import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import Catalog from "@/component/catalog";
import { getRealm } from "@/lib/realms";
import settings from "@/store-settings.json";
export default async function StoreModePage({ params }: { params: Promise<{ slug: string }> }) {
  const realm = getRealm((await params).slug);
  if (!realm) notFound();
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8 flex-1">
      <section className="border-4 border-frame shadow-[8px_8px_0px_#000] p-6 md:p-12 bg-cover bg-center text-white" style={{ backgroundImage: `linear-gradient(#0008,#000c),url('${realm.id === "insanecraft" ? settings.insanecraftBanner : settings.rlcraftBanner}')` }}>
        <h1 className="text-3xl md:text-5xl font-black uppercase break-words">{realm.name} Store</h1>
        <p className="mt-4 font-bold text-cyan-200">Choose your next upgrade</p>
      </section>
      <Catalog realm={realm.id} />
    </main><Footer /></div>;
}
