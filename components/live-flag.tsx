"use client";

import { useEffect, useRef } from "react";

/**
 * Marks a host as hydrated. Place after the controls in the same parent so
 * sibling client islands (Next.js Link) have already attached.
 */
export function LiveFlag({ of }: { of: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    host.setAttribute(`data-${of}-live`, "");
    return () => host.removeAttribute(`data-${of}-live`);
  }, [of]);
  return <span hidden ref={ref} />;
}
