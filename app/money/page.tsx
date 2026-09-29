import type { Metadata } from "next";
import Link from "next/link";

import { BudgetProgramsSection } from "@/components/budget-programs-section";
import { EntryIndex } from "@/components/entry-index";
import { FiscalPhasesNav } from "@/components/fiscal-phases";
import { HashScroll } from "@/components/hash-scroll";
import { PageHero } from "@/components/page-hero";
import { getEdges, getOtherFlows, getPolicyAreas, hrefFor, resolveSlug } from "@/lib/content";
import { partitionOtherFlows } from "@/lib/fiscal-phases";

export const metadata: Metadata = {
  title: "Budget & money",
  description:
    "2026 policy areas, Article 4 authorisations, Opnir reikningar invoices, contracts and trade, pensions, and Treasury totals — kept as separate fiscal phases.",
};

export default function MoneyPage() {
  const areas = getPolicyAreas();
  const { contracts, other } = partitionOtherFlows(getOtherFlows());
  const pays = getEdges().filter((edge) => edge.relationship === "pays");
  const buyers = [...new Set(pays.map((edge) => edge.from))]
    .map((slug) => resolveSlug(slug))
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => a.title.localeCompare(b.title, "en"));
  const otherItems = other.map((flow) => ({
    title: flow.title,
    href: hrefFor(flow),
    summary: flow.summary,
    meta: flow.year,
  }));
  const contractItems = contracts.map((flow) => ({
    title: flow.title,
    href: hrefFor(flow),
    summary: flow.summary,
    meta: flow.year,
  }));

  return (
    <main className="dashboard-canvas min-w-0">
      <HashScroll />
      <PageHero
        description={`Authorisations, invoices, and contracts are different fiscal phases. Trade, pensions, and Treasury totals sit with the other published aggregates. The ${areas.length} ministry policy areas and Article 4 rows are on this page too. Published figures only; each entry names the year on the source.`}
        eyebrow="Budget · flows · 2026"
        title="Budget & money"
      />
      <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-4 py-10 sm:px-6">
        <FiscalPhasesNav />

        <section className="flex min-w-0 scroll-mt-24 flex-col gap-4" id="authorisations">
          <BudgetProgramsSection />
        </section>

        <section className="flex min-w-0 scroll-mt-24 flex-col gap-4" id="invoices">
          <div className="glass-panel flex max-w-reading flex-col gap-3 p-6">
            <h2 className="font-serif text-xl font-medium">Invoices</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {pays.length} stored Opnir reikningar {pays.length === 1 ? "row" : "rows"}.
              Each line is one payment a named buyer made to a named vendor on a named
              day. Salaries, foreign-currency payments, and grants are not on that
              ledger. Amounts are not added together, and the stored sample is a
              sample — not the year.
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {buyers.length > 0 ? (
                <>
                  Buyers on file:{" "}
                  {buyers.map((buyer, index) => (
                    <span key={buyer.href}>
                      {index > 0 ? ", " : null}
                      <Link className="underline underline-offset-4" href={buyer.href}>
                        {buyer.title}
                      </Link>
                    </span>
                  ))}
                  .{" "}
                </>
              ) : null}
              The typed lines are under{" "}
              <Link className="underline underline-offset-4" href="/connections#spending">
                Connections · Invoices
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="flex min-w-0 scroll-mt-24 flex-col gap-4" id="contracts">
          <div className="flex min-w-0 flex-col gap-3">
            <h2 className="text-xl font-medium tracking-tight">Contracts and commodity lines</h2>
            <p className="max-w-reading text-sm leading-6 text-muted-foreground">
              Power-purchase agreements and Hagstofa import/export commodity rows.
              These are not invoices and not Article 4 ceilings. Typed lines are under{" "}
              <Link className="underline underline-offset-4" href="/connections#contracts">
                Connections · Contracts
              </Link>
              .
            </p>
          </div>
          {contractItems.length === 0 ? (
            <p className="text-muted-foreground">No contract or commodity flows are on file.</p>
          ) : (
            <EntryIndex items={contractItems} />
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-medium tracking-tight">Other money flows</h2>
          <p className="max-w-reading text-sm leading-6 text-muted-foreground">
            Treasury totals, pensions, and holdings that are not an authorisation,
            an invoice, or a contract line.
          </p>
          <EntryIndex items={otherItems} />
        </section>
      </div>
    </main>
  );
}
