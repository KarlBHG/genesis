import type { Entry, Kind } from "@/lib/types";

const KIND_LABELS: Record<Kind, string> = {
  treaty: "Treaties",
  institution: "Institutions",
  event: "Events",
  sector: "Business",
  flow: "Money",
  player: "Players",
};

const KIND_SWATCH: Record<Kind, string> = {
  treaty: "oklch(0.62 0.08 255)",
  institution: "oklch(0.55 0.06 255)",
  event: "oklch(0.72 0.06 85)",
  sector: "oklch(0.65 0.09 155)",
  flow: "oklch(0.7 0.1 45)",
  player: "oklch(0.68 0.05 320)",
};

export type CatalogSlice = {
  kind: Kind;
  label: string;
  count: number;
  swatch: string;
};

export function catalogSlices(entries: Entry[]): CatalogSlice[] {
  const counts = new Map<Kind, number>();
  for (const entry of entries) {
    counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
  }
  return (Object.keys(KIND_LABELS) as Kind[]).map((kind) => ({
    kind,
    label: KIND_LABELS[kind],
    count: counts.get(kind) ?? 0,
    swatch: KIND_SWATCH[kind],
  }));
}

export function catalogTotal(entries: Entry[]): number {
  return entries.length;
}
