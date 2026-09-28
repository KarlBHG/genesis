import { Suspense } from "react";
import type { Metadata } from "next";

import { EntryIndexBrowser } from "@/components/entry-index-browser";
import { PageHero } from "@/components/page-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { getInstitutions } from "@/lib/content";
import { buildFacet, labelMap, toIndexItem } from "@/lib/index-items";

export const metadata: Metadata = {
  title: "Institutions",
  description:
    "Public bodies in the Iceland system map, grouped by the role their own founding text gives them.",
};

export default function InstitutionsPage() {
  const institutions = getInstitutions();
  const items = institutions.map((institution) =>
    toIndexItem(institution, {
      role: [institution.role],
      type: [institution.type],
    }),
  );
  const facets = [
    buildFacet(
      "role",
      "Role",
      "any",
      institutions.map((institution) => institution.role),
    ),
    buildFacet(
      "type",
      "Record type",
      "any",
      institutions.map((institution) => institution.type),
    ),
  ].filter((facet) => facet !== null);

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="Public bodies, grouped by role. Seðlabanki Íslands keeps its name. Filters and sort order are written to the address bar, so a filtered view is a shareable link."
        eyebrow={`${institutions.length} records · sourced`}
        title="Institutions"
      />
      <div className="mx-auto w-full max-w-shell px-4 pb-16 pt-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <EntryIndexBrowser
            defaultSort="title"
            facets={facets}
            groupBy="role"
            groupLabels={labelMap(
              institutions.map((institution) => institution.role),
            )}
            items={items}
            noun="institutions"
            searchLabel="Find an institution"
            sorts={["title", "date", "date-desc", "connections"]}
          />
        </Suspense>
      </div>
    </main>
  );
}
