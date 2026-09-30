import Link from "next/link";

import { edgeKey } from "@/components/connection-graph";
import { AsOfFilterBar } from "@/components/provenance-as-of-filter";
import { ProvenanceCard } from "@/components/provenance-card";
import { ProvenanceEdgeCard } from "@/components/provenance-edge";
import {
  ContradictionCard,
  contradictionAnchor,
} from "@/components/provenance-contradiction";
import { Badge } from "@/components/ui/badge";
import {
  filterByAsOf,
  matchesAsOfFilter,
  type AsOfFilter,
} from "@/lib/as-of-filter";
import {
  contradictionAsOfValues,
  matchesContradiction,
  sortContradictions,
} from "@/lib/contradictions";
import {
  EVIDENCE_FACETS,
  EVIDENCE_PARAM,
  evidenceFacetActive,
  type EvidenceFacet,
} from "@/lib/evidence";
import { formatDate } from "@/lib/format";
import type {
  AuditFinding,
  ChangeRecord,
  Contradiction,
  Edge,
  Entry,
} from "@/lib/types";

const BASE_PATH = "/anomalies";

type EvidenceRoomProps = {
  contradictions: Contradiction[];
  changes: ChangeRecord[];
  audits: AuditFinding[];
  repeats: Edge[][];
  catalogBySlug: Map<string, Entry>;
  hrefForEntry: (entry: Entry) => string;
  facet: EvidenceFacet;
  asOfFilter: AsOfFilter;
  /** Serialized `?asOf=` value, preserved on the facet chips. */
  asOfParam: string;
};

function SectionShell({
  anchor,
  children,
  count,
  lede,
  title,
}: {
  anchor: string;
  children: React.ReactNode;
  count: number;
  lede: React.ReactNode;
  title: string;
}) {
  return (
    <section className="flex min-w-0 scroll-mt-24 flex-col gap-4" id={anchor}>
      <div className="flex max-w-reading flex-col gap-2">
        <h2 className="flex flex-wrap items-baseline gap-2 text-xl font-medium">
          {title}
          <span className="text-sm tabular-nums text-muted-foreground">
            {count}
          </span>
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">{lede}</p>
      </div>
      {children}
    </section>
  );
}

function NothingInScope({ what }: { what: string }) {
  return (
    <p className="folio-note text-sm leading-6 text-muted-foreground">
      No {what} match the current as-of filter. Clear it above to see the whole
      list.
    </p>
  );
}

export function EvidenceRoom({
  contradictions,
  changes,
  audits,
  repeats,
  catalogBySlug,
  hrefForEntry,
  facet,
  asOfFilter,
  asOfParam,
}: EvidenceRoomProps) {
  const showContradictions = evidenceFacetActive("contradictions", facet);
  const showChanges = evidenceFacetActive("changes", facet);
  const showAudits = evidenceFacetActive("audits", facet);
  const showRepeated = evidenceFacetActive("repeated", facet);

  const sortedContradictions = sortContradictions(contradictions);
  const visibleContradictions = sortedContradictions.filter((record) =>
    matchesContradiction(record, asOfFilter),
  );
  const visibleChanges = filterByAsOf(changes, (row) => row.observed, asOfFilter);
  const visibleAudits = filterByAsOf(audits, (row) => row.published, asOfFilter);
  const visibleRepeats = repeats.filter((group) =>
    group.some((edge) => matchesAsOfFilter(edge.asOf, asOfFilter)),
  );

  const scopedAsOfValues = [
    ...(showContradictions
      ? sortedContradictions.flatMap(contradictionAsOfValues)
      : []),
    ...(showChanges ? changes.map((row) => row.observed) : []),
    ...(showAudits ? audits.map((row) => row.published) : []),
    ...(showRepeated ? repeats.flatMap((group) => group.map((e) => e.asOf)) : []),
  ];

  const counts = {
    contradictions: contradictions.length,
    changes: changes.length,
    audits: audits.length,
    repeated: repeats.length,
  };

  const facetHref = (id: EvidenceFacet, anchor: string) => {
    const search = new URLSearchParams();
    if (id !== "all") search.set(EVIDENCE_PARAM, id);
    if (asOfParam) search.set("asOf", asOfParam);
    const query = search.toString();
    return `${BASE_PATH}${query ? `?${query}` : ""}#${anchor}`;
  };

  return (
    <div className="flex min-w-0 flex-col gap-8" id="evidence">
      <nav
        aria-label="Filter evidence by type"
        className="type-rail flex min-w-0 flex-col gap-3"
      >
        <div className="type-chip-row flex min-w-0 flex-wrap gap-2">
          {EVIDENCE_FACETS.map((item) => (
            <Link
              aria-current={facet === item.id ? "true" : undefined}
              className={`type-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                facet === item.id
                  ? "border-primary/40 bg-secondary text-secondary-foreground"
                  : "border-border/70 text-muted-foreground hover:border-primary/25 hover:text-foreground"
              }`}
              href={facetHref(item.id, item.anchor)}
              key={item.id}
            >
              {item.label}
              {item.id !== "all" ? (
                <span className="tabular-nums">
                  {counts[item.id as keyof typeof counts]}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </nav>

      {scopedAsOfValues.length > 0 ? (
        <div data-print-hide="">
          <AsOfFilterBar
            basePath={BASE_PATH}
            filter={asOfFilter}
            params={facet === "all" ? {} : { [EVIDENCE_PARAM]: facet }}
            unit="stored dates"
            values={scopedAsOfValues}
          />
        </div>
      ) : null}

      {showContradictions ? (
        <SectionShell
          anchor="contradictions"
          count={visibleContradictions.length}
          lede={
            <>
              A contradiction is the unit here: two sourced sentences about the
              same records that cannot both be the whole story. Each pair is a
              facing variorum — verso and recto in the citation gutter grammar,
              a hairline spine, each side’s own as-of value, and the records
              the disagreement lands on. None of them is resolved, and none is
              averaged away.
            </>
          }
          title="Contradictions"
        >
          {contradictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">None on file.</p>
          ) : visibleContradictions.length === 0 ? (
            <NothingInScope what="contradictions" />
          ) : (
            <>
              <ul className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {visibleContradictions.map((record) => (
                  <li key={record.id}>
                    <Link
                      className="underline underline-offset-4 hover:text-foreground"
                      href={`#${contradictionAnchor(record.id)}`}
                    >
                      {record.id}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="variorum-list flex min-w-0 flex-col divide-y divide-border/60">
                {visibleContradictions.map((record) => (
                  <li className="min-w-0" key={record.id}>
                    <ContradictionCard
                      entries={record.entries.flatMap((slug) => {
                        const entry = catalogBySlug.get(slug);
                        return entry
                          ? [
                              {
                                slug,
                                title: entry.title,
                                href: hrefForEntry(entry),
                              },
                            ]
                          : [];
                      })}
                      record={record}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionShell>
      ) : null}

      {showChanges ? (
        <SectionShell
          anchor="changes"
          count={visibleChanges.length}
          lede="A stored edge field that differs from a later reading. Rewrites are not applied silently; where both readings matter the row stays a contradiction instead."
          title="Field changes"
        >
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">None on file.</p>
          ) : visibleChanges.length === 0 ? (
            <NothingInScope what="changes" />
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {visibleChanges.map((change) => (
                <ProvenanceCard
                  as="li"
                  asOf={change.observed}
                  key={change.id}
                  quotation={`${change.oldValue} → ${change.newValue}`}
                  source={change.source}
                  title={
                    <>
                      {change.edgeId}{" "}
                      <span className="text-muted-foreground">
                        · {change.field}
                      </span>
                    </>
                  }
                  note={`Observed ${formatDate(change.observed)}. The stored value was replaced only because the page now prints the second reading.`}
                />
              ))}
            </ul>
          )}
        </SectionShell>
      ) : null}

      {showRepeated ? (
        <SectionShell
          anchor="repeated-payments"
          count={visibleRepeats.length}
          lede="The same buyer and the same vendor appear on more than one invoice in the same month, among the invoices stored here. Both invoices are listed. They are not added up. Repetition is not a finding."
          title="Repeated payments"
        >
          {repeats.length === 0 ? (
            <p className="text-sm text-muted-foreground">None in this sample.</p>
          ) : visibleRepeats.length === 0 ? (
            <NothingInScope what="invoice pairs" />
          ) : (
            <ul className="flex min-w-0 flex-col gap-4">
              {visibleRepeats.map((group) => {
                const first = group[0];
                const month = /^\d{4}-\d{2}/.test(first.asOf)
                  ? first.asOf.slice(0, 7)
                  : first.asOf;
                const rows = filterByAsOf(group, (edge) => edge.asOf, asOfFilter);
                return (
                  <li className="folio-pair flex min-w-0 flex-col gap-3" key={`${first.from}-${first.to}-${month}`}>
                    <p className="flex min-w-0 flex-wrap items-baseline gap-2 break-words font-medium">
                      {first.fromTitle} pays {first.toTitle}
                      <Badge className="font-normal" variant="outline">
                        {formatDate(month)}
                      </Badge>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {group.length} invoices
                      </span>
                    </p>
                    <ul className="flex min-w-0 flex-col gap-3">
                      {rows.map((edge) => (
                        <ProvenanceEdgeCard
                          edge={edge}
                          key={edgeKey(edge)}
                          showProgramQuotation
                          showRelationship={false}
                        />
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionShell>
      ) : null}

      {showAudits ? (
        <SectionShell
          anchor="audits"
          count={visibleAudits.length}
          lede="Ríkisendurskoðun pages that opened and name a record already on the map. The 16 September 2026 follow-up on Samkeppniseftirlitið names the authority and does not print the result, so it is not listed."
          title="Audit sentences"
        >
          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">None on file.</p>
          ) : visibleAudits.length === 0 ? (
            <NothingInScope what="audit sentences" />
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {visibleAudits.map((finding) => (
                <ProvenanceCard
                  as="li"
                  asOf={finding.published}
                  key={finding.id}
                  quotation={finding.quotation}
                  source={finding.source}
                  title={
                    <span className="flex flex-wrap gap-x-3 gap-y-1">
                      {finding.entries.map((slug) => {
                        const entry = catalogBySlug.get(slug);
                        return entry ? (
                          <Link
                            className="underline underline-offset-4"
                            href={hrefForEntry(entry)}
                            key={slug}
                          >
                            {entry.title}
                          </Link>
                        ) : (
                          <span key={slug}>{slug}</span>
                        );
                      })}
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </SectionShell>
      ) : null}
    </div>
  );
}
