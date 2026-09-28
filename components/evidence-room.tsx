"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { edgeKey } from "@/components/connection-graph";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { AuditFinding, ChangeRecord, Contradiction, Edge, Entry } from "@/lib/types";
import { icelandicLang } from "@/lib/lang";

export type EvidenceFacet =
  | "all"
  | "contradictions"
  | "changes"
  | "audits"
  | "repeated";

const FACETS: { id: EvidenceFacet; label: string }[] = [
  { id: "all", label: "All" },
  { id: "contradictions", label: "Contradictions" },
  { id: "changes", label: "Changes" },
  { id: "audits", label: "Audits" },
  { id: "repeated", label: "Repeated invoices" },
];

type EvidenceRoomProps = {
  contradictions: Contradiction[];
  changes: ChangeRecord[];
  audits: AuditFinding[];
  repeats: Edge[][];
  catalogBySlug: Map<string, Entry>;
  hrefForEntry: (entry: Entry) => string;
};

function facetActive(facet: EvidenceFacet, selected: EvidenceFacet) {
  return selected === "all" || selected === facet;
}

export function EvidenceRoom({
  contradictions,
  changes,
  audits,
  repeats,
  catalogBySlug,
  hrefForEntry,
}: EvidenceRoomProps) {
  const [facet, setFacet] = useState<EvidenceFacet>("all");

  const counts = useMemo(
    () => ({
      contradictions: contradictions.length,
      changes: changes.length,
      audits: audits.length,
      repeated: repeats.length,
    }),
    [audits.length, changes.length, contradictions.length, repeats.length],
  );

  const showContradictions = facetActive("contradictions", facet);
  const showChanges = facetActive("changes", facet);
  const showAudits = facetActive("audits", facet);
  const showRepeated = facetActive("repeated", facet);

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div
        aria-label="Filter evidence by type"
        className="flex min-w-0 flex-wrap gap-2"
        role="group"
      >
        {FACETS.map((item) => (
          <Button
            aria-pressed={facet === item.id}
            key={item.id}
            onClick={() => setFacet(item.id)}
            size="sm"
            type="button"
            variant={facet === item.id ? "secondary" : "outline"}
          >
            {item.label}
            {item.id !== "all" ? (
              <span className="ml-1.5 text-muted-foreground tabular-nums">
                {counts[item.id as keyof typeof counts]}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      {showContradictions ? (
        <section className="flex min-w-0 flex-col gap-3" id="contradictions">
          <h2 className="text-xl font-medium">Contradictions</h2>
          <p className="text-sm text-muted-foreground">
            Two sourced sentences about the same entries, kept side by side. Both
            sentences stay.
          </p>
          {contradictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">None on file.</p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {contradictions.map((record) => (
                <li className="min-w-0 rounded-lg border p-4" key={record.id}>
                  <p className="break-words">{record.summary}</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {record.sides.map((side) => (
                      <li className="break-words text-sm leading-6" key={side.quotation}>
                        <span lang={icelandicLang(side.quotation)}>{side.quotation}</span>{" "}
                        <a
                          className="break-all underline underline-offset-4"
                          href={side.source}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {side.source}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showChanges ? (
        <section className="flex min-w-0 flex-col gap-3" id="changes">
          <h2 className="text-xl font-medium">Field changes</h2>
          <p className="text-sm text-muted-foreground">
            A stored edge field that differs from a later reading. Rewrites are not
            applied silently; contradictions stay visible when both readings matter.
          </p>
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">None on file.</p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {changes.map((change) => (
                <li className="min-w-0 rounded-lg border p-4" key={change.id}>
                  <p className="break-words font-medium">
                    {change.edgeId} · {change.field}
                  </p>
                  <p className="mt-1 break-words text-sm leading-6">
                    {change.oldValue} → {change.newValue}. Observed{" "}
                    {formatDate(change.observed)}.
                  </p>
                  <a
                    className="mt-1 block break-all text-sm underline underline-offset-4"
                    href={change.source}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {change.source}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showRepeated ? (
        <section className="flex min-w-0 flex-col gap-3" id="repeated-payments">
          <h2 className="text-xl font-medium">
            Repeated payments · {repeats.length}
          </h2>
          <p className="text-sm text-muted-foreground">
            The same buyer and the same vendor appear on more than one invoice in the
            same month, among the invoices stored here. Both invoices are listed. They
            are not added up. Repetition is not a finding.
          </p>
          {repeats.length === 0 ? (
            <p className="text-sm text-muted-foreground">None in this sample.</p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-4">
              {repeats.map((list) => {
                const first = list[0];
                const month = /^\d{4}-\d{2}/.test(first.asOf)
                  ? first.asOf.slice(0, 7)
                  : first.asOf;
                return (
                  <li
                    className="min-w-0 rounded-lg border p-4"
                    key={`${first.from}-${first.to}-${month}`}
                  >
                    <p className="break-words font-medium">
                      {first.fromTitle} pays {first.toTitle} · {formatDate(month)} ·{" "}
                      {list.length} invoices
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {list.map((edge) => (
                        <li className="break-words text-sm leading-6" key={edgeKey(edge)}>
                          {formatDate(edge.asOf)}.{" "}
                          <span lang={icelandicLang(edge.quotation)}>{edge.quotation}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {showAudits ? (
        <section className="flex min-w-0 flex-col gap-3" id="audits">
          <h2 className="text-xl font-medium">Audit sentences</h2>
          <p className="text-sm text-muted-foreground">
            Ríkisendurskoðun pages that opened and name an entry already on the map.
            The 16 September 2026 follow-up on Samkeppniseftirlitið names the authority
            and does not print the result, so it is not listed.
          </p>
          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">None on file.</p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {audits.map((finding) => (
                <li className="min-w-0 rounded-lg border p-4" key={finding.id}>
                  <p className="break-words text-sm text-muted-foreground">
                    {formatDate(finding.published)}
                  </p>
                  <p className="mt-1 break-words">
                    {finding.entries.map((slug) => {
                      const entry = catalogBySlug.get(slug);
                      return entry ? (
                        <Link
                          className="mr-2 underline underline-offset-4"
                          href={hrefForEntry(entry)}
                          key={slug}
                        >
                          {entry.title}
                        </Link>
                      ) : (
                        slug
                      );
                    })}
                  </p>
                  <p className="mt-2 break-words text-sm leading-6" lang={icelandicLang(finding.quotation)}>
                    {finding.quotation}
                  </p>
                  <a
                    className="mt-1 block break-all text-sm underline underline-offset-4"
                    href={finding.source}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {finding.source}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
