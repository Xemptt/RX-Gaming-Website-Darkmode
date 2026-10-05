"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";

const CursorContext = createContext({ enabled: false, toggle: () => {} });
export const useCustomCursor = () => useContext(CursorContext);

export default function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try { setEnabled(localStorage.getItem("rx-cursor") === "true"); } catch {}
    const sync = (event: StorageEvent) => {
      if (event.key === "rx-cursor" || event.key === null) setEnabled(event.newValue === "true");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("minecraft-cursor", enabled);
    return () => document.documentElement.classList.remove("minecraft-cursor");
  }, [enabled]);

  const toggle = () => {
    setEnabled(!enabled);
    try { localStorage.setItem("rx-cursor", String(!enabled)); } catch {}
  };

  return <ThemeProvider attribute="data-theme" storageKey="rx-theme" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <CursorContext.Provider value={{ enabled, toggle }}>{children}</CursorContext.Provider>
  </ThemeProvider>;
}
