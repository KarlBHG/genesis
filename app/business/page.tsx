import { Suspense } from "react";
import type { Metadata } from "next";

import { EntryIndexBrowser } from "@/components/entry-index-browser";
import { PageHero } from "@/components/page-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { getSectors } from "@/lib/content";
import { buildFacet, toIndexItem } from "@/lib/index-items";

export const metadata: Metadata = {
  title: "Business",
  description:
    "How the main sectors of the Icelandic economy are structured, with the year on every figure.",
};

export default function BusinessPage() {
  const sectors = getSectors();
  const items = sectors.map((sector) =>
    toIndexItem(sector, { area: [sector.area] }),
  );
  const areaFacet = buildFacet(
    "area",
    "Area",
    "any",
    sectors.map((sector) => sector.area),
  );

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="How the main sectors are structured. Figures are only those a cited release or report states, with the year on the figure. Sort by how densely a sector is wired into the graph to see where the evidence is thickest."
        eyebrow={`${sectors.length} sectors · sourced`}
        title="Business"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <EntryIndexBrowser
            defaultSort="title"
            facets={areaFacet ? [areaFacet] : []}
            items={items}
            noun="sectors"
            searchLabel="Find a sector"
            sorts={["title", "connections"]}
          />
        </Suspense>
      </div>
    </main>
  );
}
