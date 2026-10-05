"use client";

/* FIX: Upgraded directory tracking jumps to three steps back ('../../../') to cleanly clear out deep folder nesting errors under Next.js Turbopack! */
import Navbar from "../../../component/navbar";
import Footer from "../../../component/footer";
import storeSettings from "../../../store-settings.json";

type RealmRegion = {
    id: string;
    name: string;
    banner: string;
    active: boolean;
    statusText: string;
    storeUrl: string;
};

export default function StoreMainPage() {
    const regions: RealmRegion[] = [
        {
            id: 'insanecraft',
            name: 'Insanecraft',
            banner: storeSettings.insanecraftBanner || '/header.png',
            active: true,
            statusText: 'CLICK TO ENTER STORE',
            storeUrl: "/store/insanecraft"
        },
        {
            id: 'rlcraft',
            name: 'RLCraft',
            banner: storeSettings.rlcraftBanner || '/header.png',
            active: true,
            statusText: 'CLICK TO ENTER STORE',
            storeUrl: "/store/rlcraft"
        },
        { id: 'practice', name: 'COMING SOON...', banner: storeSettings.comingSoonBanner || '/header.png', active: false, statusText: 'UNDER DEVELOPMENT', storeUrl: "#" },
        { id: 'skywars', name: 'COMING SOON...', banner: storeSettings.comingSoonBanner || '/header.png', active: false, statusText: 'UNDER DEVELOPMENT', storeUrl: "#" },
    ];

    return (
        <div className="min-h-screen flex flex-col font-pixel bg-page text-foreground antialiased relative z-10">
            <Navbar />

            <main id="main-content" className="max-w-4xl mx-auto w-full px-4 py-12 flex-1 space-y-8 pointer-events-auto relative z-20">
                {/* Store Header Banner */}
                <div className="border-4 border-frame bg-[#1E1B4B] text-white p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-center gap-2">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider [text-shadow:3px_3px_0px_#000]">
                        SERVER STORE
                    </h1>
                    <p className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest leading-relaxed">
                        SELECT A REALM REGION BELOW TO BROWSE AVAILABLE RANKS & BUNDLES
                    </p>
                </div>

                {/* Realm Regions Selection Grid */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-left">
                        <span className="w-2 h-6 bg-[#22D3EE] inline-block" />
                        <h4 className="text-lg font-black uppercase tracking-wide">REALM REGIONS</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white font-bold">
                        {regions.map((region) => (
                            region.active ? (
                                <a
                                    key={region.id}
                                    href={region.storeUrl}
                                    className="relative h-48 border-4 border-frame shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 group-hover:opacity-0"
                                        style={{ backgroundImage: `url('${region.banner}')` }}
                                    />

                                    {/* Immersive portal effect animation */}
                                    <div className="absolute inset-0 bg-[#2b0c47] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center overflow-hidden">
                                        <div
                                            className="absolute inset-[-50%] bg-cover opacity-70 mix-blend-screen bg-center pointer-events-none animate-[spin_40s_linear_infinite]"
                                            style={{ backgroundImage: `url('/beam.svg')` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1b0530] via-transparent to-[#1b0530] opacity-90" />
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,132,252,0.4)_0%,transparent_70%)] animate-pulse" />
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-all duration-300" />

                                    <div className="relative z-10 h-full flex flex-col justify-end p-6 text-left pointer-events-none">
                                        <h2 className="text-2xl uppercase tracking-wider text-white [text-shadow:2px_2px_0px_rgba(0,0,0,1)] group-hover:text-[#C084FC] transition-colors duration-300">{region.name}</h2>
                                        <p className="text-[#22D3EE] text-[10px] uppercase tracking-wider [text-shadow:1px_1px_0px_rgba(0,0,0,1)] group-hover:animate-pulse">{region.statusText}</p>
                                    </div>
                                </a>
                            ) : (
                                <div
                                    key={region.id}
                                    className="relative h-48 border-4 border-frame shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden group cursor-not-allowed text-left transition-all duration-300 opacity-60"
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url('${region.banner}')` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none flex flex-col justify-end p-6" />
                                    <div className="relative z-10 h-full flex flex-col justify-end p-6 text-left pointer-events-none">
                                        <h2 className="text-2xl uppercase tracking-wider text-gray-400 [text-shadow:2px_2px_0px_rgba(0,0,0,1)]">{region.name}</h2>
                                        <p className="text-red-400 text-[10px] uppercase tracking-wider [text-shadow:1px_1px_0px_rgba(0,0,0,1)]">{region.statusText}</p>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
