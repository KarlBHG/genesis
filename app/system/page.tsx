import type { Metadata } from "next";
import Link from "next/link";

import { edgeKey } from "@/components/connection-graph";
import { ExternalLink } from "@/components/external-link";
import { PageHero } from "@/components/page-hero";
import { getBySlug, getChanges, getEdges, hrefFor } from "@/lib/content";
import { formatDate, labelize } from "@/lib/format";
import { tradeValueNote } from "@/lib/notes";
import { icelandicLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "System",
  description: "How the Icelandic state, the central bank, trade, and outside arrangements are recorded.",
};

const CHAIN = ["owns", "appoints", "elects", "incorporates", "imported-from", "exported-to"] as const;

export default function SystemPage() {
  const changes = getChanges();
  const republic = getBySlug("republic-of-iceland");
  const treasury = getBySlug("rikissjodur");
  const bank = getBySlug("sedlabanki");
  const imports = getBySlug("goods-imports-2024");
  const edges = getEdges().filter(
    (edge) =>
      (CHAIN as readonly string[]).includes(edge.relationship) &&
      (edge.to === "sedlabanki" ||
        edge.from === "goods-imports-2024" ||
        edge.from === "goods-exports-2024" ||
        edge.relationship === "incorporates"),
  );

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description={
          <>
            The records below are sentences from pages opened for this pass. A country named as a trade partner is not a company, and a legal form on the registry is not an influence score. The budget drawing is on{" "}
            <Link className="underline underline-offset-4" href="/overview">Overview</Link>. Public-entity coverage is tracked on{" "}
            <Link className="underline underline-offset-4" href="/public-entities">
              Public entities
            </Link>
            .
          </>
        }
        eyebrow="How to read"
        title="How the system operates"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-8 px-4 py-10 sm:px-6">

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">The state</h2>
        {republic ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(republic)}>
              {republic.title}
            </Link>
            . {republic.summary}
          </p>
        ) : null}
        {treasury ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(treasury)}>
              {treasury.title}
            </Link>
            . {treasury.summary}
          </p>
        ) : null}
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Central bank</h2>
        {bank ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(bank)}>
              {bank.title}
            </Link>
            . The lines below are the ownership, appointment, and election sentences from the consolidated act. The act does not print Ásgeir Jónsson’s appointment date.
          </p>
        ) : null}
        <ul className="flex min-w-0 flex-col gap-3">
          {edges
            .filter((edge) => edge.to === "sedlabanki")
            .map((edge) => (
              <li className="min-w-0 rounded-lg border p-4" key={edgeKey(edge)}>
                <p className="break-words font-medium">
                  {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {edge.toTitle}
                </p>
                <p className="mt-1 break-words text-sm leading-6" lang={icelandicLang(edge.quotation)}>
                  {edge.quotation}
                </p>
              </li>
            ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Outside arrangements</h2>
        <p className="break-words">
          The EEA page says the agreement extends the EU single market to Iceland, and that new EEA-relevant EU legislation is incorporated by the EEA Joint Committee. That is not a statement that the European Union governs Icelandic territory. Schengen is a separate association agreement. NATO’s history says Iceland has no military forces of its own, signed a bilateral defence agreement with the United States in 1951, and hosted a permanent US defence force at Keflavík until 2006. The same page says Iceland now operates the NATO radar there and provides host-nation support.
        </p>
        <ul className="flex min-w-0 flex-col gap-3">
          {edges
            .filter((edge) => edge.relationship === "incorporates")
            .map((edge) => (
              <li className="min-w-0 rounded-lg border p-4" key={edgeKey(edge)}>
                <p className="break-words font-medium">
                  {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {edge.toTitle}
                </p>
                <p className="mt-1 break-words text-sm leading-6" lang={icelandicLang(edge.quotation)}>
                  {edge.quotation}
                </p>
              </li>
            ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Goods, and from where</h2>
        {imports ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(imports)}>
              {imports.title}
            </Link>
            . {imports.summary}
          </p>
        ) : null}
        <ul className="flex min-w-0 flex-col gap-2">
          {edges
            .filter((edge) => edge.relationship === "imported-from" || edge.relationship === "exported-to")
            .map((edge) => (
              <li className="min-w-0 break-words text-sm leading-6" key={edgeKey(edge)}>
                {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {edge.toTitle}
                {tradeValueNote(edge.relationship) ? (
                  <span className="mt-0.5 block text-muted-foreground">{tradeValueNote(edge.relationship)}</span>
                ) : null}
              </li>
            ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Budget programs</h2>
        <p className="break-words">
          The 2026 ministry reports cover 35 policy areas and 105 subcategories. What each report says the area does, the spending change it prints, and the Article 4 authorisation rows are on{" "}
          <Link className="underline underline-offset-4" href="/money#government-programs">
            Budget
          </Link>
          . The rows are listed and not added together.
        </p>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Change log</h2>
        <p className="text-muted-foreground">
          A record is appended when an edge field that was stored before differs from a later reading. This pass did not rewrite an invoice date or a career date. The Landsbankinn shareholder count is the disagreement already kept as a contradiction. The owns line was not rewritten.
        </p>
        <ul className="flex min-w-0 flex-col gap-3">
          {changes.map((change) => (
            <li className="min-w-0 rounded-lg border p-4" key={change.id}>
              <p className="break-words font-medium">
                {change.edgeId} · {change.field}
              </p>
              <p className="mt-1 break-words text-sm leading-6">
                {change.oldValue} → {change.newValue}. Observed {formatDate(change.observed)}.
              </p>
              <ExternalLink className="mt-1 block break-all text-sm underline underline-offset-4" href={change.source}>
                {change.source}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </main>
  );
}
