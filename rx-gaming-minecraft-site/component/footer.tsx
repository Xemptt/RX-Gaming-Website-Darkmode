"use client";

import Link from "next/link";
import storeSettings from "@/store-settings.json";

export default function Footer() {
    return (
        /* LOCK LAYERS: Hardcoded z-40 depth and pointer-events-auto properties guarantee the cursor clicks through flawlessly */
        <footer className="mt-auto bg-page border-t-2 border-line pt-10 pb-6 w-full relative z-40 pointer-events-auto">
            <div className="max-w-7xl mx-auto px-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10 text-left">

                    {/* Column 1 - Active Shop Navigation Links */}
                    <div className="flex flex-col items-start gap-3 relative z-50">
                        <Link href="/insanecraft" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Insanecraft
                        </Link>
                        <Link href="/rlcraft" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Rlcraft
                        </Link>
                        <Link href="/cart" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Cart
                        </Link>
                        <Link href="/voucher" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Voucher
                        </Link>
                    </div>

                    {/* Column 2 - Active Network Directory Links */}
                    <div className="flex flex-col items-start gap-3 relative z-50">
                        <Link href="/" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Home
                        </Link>
                        <Link href="/careers" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Careers
                        </Link>
                        <Link href="/documents" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Documents
                        </Link>
                        <Link href="/server-details" className="text-muted hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors block py-0.5 pointer-events-auto cursor-pointer">
                            Details
                        </Link>
                    </div>

                    {/* Column 3 - Social Channels (FIXED YOUTUBE PATH MATRIX) */}
                    <div className="flex flex-col items-start gap-3 relative z-50">
                        <h4 className="font-black uppercase tracking-widest text-xs text-muted mb-1">Social media</h4>
                        <div className="flex gap-3 pt-1 relative z-50">
                            <a href={storeSettings.discordLink} target="_blank" rel="noopener noreferrer"
                                className="w-10 h-10 border-2 border-line flex items-center justify-center hover:bg-[#5865F2] hover:border-[#5865F2] hover:text-white text-muted transition-all pointer-events-auto cursor-pointer"
                                aria-label="Discord">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                                    <path d="M107.7,8.07A105.15,107.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a74.37,74.37,0,0,0,6.72-10.93,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.67-2.1a75.22,75.22,0,0,0,93.92,0c.86.73,1.76,1.43,2.67,2.1a68.86,68.6,0,0,1-10.64,5.12,74.74,74.37,0,0,0,6.72,10.93,105.54,105.73,0,0,0,31-18.83C129.07,50.7,123,27.82,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.94,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.17,46,96.07,53,91,65.69,84.69,65.69Z"/>
                                </svg>
                            </a>
                            
                            <a href={storeSettings.tiktokLink} target="_blank" rel="noopener noreferrer" 
                                className="w-10 h-10 border-2 border-line flex items-center justify-center hover:bg-black hover:border-frame hover:text-white text-muted transition-all pointer-events-auto cursor-pointer" aria-label="TikTok">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.8a8.18 8.18 0 0 0 4.77 1.52V6.85a4.85 4.85 0 0 1-1-.16z" />
                                </svg>
                            </a>
                            
                            {/* FIXED YOUTUBE BOX LINK: Handcrafted precision pixel scale coordinates for perfect display framing */}
                            <a href={storeSettings.youtubeLink} target="_blank" rel="noopener noreferrer" 
                                className="w-10 h-10 border-2 border-line flex items-center justify-center hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white text-muted transition-all pointer-events-auto cursor-pointer" aria-label="YouTube">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M23.496 6.127a3.003 3.003 0 0 0-2.11-2.116C19.515 3.49 12 3.49 12 3.49s-7.515 0-9.386.52A3.005 3.003 0 0 0 .504 6.128C0 8.016 0 12 0 12s0 3.984.504 5.872a3.003 3.003 0 0 0 2.11 2.116c1.871.522 9.386.522 9.386.522s7.515 0 9.386-.522a3.005 3.003 0 0 0 2.11-2.116C24 15.984 24 12 24 12s0-3.984-.504-5.873Zm-14.415 9.42V8.453L15.35 12l-6.269 3.547Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Rights Ribbon */}
                <div className="border-t-2 border-line pt-6 flex flex-col md:flex-row items-center justify-between gap-3 relative z-30">
                    <p className="font-black uppercase text-xs tracking-tight text-muted">
                        COPYRIGHT {new Date().getFullYear()} {storeSettings.serverName.toUpperCase()}. ALL RIGHTS RESERVED
                    </p>
                    <p className="text-[10px] font-bold text-muted uppercase leading-relaxed tracking-wider text-center md:text-right">
                        {storeSettings.serverName.toUpperCase()}  is not associated with Mojang or Microsoft in any way.
                    </p>
                </div>

            </div>
        </footer>
    );
}
