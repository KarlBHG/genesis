import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { EntryIndexBrowser } from "@/components/entry-index-browser";
import { PageHero } from "@/components/page-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { getTreaties } from "@/lib/content";
import { buildFacet, labelMap, toIndexItem } from "@/lib/index-items";

export const metadata: Metadata = {
  title: "Treaties",
  description:
    "Agreements Iceland is party to, with the signing date, status, and topics each text states.",
};

export default function TreatiesPage() {
  const treaties = getTreaties();
  const items = treaties.map((treaty) =>
    toIndexItem(treaty, {
      status: [treaty.status],
      topic: treaty.topics,
      type: [treaty.type],
    }),
  );
  const facets = [
    buildFacet("topic", "Topics", "all", treaties.flatMap((t) => t.topics)),
    buildFacet("type", "Instrument", "any", treaties.map((t) => t.type)),
    buildFacet("status", "Status", "any", treaties.map((t) => t.status)),
  ].filter((facet) => facet !== null);

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description={
          <>
            Agreements Iceland is party to. Topics are matched together, so two
            that never share a treaty return nothing. For security, EEA/EFTA,
            trade, and crisis commitments by theme, see{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/obligations"
            >
              Obligations
            </Link>
            .
          </>
        }
        eyebrow={`${treaties.length} records · sourced`}
        size="dramatic"
        title="Treaties"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <EntryIndexBrowser
            defaultSort="date"
            facets={facets}
            groupBy="status"
            groupLabels={labelMap(treaties.map((treaty) => treaty.status))}
            items={items}
            noun="treaties"
            searchLabel="Find a treaty"
            sorts={["title", "date", "date-desc", "connections"]}
          />
        </Suspense>
      </div>
    </main>
  );
}
