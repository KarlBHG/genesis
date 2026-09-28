import type { Metadata } from "next";
import Link from "next/link";

import { EntryIndex } from "@/components/entry-index";
import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { getOtherFlows, getPolicyAreas, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Money",
  description:
    "Trade, pensions, power sales, and Treasury totals. The 2026 budget policy areas live under Programs.",
};

export default function MoneyPage() {
  const areas = getPolicyAreas();
  const items = getOtherFlows().map((flow) => ({
    title: flow.title,
    href: hrefFor(flow),
    summary: flow.summary,
    meta: flow.year,
  }));

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="Trade, pensions, power sales, and Treasury totals. Published aggregates only. Each entry names the year on the source."
        eyebrow="Flows and aggregates"
        title="Money"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <Link
          className="glass-panel block rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          href="/programs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-medium">Government programs, 2026</h2>
            <Badge variant="outline">{areas.length} policy areas</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ministry reports, spending lines, and Article 4 authorisation rows.
            Rows are not added together.
          </p>
        </Link>
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-medium tracking-tight">Other money flows</h2>
          <EntryIndex items={items} />
        </section>
      </div>
    </main>
  );
}
