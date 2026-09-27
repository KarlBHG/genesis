import type { Metadata } from "next";

import { IcelandMap, type MapEdgeView, type MapEntryView } from "@/components/iceland-map";
import { getCatalog, getContradictions, getEdges, hrefFor } from "@/lib/content";
import { MAP_ENTRIES, viewOf, type PlaceId } from "@/lib/geo-map";
import { ownsRowNote, tradeValueNote } from "@/lib/notes";

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
  const catalog = getCatalog();
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const placeBySlug = new Map(MAP_ENTRIES.map((item) => [item.slug, item.place]));

  const entries: MapEntryView[] = MAP_ENTRIES.map((item) => {
    const entry = bySlug.get(item.slug);
    if (!entry) {
      throw new Error(`Map entry ${item.slug} is not in the catalog`);
    }
    const flows = entry.related.flatMap((slug) => {
      const related = bySlug.get(slug);
      if (!related || related.kind !== "flow") return [];
      return [{ title: related.title, href: hrefFor(related) }];
    });
    return {
      slug: entry.slug,
      title: entry.title,
      href: hrefFor(entry),
      fact: factFor(entry.slug, entry.summary),
      layer: item.layer,
      place: item.place,
      person: entry.kind === "player" && entry.playerType === "person",
      flows,
    };
  });

  const contradictions = getContradictions();
  const edges: MapEdgeView[] = getEdges().map((edge) => ({
    from: edge.from,
    to: edge.to,
    fromTitle: edge.fromTitle,
    toTitle: edge.toTitle,
    relationship: edge.relationship,
    asOf: edge.asOf,
    quotation: edge.quotation,
    start: edge.start,
    end: edge.end,
    channel: edge.channel,
    organizationTitle: edge.organizationTitle,
    note: [tradeValueNote(edge.relationship), ownsRowNote(edge, contradictions)].filter(Boolean).join(" ") || null,
    view: viewOf(edge.relationship),
    fromPlace: (placeBySlug.get(edge.from) ?? null) as PlaceId | null,
    toPlace: (placeBySlug.get(edge.to) ?? null) as PlaceId | null,
  }));

  return (
    <main className="min-h-full bg-[#0e100c]">
      <IcelandMap entries={entries} edges={edges} />
    </main>
  );
}
