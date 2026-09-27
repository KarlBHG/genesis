import type { Metadata } from "next";
import Link from "next/link";

import { edgeKey } from "@/components/connection-graph";
import { getAudits, getCatalog, getContradictions, getEdges, hrefFor } from "@/lib/content";
import { formatDate } from "@/lib/format";
import type { Edge } from "@/lib/types";

export const metadata: Metadata = {
  title: "Anomalies",
  description: "Contradictions, repeated invoices, and audit sentences already in the public record.",
};

function monthKey(asOf: string): string | null {
  return /^\d{4}-\d{2}/.test(asOf) ? asOf.slice(0, 7) : null;
}

export default function AnomaliesPage() {
  const contradictions = getContradictions();
  const audits = getAudits();
  const catalog = getCatalog();
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const groups = new Map<string, Edge[]>();
  for (const edge of getEdges()) {
    if (edge.relationship !== "pays") continue;
    const month = monthKey(edge.asOf);
    if (!month) continue;
    const key = `${edge.from}|${edge.to}|${month}`;
    const list = groups.get(key) ?? [];
    list.push(edge);
    groups.set(key, list);
  }
  const repeats = [...groups.values()]
    .filter((list) => list.length > 1)
    .map((list) => list.slice().sort((a, b) => a.asOf.localeCompare(b.asOf) || a.quotation.localeCompare(b.quotation)))
    .sort((a, b) => a[0].fromTitle.localeCompare(b[0].fromTitle, "en") || a[0].toTitle.localeCompare(b[0].toTitle, "en") || a[0].asOf.localeCompare(b[0].asOf));

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Anomalies</h1>
        <p className="text-muted-foreground">
          Public records that disagree, repeat, or come from Ríkisendurskoðun. Nothing here is an influence score. A row is not called waste or fraud unless the source page uses that word. These sources do not.
        </p>
      </header>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Contradictions</h2>
        <p className="text-sm text-muted-foreground">
          The same records as <Link className="underline underline-offset-4" href="/contradictions">Contradictions</Link>. Both sentences stay.
        </p>
        <ul className="flex min-w-0 flex-col gap-3">
          {contradictions.map((record) => (
            <li className="min-w-0 rounded-lg border p-4" key={record.id}>
              <p className="break-words">{record.summary}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {record.sides.map((side) => (
                  <li className="break-words text-sm leading-6" key={side.quotation}>
                    {side.quotation}{" "}
                    <a className="break-all underline underline-offset-4" href={side.source} rel="noreferrer" target="_blank">
                      {side.source}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3" id="repeated-payments">
        <h2 className="text-xl font-medium">Repeated payments · {repeats.length}</h2>
        <p className="text-sm text-muted-foreground">
          The same buyer and the same vendor appear on more than one invoice in the same month, among the invoices stored here. Both invoices are listed. They are not added up. Repetition is not a finding.
        </p>
        <ul className="flex min-w-0 flex-col gap-4">
          {repeats.map((list) => {
            const first = list[0];
            const month = monthKey(first.asOf) ?? first.asOf;
            return (
              <li className="min-w-0 rounded-lg border p-4" key={`${first.from}-${first.to}-${month}`}>
                <p className="break-words font-medium">
                  {first.fromTitle} pays {first.toTitle} · {formatDate(month)} · {list.length} invoices
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {list.map((edge) => (
                    <li className="break-words text-sm leading-6" key={edgeKey(edge)}>
                      {formatDate(edge.asOf)}. {edge.quotation}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Audit sentences</h2>
        <p className="text-sm text-muted-foreground">
          Ríkisendurskoðun pages that opened and name an entry already on the map. The 16 September 2026 follow-up on Samkeppniseftirlitið names the authority and does not print the result, so it is not listed.
        </p>
        <ul className="flex min-w-0 flex-col gap-3">
          {audits.map((finding) => (
            <li className="min-w-0 rounded-lg border p-4" key={finding.id}>
              <p className="break-words text-sm text-muted-foreground">{formatDate(finding.published)}</p>
              <p className="mt-1 break-words">
                {finding.entries.map((slug) => {
                  const entry = bySlug.get(slug);
                  return entry ? (
                    <Link className="mr-2 underline underline-offset-4" href={hrefFor(entry)} key={slug}>
                      {entry.title}
                    </Link>
                  ) : (
                    slug
                  );
                })}
              </p>
              <p className="mt-2 break-words text-sm leading-6">{finding.quotation}</p>
              <a className="mt-1 block break-all text-sm underline underline-offset-4" href={finding.source} rel="noreferrer" target="_blank">
                {finding.source}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
