"use client";

import Navbar from "../../component/navbar";
import Footer from "../../component/footer";
import { useState } from "react";

export default function StandaloneInsanecraftProfile() {
    // States to toggle interactive dropdown layout panels independently
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBannedDropdownOpen, setIsBannedDropdownOpen] = useState(false);

    // Curated list of prominent core mods featured within the Insanecraft layout modpack
    const modpackList = [
        "Avaritia (Infinity Armor & Weapons)",
        "Draconic Evolution (High-tier Energy & Tools)",
        "Industrial Foregoing (Tech & Automation)",
        "Applied Energistics 2 (Digital Storage Networks)",
        "The Twilight Forest (Magical Dimensions & Bosses)",
        "Biomes O' Plenty (Enchanted World Generation)",
        "Tinkers' Construct (Custom Forged Weaponry)"
    ];

    // List of blacklisted realm items parsed from server configurations
    const bannedItemsList = [
        "lostinfinity_vampyreon_boots",
        "lostinfinity_vampyreon_leggings",
        "lostinfinity_vampyreon_chestplate",
        "lostinfinity_vampyreon_helmet",
        "lostinfinity_vampyreon_prime_boots",
        "lostinfinity_vampyreon_prime_leggings",
        "lostinfinity_vampyreon_prime_chestplate",
        "lostinfinity_vampyreon_prime_helmet",
        "avaritia_infinity_pickaxe",
        "adminweapons_air_admin_sword",
        "adminweapons_fire_admin_sword",
        "adminweapons_water_admin_sword",
        "adminweapons_admin_gun",
        "adminweapons_lightningstaff",
        "adminweapons_poisonous_dynamite",
        "adminweapons_fire_dynamite",
        "adminweapons_heal_dynamite",
        "adminweapons_nuclear_dynamite",
        "adminweapons_attractive_dynamite",
        "adminweapons_repulsive_dynamite",
        "adminweapons_highjump_dynamite",
        "adminweapons_glass_launcher",
        "adminweapons_glass_bomb",
        "adminweapons_kickstaff",
        "adminweapons_ban_hammer",
        "adminweapons_admin_rocket_launcher",
        "adminweapons_teleport_admin_sword",
        "adminweapons_extinguisher",
        "draconicevolution_reactor_core",
        "avaritia_infinity_shovel",
        "draconicevolution_celestial_manipulator",
        "chickenchunks_chunk_loader",
        "extrautils2_bagofholding",
        "chancecubes_chance_icosahedron",
        "chancecubes_compact_giant_chance_cube",
        "chancecubes_chance_cube",
        "draconicevolution_reactor_component",
        "draconicevolution_flow_gate",
        "draconicevolution_reactor_part",
        "icbmclassic_explosives",
        "cyclicmagic_battery_infinite",
        "draconicadditions_chaos_stabilizer_core",
        "weather2_weather_machine",
        "weather2_anemometer",
        "weather2_weather_deflector",
        "weather2_weather_forecast",
        "weather2_wind_vane",
        "weather2_tornado_siren_manual",
        "weather2_tornado_siren",
        "weather2_tornado_sensor",
        "weather2_weather_item",
        "mahoutsukai_mystic_staff",
        "twilightforest_uncrafting_table",
        "barrier",
        "inventorypets_chest_pet",
        "inventorypets_double_chest_pet"
    ];
    return (
        <div className="min-h-screen flex flex-col font-pixel bg-page text-foreground antialiased relative z-10">
            <Navbar />

            <main id="main-content" className="max-w-4xl mx-auto w-full px-4 py-12 flex-1 space-y-8 pointer-events-auto relative z-20">
                
                {/* Header Profile Title Module */}
                <div className="border-4 border-frame bg-stone-900 text-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-center md:text-left">
                    <div className="relative z-10 space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[#ffcc00] [text-shadow:3px_3px_0px_#000]">
                            Insanecraft Profile
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
                                About Insanecraft
                            </h3>
                            <p className="text-muted leading-relaxed text-sm font-pixel">
                                Welcome to the ultimate survival challenge! Insanecraft is heavily modified to feature insane weaponry, powerful custom boss encounters, magical dimensions, and high-tier tech automation tracking trees. Form massive factions, conquer realms, and dominate the leaderboard grid map!
                            </p>
                        </div>

                        {/* Dropdown Component: Featured Mods */}
                        <div className="border-4 border-frame bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left overflow-hidden">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-expanded={isDropdownOpen}
                                aria-controls="modpack-list"
                                type="button"
                                className="w-full p-6 flex items-center justify-between font-black text-xl uppercase bg-surface border-b-4 border-frame transition-all hover:bg-surface-hover active:bg-surface-muted cursor-pointer"
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
                                            <span className="min-w-0 [overflow-wrap:anywhere] text-foreground tracking-wide">{mod}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dropdown Component: Banned Items List */}
                        <div className="border-4 border-frame bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left overflow-hidden">
                            <button 
                                onClick={() => setIsBannedDropdownOpen(!isBannedDropdownOpen)}
                                aria-expanded={isBannedDropdownOpen}
                                aria-controls="banned-items-list"
                                type="button"
                                className="w-full p-6 flex items-center justify-between font-black text-xl uppercase bg-surface border-b-4 border-frame transition-all hover:bg-surface-hover active:bg-surface-muted cursor-pointer"
                            >
                                <span>Banned Items List</span>
                                <svg 
                                    className={`w-6 h-6 transform transition-transform duration-200 ${isBannedDropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* Slide-out item panel containing the list of restricted items */}
                            <div id="banned-items-list" hidden={!isBannedDropdownOpen}>
                                <div className="p-6 bg-surface-muted max-h-80 overflow-y-auto space-y-3 font-bold text-xs uppercase text-muted border-t-0 custom-scrollbar">
                                    {bannedItemsList.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 py-1 border-b border-dashed border-line last:border-0">
                                            <span className="text-red-500 font-black text-sm">✕</span>
                                            <span className="min-w-0 [overflow-wrap:anywhere] text-foreground tracking-wide">{item}</span>
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
                                MC.BICCYS.UK:25567
                            </p>
                            <p className="text-[10px] text-muted font-bold uppercase mt-2">
                                Select this address to copy it
                            </p>
                        </div>

                        {/* Modpack Client Download Anchor Button Slot */}
                        <a 
                            href="https://www.curseforge.com/minecraft/modpacks/insanecraft-modpack" 
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
                        <a
                            href="/server-details"
                            className="border-4 border-frame bg-surface text-foreground p-4 font-black text-sm uppercase tracking-wider block text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                        >
                            All server details
                        </a>
                    </div>
                </div>

                <section className="panel space-y-4">
                    <h2 className="text-2xl font-bold">Insanecraft packages</h2>
                    <p>See current packages, prices and availability in the store.</p>
                    <a href="/store/insanecraft" className="action-button">Browse Insanecraft store</a>
                </section>

            </main>

            <Footer />
        </div>
    );
}
