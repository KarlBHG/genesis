"use client";

import { useEffect } from "react";

/** Scroll to the location hash once on mount (e.g. after /programs → /money#government-programs). */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace(/^#/, "");
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return null;
}
