"use client";

import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import storeSettings from "@/store-settings.json";

export default function ChangelogPage() {
    // Clean mock update log variables matching your server launch setup
    const updates = [
        {
            version: "v1.0.0",
            date: "OCTOBER 2026",
            title: "OFFICIAL NETWORK LAUNCH",
            description: "Welcome to the grand opening of the RX-Gaming store network! Explore the Insanecraft and RLCraft realm profiles and official store. Live server availability is shown on the home page.",
            color: "var(--accent)"
        },
        {
            version: "v0.9.5",
            date: "SEPTEMBER 2026",
            title: "STORE BRAND TRANSFORMATION",
            description: "Completed full visual migration across all shop modules. Implemented transparent voxel logo assets, dark network theme blocks, and custom modpack banner graphics.",
            color: "var(--accent)"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col font-pixel bg-page text-foreground antialiased">
            <Navbar />
            
            <main id="main-content" className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8 flex-1">
                {/* Header Section Container */}
                <div className="bg-[#1E1B4B] border-4 border-frame shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-10 md:p-14 text-center md:text-left relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                        <span className="text-white text-[90px] md:text-[180px] font-black opacity-5 tracking-tighter">
                            PATCHES
                        </span>
                    </div>

                    <div className="relative z-10 max-w-2xl w-full">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white [text-shadow:4px_4px_0px_#000] tracking-wider mb-4 leading-tight">
                            CHANGELOG
                        </h1>
                        <p className="text-[#22D3EE] text-lg font-bold uppercase tracking-widest leading-tight">
                            TRACK LATEST SERVER UPDATES & RELEASES FOR {storeSettings.serverName.toUpperCase()}
                        </p>
                    </div>
                </div>

                {/* Timeline Update Output Elements Grid */}
                <div className="space-y-6 max-w-4xl mx-auto pt-4 w-full">
                    {updates.map((up, idx) => (
                        <div key={idx} className="bg-surface border-4 border-frame shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 relative flex flex-col gap-3 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-4 border-frame pb-3 gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-xl uppercase tracking-wide" style={{ color: up.color }}>
                                        {up.version}
                                    </span>
                                    <h2 className="text-xl font-black uppercase text-foreground tracking-wide">
                                        {up.title}
                                    </h2>
                                </div>
                                <span className="text-muted font-bold text-xs uppercase tracking-widest sm:text-right">
                                    {up.date}
                                </span>
                            </div>
                            <p className="font-bold text-sm uppercase text-muted leading-relaxed tracking-wide pt-2">
                                {up.description}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
