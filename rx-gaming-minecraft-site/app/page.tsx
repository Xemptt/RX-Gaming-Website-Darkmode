"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "../component/navbar";
import Footer from "../component/footer";
import storeSettings from "../store-settings.json";
import ServerCounter from "../component/servercounter";
import { realms } from "@/lib/realms";

type Mode = {
    id: string;
    name: string;
    banner: string;
    active: boolean;
    summary: string;
};

export default function HomePage() {
    const modes: Mode[] = [
        {
            id: "insanecraft",
            name: "Insanecraft",
            banner: storeSettings.insanecraftBanner || "/insanecraft_bg.png",
            active: true,
            summary: "A heavily modded world with tech, custom encounters and more to explore.",
        },
        {
            id: "rlcraft",
            name: "RLCraft",
            banner: storeSettings.rlcraftBanner || "/rlcraft_bg.png",
            active: true,
            summary: "A demanding survival adventure filled with dangerous creatures and harsh conditions.",
        },
        {
            id: "practice",
            name: "Coming soon!",
            banner: "/practice_bg.png",
            active: false,
            summary: "Practice mode is in development.",
        },
        {
            id: "skywars",
            name: "Coming soon!",
            banner: "/skywars_bg.png",
            active: false,
            summary: "SkyWars is in development.",
        },
    ];

    return (
        <div className="min-h-screen w-full flex flex-col font-pixel bg-page text-foreground antialiased overflow-x-hidden">
            <Navbar />

            <main id="main-content" className="max-w-7xl mx-auto w-full px-4 py-8 md:py-10 space-y-12 flex-1">
                <section className="relative isolate min-h-[500px] md:min-h-[540px] border-4 border-frame shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-stone-900">
                    <Image
                        src={storeSettings.mainHeroBanner || "/header.png"}
                        alt=""
                        fill
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className="object-cover object-center"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

                    <div className="relative z-10 min-h-[500px] md:min-h-[540px] grid md:grid-cols-[1.1fr_.9fr] items-center gap-4 md:gap-8 px-6 py-10 sm:px-10 md:px-14">
                        <div className="space-y-6 max-w-2xl text-center md:text-left">
                            <p className="inline-block border-2 border-cyan-300/70 bg-black/40 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-cyan-200">
                                Modded Minecraft Network
                            </p>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-tight text-white [text-shadow:4px_4px_0px_#000]">
                                Find your next <span className="text-[#ffcc00]">world.</span>
                            </h1>
                            <p className="max-w-xl mx-auto md:mx-0 text-sm sm:text-base leading-relaxed text-white/90 [text-shadow:2px_2px_0px_#000]">
                                Choose your adventure across Insanecraft and RLCraft, then jump in with the RX-Gaming community.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-1">
                                <Link href="#select-server" className="action-button uppercase">Explore servers <span aria-hidden="true">↓</span></Link>
                                <Link href="/store/main" className="inline-flex items-center justify-center border-4 border-white/70 bg-black/45 px-5 py-3 font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors hover:bg-white/15">
                                    Browse store <span aria-hidden="true" className="ml-2">→</span>
                                </Link>
                            </div>
                            <Link href="/server-details" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-200">
                                View server addresses and connection info
                                <span aria-hidden="true">↗</span>
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center justify-center">
                            <Image
                                src={storeSettings.logoImage}
                                alt={`${storeSettings.serverName} logo`}
                                width={700}
                                height={700}
                                sizes="(max-width: 1280px) 36vw, 440px"
                                className="w-full max-w-[400px] h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
                                priority
                            />
                        </div>
                    </div>
                </section>

                <section aria-labelledby="network-status-heading" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Check before you join</p>
                            <h2 id="network-status-heading" className="mt-2 text-2xl sm:text-3xl font-black uppercase border-l-8 border-[#22D3EE] pl-4">Network status</h2>
                        </div>
                        <p className="text-xs text-muted">Status may be cached for up to five minutes.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {realms.map((server) => (
                            <article key={server.id} className="bg-surface border-4 border-frame p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4 transition-transform duration-200 hover:-translate-y-0.5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-lg font-bold uppercase tracking-wide">{server.name}</h3>
                                    <span className="px-2 py-1 border-2 border-accent-border bg-accent-soft text-accent text-[10px] font-bold uppercase">Modded Java</span>
                                </div>
                                <ServerCounter serverId={server.id} serverName={server.name} />
                            </article>
                        ))}
                    </div>
                </section>

                <section id="select-server" aria-labelledby="game-modes-heading" className="space-y-5 scroll-mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Pick your adventure</p>
                            <h2 id="game-modes-heading" className="mt-2 text-2xl sm:text-3xl font-black uppercase border-l-8 border-[#22D3EE] pl-4">Explore our worlds</h2>
                        </div>
                        <Link href="/server-details" className="font-bold underline underline-offset-4 hover:text-accent">How to join →</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {modes.map((mode) => {
                            const content = (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/5 transition-opacity group-hover:from-black/90" />
                                    <div className="relative z-10 mt-auto p-5 sm:p-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className={`text-2xl sm:text-3xl font-black uppercase text-white [text-shadow:2px_2px_0px_#000] ${mode.active ? "group-hover:text-[#ffcc00]" : ""}`}>{mode.name}</h3>
                                            <span className={`shrink-0 border-2 px-2 py-1 text-[10px] font-bold uppercase ${mode.active ? "border-cyan-200 bg-cyan-950/80 text-cyan-100" : "border-white/50 bg-black/60 text-white/80"}`}>
                                                {mode.active ? "Available" : "In development"}
                                            </span>
                                        </div>
                                        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/90">{mode.summary}</p>
                                        {mode.active && <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase text-[#ffcc00]">View server details <span aria-hidden="true">→</span></span>}
                                    </div>
                                </>
                            );

                            return mode.active ? (
                                <Link
                                    key={mode.id}
                                    href={`/${mode.id}`}
                                    className="group relative flex min-h-[250px] sm:min-h-[280px] overflow-hidden border-4 border-frame bg-stone-900 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-offset-4"
                                >
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${mode.banner}')` }} />
                                    {content}
                                </Link>
                            ) : (
                                <article key={mode.id} aria-disabled="true" className="relative flex min-h-[250px] sm:min-h-[280px] overflow-hidden border-4 border-frame bg-stone-900 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('${mode.banner}')` }} />
                                    {content}
                                </article>
                            );
                        })}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
