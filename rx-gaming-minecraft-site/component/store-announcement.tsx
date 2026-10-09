"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import settings from "@/store-settings.json";

export default function StoreAnnouncement() {
  const [onSale, setOnSale] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/tebex/promotions", {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        });
        if (!response.ok) throw new Error("Offers unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setOnSale(data.onSale === true);
      } catch {
        if (!controller.signal.aborted) setOnSale(false);
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return <>
    {settings.announcementCoupon && <><Link href="/voucher" className="underline underline-offset-4">USE CODE {settings.announcementCoupon} AT CHECKOUT</Link> • </>}
    {onSale && <><Link href="/store/main" className="underline">SALE IS LIVE — SEE CURRENT OFFERS</Link> • </>}
    {settings.marqueeText}
  </>;
}
