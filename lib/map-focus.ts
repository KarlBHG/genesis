import { MAP_ENTRIES } from "@/lib/geo-map";

export function mapFocusHref(slug: string): string | null {
  if (!MAP_ENTRIES.some((entry) => entry.slug === slug)) return null;
  return `/map?focus=${encodeURIComponent(slug)}`;
}
