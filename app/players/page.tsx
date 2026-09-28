import { Suspense } from "react";
import type { Metadata } from "next";

import { EntryIndexBrowser } from "@/components/entry-index-browser";
import { PageHero } from "@/components/page-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlayers } from "@/lib/content";
import { buildFacet, labelMap, toIndexItem } from "@/lib/index-items";

export const metadata: Metadata = {
  title: "Players",
  description:
    "Organizations and public office-holders in the Iceland system map, each with the as-of date from the page that named them.",
};

export default function PlayersPage() {
  const players = getPlayers();
  const items = players.map((player) =>
    toIndexItem(player, { type: [player.playerType] }),
  );
  const typeFacet = buildFacet(
    "type",
    "Kind",
    "any",
    players.map((player) => player.playerType),
  );

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="Organizations, and people only where a public page names them in office. Each person carries the as-of date taken from that page. Filter, sort, and share the result — the controls live in the address bar."
        eyebrow={`${players.length} records · sourced`}
        title="Players"
      />
      <div className="mx-auto w-full max-w-shell px-4 pb-16 pt-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <EntryIndexBrowser
            defaultSort="title"
            facets={typeFacet ? [typeFacet] : []}
            groupBy="type"
            groupLabels={labelMap(players.map((player) => player.playerType))}
            items={items}
            noun="players"
            searchLabel="Find a player"
            sorts={["title", "date-desc", "connections"]}
          />
        </Suspense>
      </div>
    </main>
  );
}
