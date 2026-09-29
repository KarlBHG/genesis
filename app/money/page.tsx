import type { Metadata } from "next";
import Link from "next/link";

import { BudgetProgramsSection } from "@/components/budget-programs-section";
import { EntryIndex } from "@/components/entry-index";
import { FiscalPhasesNav } from "@/components/fiscal-phases";
import { HashScroll } from "@/components/hash-scroll";
import { InvoiceCoverageLedgerTable } from "@/components/invoice-coverage-ledger";
import { MoneyRoomTabs } from "@/components/money-room-tabs";
import { PageHero } from "@/components/page-hero";
import { PrintedHeadingIdentityTable } from "@/components/printed-heading-identities";
import {
  getCatalog,
  getEdges,
  getOffices,
  getOtherFlows,
  getPolicyAreas,
  hrefFor,
  resolveSlug,
} from "@/lib/content";
import { partitionOtherFlows } from "@/lib/fiscal-phases";
import { PRINTED_HEADING_IDENTITIES } from "@/lib/identities";
import { buildInvoiceCoverageLedger } from "@/lib/invoice-coverage";

export const metadata: Metadata = {
  title: "Budget & money",
  description:
    "2026 policy areas, Article 4 authorisations, Opnir reikningar invoices, contracts and trade, pensions, and Treasury totals — kept as separate fiscal phases.",
};

export default function MoneyPage() {
  const areas = getPolicyAreas();
  const { contracts, other } = partitionOtherFlows(getOtherFlows());
  const edges = getEdges();
  const pays = edges.filter((edge) => edge.relationship === "pays");
  const coverage = buildInvoiceCoverageLedger(edges);
  const identities = PRINTED_HEADING_IDENTITIES;
  const identityNames = [
    ...getCatalog().map((entry) => ({ id: entry.slug, title: entry.title })),
    ...getOffices().map((office) => ({ id: office.id, title: office.title })),
  ];
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
        aside={
          <dl className="hero-stat-rail">
            <div>
              <dt>Policy areas</dt>
              <dd>{areas.length}</dd>
            </div>
            <div>
              <dt>Invoice rows</dt>
              <dd>{pays.length}</dd>
            </div>
            <div>
              <dt>Buyers on file</dt>
              <dd>{buyers.length}</dd>
            </div>
          </dl>
        }
        description={`Authorisations, invoices, and contracts are different fiscal phases. Trade, pensions, and Treasury totals sit with the other published aggregates. The ${areas.length} ministry policy areas and Article 4 rows are on this page too. Published figures only; each entry names the year on the source.`}
        eyebrow="Budget · flows · 2026"
        folio="04"
        italic="and money."
        size="dramatic"
        title="Budget"
      />
      <div className="mx-auto flex w-full max-w-shell flex-col gap-14 px-4 py-12 sm:px-6 sm:py-16">
        <FiscalPhasesNav />

        <MoneyRoomTabs
          authorisations={
            <section className="flex min-w-0 scroll-mt-24 flex-col gap-5" id="authorisations">
              <BudgetProgramsSection />
            </section>
          }
          contracts={
            <>
              <section className="flex min-w-0 scroll-mt-24 flex-col gap-5" id="contracts">
                <header className="reading-section-head">
                  <span className="section-index">03</span>
                  <h2 className="reading-head">Contracts and commodity lines</h2>
                </header>
                <p className="max-w-reading text-base leading-7 text-muted-foreground">
                  Power-purchase agreements and Hagstofa import/export commodity rows.
                  These are not invoices and not Article 4 ceilings. Typed lines are under{" "}
                  <Link className="underline underline-offset-4" href="/connections#contracts">
                    Connections · Contracts
                  </Link>
                  .
                </p>
                {contractItems.length === 0 ? (
                  <p className="text-muted-foreground">
                    No contract or commodity flows are on file.
                  </p>
                ) : (
                  <EntryIndex items={contractItems} />
                )}
              </section>
              <section className="flex min-w-0 flex-col gap-5">
                <header className="reading-section-head">
                  <span className="section-index">04</span>
                  <h2 className="reading-head">Other money flows</h2>
                </header>
                <p className="max-w-reading text-base leading-7 text-muted-foreground">
                  Treasury totals, pensions, and holdings that are not an authorisation,
                  an invoice, or a contract line.
                </p>
                <EntryIndex items={otherItems} />
              </section>
            </>
          }
          invoices={
            <section className="flex min-w-0 scroll-mt-24 flex-col gap-5" id="invoices">
              <header className="reading-section-head">
                <span className="section-index">02</span>
                <h2 className="reading-head">Invoices</h2>
              </header>
              <div className="glass-panel flex max-w-reading flex-col gap-3 p-6">
                <p className="text-base leading-7 text-muted-foreground">
                  {pays.length} stored Opnir reikningar {pays.length === 1 ? "row" : "rows"}{" "}
                  from {buyers.length} {buyers.length === 1 ? "buyer" : "buyers"}.
                  Each line is one payment a named buyer made to a named vendor on a named
                  day. Salaries, foreign-currency payments, and grants are not on that
                  ledger. Amounts are not added together, and the stored sample is a
                  sample — not the year.
                </p>
                <p className="text-base leading-7 text-muted-foreground">
                  Coverage of those rows — joined, explicit null, or unreviewed — is the
                  table below. Typed lines are also under{" "}
                  <Link className="underline underline-offset-4" href="/connections#spending">
                    Connections · Invoices
                  </Link>
                  .
                </p>
              </div>
              <InvoiceCoverageLedgerTable ledger={coverage} />
              <PrintedHeadingIdentityTable identities={identities} names={identityNames} />
            </section>
          }
        />
      </div>
    </main>
  );
}
