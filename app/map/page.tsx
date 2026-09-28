import type { Metadata } from "next";
import { Suspense } from "react";

import { IcelandMap, type MapEdgeView, type MapEntryView } from "@/components/iceland-map";
import { getCatalog, getContradictions, getEdges, getOffices, hrefFor } from "@/lib/content";
import { MAP_ENTRIES, viewOf, type PlaceId } from "@/lib/geo-map";
import { mapSlugHasTypedLinkage } from "@/lib/map-graph";
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
  const graphEdges = getEdges();
  const offices = getOffices();

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
    const pinOnly = !mapSlugHasTypedLinkage(entry.slug, graphEdges, offices);
    return {
      slug: entry.slug,
      title: entry.title,
      href: hrefFor(entry),
      fact: factFor(entry.slug, entry.summary),
      layer: item.layer,
      place: item.place,
      person: entry.kind === "player" && entry.playerType === "person",
      flows,
      pinOnly,
    };
  });

  const contradictions = getContradictions();
  const mappedSlugs = new Set(MAP_ENTRIES.map((item) => item.slug));
  const tradeRelationships = new Set(["imported-from", "exported-to", "tariff-terms"]);
  const tradePartnerSlugs = new Set<string>();
  for (const edge of graphEdges) {
    if (!tradeRelationships.has(edge.relationship)) continue;
    if (!mappedSlugs.has(edge.from)) tradePartnerSlugs.add(edge.from);
    if (!mappedSlugs.has(edge.to)) tradePartnerSlugs.add(edge.to);
  }
  const tradePartners = [...tradePartnerSlugs]
    .map((slug) => {
      const entry = bySlug.get(slug);
      if (!entry) {
        throw new Error(`Trade partner ${slug} is not in the catalog`);
      }
      return { slug, title: entry.title, href: hrefFor(entry) };
    })
    .sort((left, right) => left.title.localeCompare(right.title, "en"));

  const edges: MapEdgeView[] = graphEdges.map((edge) => ({
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
    <main className="geo-room min-h-full">
      <Suspense>
        <IcelandMap entries={entries} edges={edges} tradePartners={tradePartners} />
      </Suspense>
    </main>
  );
}
