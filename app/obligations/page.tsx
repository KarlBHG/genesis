import type { Metadata } from "next";
import Link from "next/link";

import {
  ObligationsHeroAside,
  ObligationsIndex,
} from "@/components/obligations-index";
import { PageHero } from "@/components/page-hero";
import { AS_OF_PARAM, parseAsOfFilter } from "@/lib/as-of-filter";
import { getEdges, getTreaties } from "@/lib/content";
import { obligationEvidenceBySection } from "@/lib/obligation-evidence";

export const metadata: Metadata = {
  title: "Obligations and contributions",
  description:
    "Security, European integration, trade agreements, crisis-era financial commitments, and where the domestic budget records spending.",
};

export default async function ObligationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params[AS_OF_PARAM];
  const asOfFilter = parseAsOfFilter(Array.isArray(raw) ? raw[0] : raw);
  const treatyCount = getTreaties().length;
  const evidence = obligationEvidenceBySection(getEdges());

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        aside={<ObligationsHeroAside />}
        description={
          <>
            Iceland’s international commitments grouped by theme. Each line links
            to a map entry with primary-source quotations, and each theme opens
            the typed connections behind it. Open{" "}
            <Link className="text-foreground underline underline-offset-4" href="/treaties">
              Treaties
            </Link>{" "}
            for all {treatyCount} agreement records,{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/connections"
            >
              Connections
            </Link>{" "}
            to filter the evidence graph, or{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/methodology"
            >
              Methodology
            </Link>{" "}
            for the sourcing contract these lines are held to.
          </>
        }
        eyebrow="Foreign affairs · contributions"
        size="dramatic"
        title="Obligations and contributions"
      />
      <ObligationsIndex asOfFilter={asOfFilter} evidence={evidence} />
    </main>
  );
}
