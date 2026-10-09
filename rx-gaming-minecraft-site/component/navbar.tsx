"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCustomCursor } from "@/component/appearance-provider";
import { useCartStore } from "@/store/cart";
import settings from "@/store-settings.json";
import StoreAnnouncement from "@/component/store-announcement";
const links = [["/", "Home"], ["/server-details", "Details"], ["/store/main", "Store"], ["/careers", "Careers"], ["/voucher", "Voucher"], ["/documents/1", "Documents"], ["/changelog", "Changelog"]];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { enabled: cursor, toggle: toggleCursor } = useCustomCursor();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dark = mounted && resolvedTheme === "dark";
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const currentPage = (href: string) => pathname === href ? "page" as const :
    ((href === "/store/main" && pathname.startsWith("/store/")) ||
      (href === "/documents/1" && pathname.startsWith("/documents/"))) ? "location" as const : undefined;
  const count = useCartStore(state => state.getItemCount());
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && open) { setOpen(false); menuButton.current?.focus(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  const toggleTheme = () => setTheme(dark ? "light" : "dark");
  return <div className="relative z-50 w-full">
<div className="bg-[#1E1B4B] flex items-center gap-2 py-2 px-4 overflow-hidden"> 
  <p 
    className="store-announcement text-sm text-center leading-relaxed font-bold tracking-wide w-full text-red-200"
  >
    <StoreAnnouncement />
  </p> 
</div>
    <header className="bg-surface border-b-[3px] border-line px-4">
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-h-24">
        <Link href="/" aria-label={`${settings.serverName} home`} className="shrink-0">
          <Image src={settings.logoImage} alt={settings.serverName} width={1200} height={1200} className="w-20 sm:w-28 h-20 sm:h-24 object-contain" priority sizes="112px" />
        </Link>
        <div className="hidden xl:flex items-center gap-1">
          {links.map(([href, label]) => <Link key={href} href={href} aria-current={currentPage(href)} className="nav-link">{label}</Link>)}
          <button type="button" aria-pressed={cursor} onClick={toggleCursor} className="nav-link border-2 border-line">Cursor: {cursor ? "On" : "Off"}</button>
          <button type="button" disabled={!mounted} aria-label="Dark mode" aria-pressed={dark} onClick={toggleTheme} className="nav-link border-2 border-line">{dark ? "☾ Dark" : "☀ Light"}</button>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cart" aria-label={`Cart, ${count} items`} className="border-4 border-frame px-2 sm:px-3 py-2 text-sm font-bold flex gap-2 items-center">Cart <span className="bg-[#ffcc00] px-2 text-black">{count}</span></Link>
          <button ref={menuButton} type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="xl:hidden border-2 border-frame px-3 py-2 font-bold" aria-label={open ? "Close menu" : "Open menu"}>{open ? "✕" : "☰"}</button>
        </div>
      </nav>
      <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!open} className="xl:hidden border-t-2 border-line py-3">
        {links.map(([href, label]) => <Link onClick={() => setOpen(false)} key={href} href={href} aria-current={currentPage(href)} className="block py-3 px-2 font-bold uppercase">{label}</Link>)}
        <button type="button" aria-pressed={cursor} onClick={toggleCursor} className="px-2 py-3 font-bold">Custom cursor: {cursor ? "On" : "Off"}</button>
        <button type="button" disabled={!mounted} aria-label="Dark mode" aria-pressed={dark} onClick={toggleTheme} className="block px-2 py-3 font-bold">Dark mode: {dark ? "On" : "Off"}</button>
      </nav>
    </header>
  </div>;
}
