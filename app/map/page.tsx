import type { Metadata } from "next";

import { IcelandMap, type MapEntryView } from "@/components/iceland-map";
import { MAP_ENTRIES } from "@/lib/geo-map";
import { getCatalog, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Map",
  description: "A test geographic map of sourced places in Iceland.",
};

function firstSentence(summary: string): string {
  const trimmed = summary.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^.+?[.!?](?:\s|$)/);
  return (match?.[0] ?? trimmed).trim();
}

function factFor(slug: string, summary: string): string {
  const first = firstSentence(summary);
  if (slug !== "landsvirkjun") return first;
  const address = summary
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => sentence.includes("Katrínartún"));
  return address ? `${first} ${address}` : first;
}

export default function MapPage() {
  const bySlug = new Map(getCatalog().map((entry) => [entry.slug, entry]));
  const entries: MapEntryView[] = MAP_ENTRIES.map((item) => {
    const entry = bySlug.get(item.slug);
    if (!entry) {
      throw new Error(`Map entry ${item.slug} is not in the catalog`);
    }
    return {
      slug: entry.slug,
      title: entry.title,
      href: hrefFor(entry),
      fact: factFor(entry.slug, entry.summary),
      layer: item.layer,
      place: item.place,
    };
  });

  return (
    <main className="min-h-full bg-[#0e100c]">
      <IcelandMap entries={entries} />
    </main>
  );
}
