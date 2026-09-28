import type { Metadata } from "next";

import { EvidenceRoom } from "@/components/evidence-room";
import {
  getAudits,
  getCatalog,
  getChanges,
  getContradictions,
  getEdges,
  hrefFor,
} from "@/lib/content";
import type { Edge } from "@/lib/types";

export const metadata: Metadata = {
  title: "Evidence",
  description:
    "Contradictions, field changes, repeated invoices, and audit sentences already in the public record.",
};

function monthKey(asOf: string): string | null {
  return /^\d{4}-\d{2}/.test(asOf) ? asOf.slice(0, 7) : null;
}

function buildRepeatedPayments(): Edge[][] {
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
  return [...groups.values()]
    .filter((list) => list.length > 1)
    .map((list) =>
      list
        .slice()
        .sort(
          (a, b) =>
            a.asOf.localeCompare(b.asOf) ||
            a.quotation.localeCompare(b.quotation),
        ),
    )
    .sort(
      (a, b) =>
        a[0].fromTitle.localeCompare(b[0].fromTitle, "en") ||
        a[0].toTitle.localeCompare(b[0].toTitle, "en") ||
        a[0].asOf.localeCompare(b[0].asOf),
    );
}

export default function AnomaliesPage() {
  const contradictions = getContradictions();
  const audits = getAudits();
  const changes = getChanges();
  const catalog = getCatalog();
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const repeats = buildRepeatedPayments();

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-reading flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Evidence</h1>
        <p className="text-muted-foreground">
          Public records that disagree, change, repeat, or come from Ríkisendurskoðun.
          Nothing here is an influence score. A row is not called waste or fraud unless
          the source page uses that word. These sources do not.
        </p>
      </header>

      <EvidenceRoom
        audits={audits}
        catalogBySlug={bySlug}
        changes={changes}
        contradictions={contradictions}
        hrefForEntry={hrefFor}
        repeats={repeats}
      />
    </main>
  );
}
