"use client";

import { useEffect } from "react";

import { scrollHashPastMasthead } from "@/lib/scroll-past-masthead";

/** Scroll to the location hash once on mount (e.g. after /programs → /money#government-programs). */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    let attempts = 0;
    let frame = 0;
    function go() {
      if (scrollHashPastMasthead()) return;
      if (attempts++ < 30) frame = requestAnimationFrame(go);
    }
    frame = requestAnimationFrame(go);
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
