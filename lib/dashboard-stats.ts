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
  treaty: "var(--kind-treaty)",
  institution: "var(--kind-institution)",
  event: "var(--kind-event)",
  sector: "var(--kind-sector)",
  flow: "var(--kind-flow)",
  player: "var(--kind-player)",
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
