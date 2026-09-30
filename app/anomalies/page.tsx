import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceRoom } from "@/components/evidence-room";
import { PageHero } from "@/components/page-hero";
import { PrintPlateColophon, PrintPlateHead } from "@/components/print-plate";
import { compareAsOf } from "@/lib/as-of";
import {
  parseAsOfFilter,
  serializeAsOfFilter,
  AS_OF_PARAM,
} from "@/lib/as-of-filter";
import {
  getAudits,
  getCatalog,
  getChanges,
  getContradictions,
  getEdges,
  hrefFor,
} from "@/lib/content";
import { EVIDENCE_PARAM, parseEvidenceFacet } from "@/lib/evidence";
import type { Edge } from "@/lib/types";

export const metadata: Metadata = {
  title: "Evidence",
  description:
    "Contradictions kept unresolved, field changes, repeated invoices, and audit sentences already in the public record.",
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
            compareAsOf(a.asOf, b.asOf) ||
            a.quotation.localeCompare(b.quotation),
        ),
    )
    .sort(
      (a, b) =>
        a[0].fromTitle.localeCompare(b[0].fromTitle, "en") ||
        a[0].toTitle.localeCompare(b[0].toTitle, "en") ||
        compareAsOf(a[0].asOf, b[0].asOf),
    );
}

export default async function AnomaliesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (key: string): string | null => {
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };
  const facet = parseEvidenceFacet(first(EVIDENCE_PARAM));
  const asOfFilter = parseAsOfFilter(first(AS_OF_PARAM));

  const contradictions = getContradictions();
  const audits = getAudits();
  const changes = getChanges();
  const catalog = getCatalog();
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const repeats = buildRepeatedPayments();

  return (
    <main className="dashboard-canvas min-w-0">
      <PrintPlateHead
        asOf=""
        kind="Evidence"
        pathname="/anomalies"
        slug="anomalies"
      />
      <PageHero
        description={
          <>
            Public records that disagree, change, repeat, or come from
            Ríkisendurskoðun. Nothing here is an influence score. A row is not
            called waste or fraud unless the source page uses that word, and
            these sources do not. The sourcing contract these rows are held to is
            written out on{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/methodology"
            >
              Methodology
            </Link>
            .
          </>
        }
        eyebrow={`Evidence · ${contradictions.length} unresolved contradictions`}
        folio="10"
        title="Evidence"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-8 px-4 py-10 sm:px-6">
        <EvidenceRoom
          asOfFilter={asOfFilter}
          asOfParam={serializeAsOfFilter(asOfFilter)}
          audits={audits}
          catalogBySlug={bySlug}
          changes={changes}
          contradictions={contradictions}
          facet={facet}
          hrefForEntry={hrefFor}
          repeats={repeats}
        />
      </div>
      <PrintPlateColophon />
    </main>
  );
}
