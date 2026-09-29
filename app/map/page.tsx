import type { Metadata } from "next";
import { Suspense } from "react";

import {
  IcelandMap,
  type MapEdgeView,
  type MapEntryView,
  type MapOffMapEndpointLink,
} from "@/components/iceland-map";
import { getCatalog, getContradictions, getEdges, getOffices, hrefFor } from "@/lib/content";
import { MAP_ENTRIES, MAP_VIEWS, viewOf, type PlaceId, type ViewId } from "@/lib/geo-map";
import { mapSlugHasTypedLinkage } from "@/lib/map-graph";
import { ownsRowNote, tradeValueNote } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Iceland at night, only where a sourced page names the place. One pin per town, not a door for each office.",
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
  const officeIds = new Set(offices.map((office) => office.id));
  const offMapByViewMaps = Object.fromEntries(
    MAP_VIEWS.map((view) => [view.id, new Map<string, number>()]),
  ) as Record<ViewId, Map<string, number>>;
  for (const edge of graphEdges) {
    const view = viewOf(edge.relationship);
    if (!view) continue;
    for (const slug of [edge.from, edge.to]) {
      if (mappedSlugs.has(slug) || officeIds.has(slug)) continue;
      const current = offMapByViewMaps[view].get(slug) ?? 0;
      offMapByViewMaps[view].set(slug, current + 1);
    }
  }
  const offMapByView = Object.fromEntries(
    MAP_VIEWS.map((view) => {
      const rows: MapOffMapEndpointLink[] = [...offMapByViewMaps[view.id].entries()]
        .map(([slug, count]) => {
          const entry = bySlug.get(slug);
          if (!entry) {
            throw new Error(`Off-map endpoint ${slug} is not in the catalog`);
          }
          return { slug, title: entry.title, href: hrefFor(entry), count };
        })
        .sort(
          (left, right) =>
            right.count - left.count ||
            left.title.localeCompare(right.title, "en"),
        );
      return [view.id, rows];
    }),
  ) as Record<ViewId, MapOffMapEndpointLink[]>;

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
    <main className="geo-room">
      <Suspense
        fallback={
          <p className="px-4 py-10 text-sm text-(--geo-ink-dim)">
            Drawing the island from sourced places.
          </p>
        }
      >
        <IcelandMap entries={entries} edges={edges} offMapByView={offMapByView} />
      </Suspense>
    </main>
  );
}
