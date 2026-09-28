import type { Metadata } from "next";
import Link from "next/link";

import {
  ObligationsHeroAside,
  ObligationsIndex,
} from "@/components/obligations-index";
import { PageHero } from "@/components/page-hero";
import { getTreaties } from "@/lib/content";

export const metadata: Metadata = {
  title: "Obligations and contributions",
  description:
    "Security, European integration, trade agreements, crisis-era financial commitments, and where the domestic budget records spending.",
};

export default function ObligationsPage() {
  const treatyCount = getTreaties().length;

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        aside={<ObligationsHeroAside />}
        description={
          <>
            Iceland’s international commitments grouped by theme. Each line links
            to a map entry with primary-source quotations. Open{" "}
            <Link className="text-foreground underline underline-offset-4" href="/treaties">
              Treaties
            </Link>{" "}
            for all {treatyCount} agreement records, or{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/connections"
            >
              Connections
            </Link>{" "}
            to filter the evidence graph.
          </>
        }
        eyebrow="Foreign affairs · contributions"
        size="dramatic"
        title="Obligations and contributions"
      />
      <ObligationsIndex />
    </main>
  );
}
