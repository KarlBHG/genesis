import type { Metadata } from "next";

import { BudgetProgramsSection } from "@/components/budget-programs-section";
import { EntryIndex } from "@/components/entry-index";
import { HashScroll } from "@/components/hash-scroll";
import { PageHero } from "@/components/page-hero";
import { getOtherFlows, getPolicyAreas, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Budget & money",
  description:
    "2026 policy areas, Article 4 authorisations, trade, pensions, power sales, and Treasury totals.",
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
      <HashScroll />
      <PageHero
        description={`Trade, pensions, power sales, and Treasury totals sit below. The ${areas.length} ministry policy areas and Article 4 rows are on this page too. Published aggregates only; each entry names the year on the source.`}
        eyebrow="Budget · flows · 2026"
        title="Budget & money"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
        <BudgetProgramsSection />
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-medium tracking-tight">Other money flows</h2>
          <EntryIndex items={items} />
        </section>
      </div>
    </main>
  );
}
