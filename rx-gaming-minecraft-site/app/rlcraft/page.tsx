"use client";

import Navbar from "../../component/navbar";
import Footer from "../../component/footer";
import { useState } from "react";

export default function StandaloneRLCraftProfile() {
    // State to toggle the custom interactive mods dropdown menu block
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Curated list of prominent core mods featured within the RLCraft modpack layout
    const modpackList = [
        "Lycanites Mobs (Custom Dangerous Creatures & Bosses)",
        "Tough As Nails (Thirst & Temperature Survival Mechanics)",
        "Ice and Fire: Dragons (Mythical Creatures & Forged Gear)",
        "Dynamic Surroundings (Immersive Audio & Visuals)",
        "RLTweaks (Core Pack Adjustments & Balancing)",
        "Better Survival (Additional Weapons & Enchantments)",
        "First Aid (Localized Body Part Damage System)",
        "Waystones (Teleportation Network Systems)"
    ];

    return (
        <div className="min-h-screen flex flex-col font-pixel bg-page text-foreground antialiased relative z-10">
            <Navbar />

            <main id="main-content" className="max-w-4xl mx-auto w-full px-4 py-12 flex-1 space-y-8 pointer-events-auto relative z-20">
                
                {/* Header Profile Title Module */}
                <div className="border-4 border-frame bg-stone-900 text-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-center md:text-left">
                    <div className="relative z-10 space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[#ffcc00] [text-shadow:3px_3px_0px_#000]">
                            RLCraft Profile
                        </h1>
                        <p className="text-[#22D3EE] text-sm font-bold uppercase tracking-widest">
                            Official Standalone Realm Information Hub
                        </p>
                    </div>
                </div>

                {/* Main 2-Column Core Info Split */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left Column Box Details Grid */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="border-4 border-frame bg-surface p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
                            <h3 className="text-xl font-black uppercase border-b-4 border-frame pb-2 mb-4 text-foreground">
                                About RLCraft
                            </h3>
                            <p className="text-muted leading-relaxed text-sm font-pixel">
                                Welcome to the most dangerous modpack in Minecraft. RLCraft stands for Real Life or Realism Craft, heavily altering the game to feature hardcore survival systems, unforgiving temperature environments, localized body damage, and aggressive mythical beasts that will test your gaming skill to its absolute limit!
                            </p>
                        </div>

                        {/* Interactive Mods Dropdown Component */}
                        <div className="border-4 border-frame bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left overflow-hidden">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-expanded={isDropdownOpen}
                                aria-controls="modpack-list"
                                className="w-full p-6 flex items-center justify-between font-black text-xl uppercase bg-surface border-b-4 border-frame transition-all hover:bg-surface-hover active:bg-surface-muted"
                            >
                                <span>Featured Mods List</span>
                                <svg 
                                    className={`w-6 h-6 transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* Slide-out item panel containing the list of mods */}
                            <div id="modpack-list" hidden={!isDropdownOpen}>
                                <div className="p-6 bg-surface-muted space-y-3 font-bold text-xs uppercase text-muted border-t-0">
                                    {modpackList.map((mod, index) => (
                                        <div key={index} className="flex items-center gap-2 py-1 border-b border-dashed border-line last:border-0">
                                            <span className="text-[#22D3EE] font-black text-sm">▶</span>
                                            <span className="text-foreground tracking-wide">{mod}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column Quick-Action Navigation Hub Panels */}
                    <div className="space-y-6">
                        {/* Direct Connection Address Node Box */}
                        <div className="border-4 border-frame bg-[#22D3EE]/10 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
                            <h4 className="font-black uppercase text-xs text-muted mb-1">Server Address IP</h4>
                            <p className="font-black text-sm uppercase text-foreground bg-surface border-2 border-frame py-2 tracking-wide select-all break-all">
                                PLAY.RX-GAMING.ONLINE:25565
                            </p>
                            <p className="text-[10px] text-muted font-bold uppercase mt-2">
                                Select this address to copy it
                            </p>
                        </div>

                        {/* Modpack Client Download Anchor Button Slot */}
                        {/* FIX: Injected the exact direct CurseForge pack listing layout address link right here */}
                        <a 
                            href="https://www.curseforge.com/minecraft/modpacks/rlcraft" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="border-4 border-frame bg-[#FF8000] text-black p-5 font-black text-lg uppercase tracking-wider block text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                        >
                            CurseForge Link
                        </a>

                        {/* Return Navigation Anchor Link */}
                        <a 
                            href="/" 
                            className="border-4 border-frame bg-[#ffcc00] text-black p-4 font-black text-sm uppercase tracking-wider block text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                        >
                            Back to Home
                        </a>
                    </div>

                </div>

                <section className="panel space-y-4"><h2 className="text-2xl font-bold">RLCraft packages</h2><p>See current packages, prices and availability in the store.</p><a href="/store/rlcraft" className="action-button">Browse RLCraft store</a></section>

            </main>

            <Footer />
        </div>
    );
}
