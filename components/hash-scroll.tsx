"use client";

import { useEffect } from "react";

import { scheduleScrollHashPastMasthead } from "@/lib/scroll-past-masthead";

/** Scroll to the location hash once on mount (e.g. after /programs → /money#government-programs). */
export function HashScroll() {
  useEffect(() => scheduleScrollHashPastMasthead(), []);
  return null;
}
