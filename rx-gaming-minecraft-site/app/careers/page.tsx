"use client";

import Navbar from "../../component/navbar";
import Footer from "../../component/footer";
import { useState } from "react";
import Image from "next/image";
import trophy from "@/public/trophy.png";
import storeSettings from "../../store-settings.json";

type Position = {
    id: string;
    title: string;
    requirements: string[];
    applyLink: string;
};

export default function CareersPage() {
    // State layout memory pool tracks which specific rank drawer card box is expanded open
    const [expandedPosition, setExpandedPosition] = useState<string | null>("helper");

    // Curated staff rank requirements definition matrix array module
    const positions: Position[] = [
        {
            id: "helper",
            title: "Helper",
            requirements: [
                "MINIMUM 15 YEARS OF AGE",
                "EXCELLENT KNOWLEDGE OF GAME MECHANICS & GAME MODES",
                "WORKING MICROPHONE & ACTIVE DISCORD ACCOUNT",
                "NO PRIOR BANS OR INFRACTIONS ON THE SERVER"
            ],
            /* FIX: Points directly to your separate careersFormLink property variable */
            applyLink: storeSettings.careersFormLink || "#"
        },
        {
            id: "moderator",
            title: "Moderator",
            requirements: [
                "MINIMUM 16 YEARS OF AGE",
                "PREVIOUS STAFF EXPERIENCE on a Minecraft network preferred",
                "CAPABLE OF RESOLVING player disputes and chat toxicity firmly",
                "PROACTIVE IN MONITORING hacks, cheat clients, and exploit points"
            ],
            applyLink: storeSettings.careersFormLink || "#"
        },
        {
            id: "administrator",
            title: "Administrator",
            requirements: [
                "MINIMUM 18 YEARS OF AGE",
                "PROVEN TEAM MANAGEMENT or configuration control experience",
                "ADVANCED LOG ANALYSIS, plugin handling, and event coordination tracking",
                "HIGH AVAILABILITY and devotion to network infrastructure operations"
            ],
            applyLink: storeSettings.careersFormLink || "#"
        }
    ];

    const togglePosition = (id: string) => {
        setExpandedPosition(expandedPosition === id ? null : id);
    };

    return (
        <div className="min-h-screen flex flex-col font-pixel bg-page text-foreground antialiased relative z-10">
            <Navbar />

            <main id="main-content" className="max-w-4xl mx-auto w-full px-4 py-12 flex-1 space-y-8 pointer-events-auto relative z-20">
                
                {/* Careers Branding Splash Banner Header */}
                <div className="bg-[#1E1B4B] border-4 border-frame text-white p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="relative z-10 space-y-3 max-w-xl text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white [text-shadow:3px_3px_0px_#000]">
                            CAREERS
                        </h1>
                        <p className="text-[#22D3EE] text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed">
                            JOIN THE {storeSettings.serverName.toUpperCase()} STAFF TEAM
                        </p>
                    </div>
                    
                    {/* Retro Trophy Skin Graphic Element Vector Box */}
                    <div className="relative z-10 animate-[bounce_3s_ease-in-out_infinite]">
                        <Image
                            src={trophy}
                            sizes="(max-width: 767px) 128px, 160px"
                            alt="Staff Recruitment Trophy" 
                            className="w-32 h-32 md:w-40 md:h-34 object-contain select-none pointer-events-none drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" 
                        />
                    </div>
                </div>

                <div className="space-y-6 pb-8">
                    {positions.map((pos) => {
                        const isOpen = expandedPosition === pos.id;
                        return (
                            <div 
                                key={pos.id}
                                className="border-4 border-frame bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all duration-200"
                            >
                                {/* Interactive Bar Drawer Header Trigger */}
                                <div className="p-6 flex flex-wrap gap-4 items-center justify-between bg-surface border-b-4 border-frame select-none">
                                    <h3 className="text-xl font-black uppercase tracking-wide text-foreground">
                                        {pos.title}
                                    </h3>
                                    <button
                                        onClick={() => togglePosition(pos.id)}
                                        aria-expanded={isOpen}
                                        aria-controls={`position-${pos.id}`}
                                        aria-label={`${isOpen ? "Close" : "Open"} ${pos.title} requirements`}
                                        className={`border-4 border-frame font-black text-xs uppercase px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none ${
                                            isOpen ? "bg-red-400 text-black" : "bg-[#22D3EE] text-black"
                                        }`}
                                    >
                                        {isOpen ? "CLOSE" : "OPEN"}
                                    </button>
                                </div>

                                {/* Slide-out Requirements Data Container */}
                                <div id={`position-${pos.id}`} hidden={!isOpen}>
                                    <div className="p-6 bg-surface-muted space-y-6 border-t-0">
                                        <div className="space-y-3 font-bold text-xs uppercase text-muted">
                                            {pos.requirements.map((req, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <span className="text-[#C084FC] font-black">»</span>
                                                    <p className="text-muted tracking-wide pt-0.5 leading-relaxed">{req}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Apply Now Call-to-Action Link Anchor */}
                                        <a 
                                            href={pos.applyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full border-4 border-frame bg-[#22D3EE] text-black font-black text-sm uppercase py-3 tracking-widest text-center block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                                        >
                                            APPLY NOW
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </main>

            <Footer />
        </div>
    );
}
