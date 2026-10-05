"use client";

import Link from "next/link";
import Navbar from "@/component/navbar";
import Footer from "@/component/footer";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col font-pixel bg-page text-foreground antialiased">
            <Navbar />

            <main id="main-content" className="flex-grow flex items-center justify-center p-4 py-20">
                <div className="max-w-4xl w-full">
                    <div className="bg-[#FF4444] border-4 border-frame shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-16 relative overflow-hidden">

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20">
                            <span className="text-white text-[150px] md:text-[300px] font-black tracking-tighter uppercase">
                                404
                            </span>
                        </div>

                        <div className="relative z-10 text-center">
                            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black uppercase text-white [text-shadow:6px_6px_0px_#000] tracking-tighter mb-4">
                                ERROR
                            </h1>

                            <h2 className="text-2xl md:text-4xl font-black uppercase text-black mb-8 leading-tight">
                                PAGE NOT FOUND
                            </h2>

                            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                                <Link
                                    href="/"
                                    className="w-full md:w-auto bg-surface text-foreground border-4 border-frame px-10 py-4 font-black text-xl uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] hover:text-black hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-none"
                                >
                                   HOME
                                </Link>

                                <Link
                                    href="/store/main"
                                    className="w-full md:w-auto bg-black text-white border-4 border-frame px-10 py-4 font-black text-xl uppercase shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] hover:bg-zinc-800 transition-all"
                                >
                                    VIEW STORE
                                </Link>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 hidden md:block">
                            <div className="flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-4 h-4 bg-black animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
