"use client";
import { useEffect } from "react";
import { useCartStore } from "@/store/cart";
export default function CartHydration() {
  useEffect(() => {
    void Promise.resolve(useCartStore.persist.rehydrate()).finally(() => useCartStore.getState().hydrate());
  }, []);
  return null;
}

