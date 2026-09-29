import Link from "next/link";

import { ProvenanceCard } from "@/components/provenance-card";
import { Badge } from "@/components/ui/badge";
import {
  CONTRADICTION_STATE,
  contradictionDateNote,
} from "@/lib/contradictions";
import type { Contradiction } from "@/lib/types";

export type ContradictionEntryLink = {
  slug: string;
  title: string;
  href: string;
};

export function contradictionAnchor(id: string): string {
  return `contradiction-${id}`;
}

/**
 * One contradiction as the first-class unit: the disagreement, both sourced
 * sentences in the citation gutter with their own as-of values, an explicit
 * unresolved state, and links into the entries the disagreement lands on.
 * Variorum facing-pages are a later slice; stacking is not a ruling.
 */
export function ContradictionCard({
  record,
  entries,
}: {
  record: Contradiction;
  entries: ContradictionEntryLink[];
}) {
  const anchor = contradictionAnchor(record.id);
  const [first, second] = record.sides;

  return (
    <article
      className="flex min-w-0 scroll-mt-24 flex-col gap-4 py-5"
      id={anchor}
    >
      <header className="flex min-w-0 max-w-reading flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge className="font-normal" variant="destructive">
            {CONTRADICTION_STATE.label}
          </Badge>
          <Link
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href={`#${anchor}`}
          >
            {record.id}
          </Link>
        </div>
        <p className="min-w-0 break-words text-base leading-7">{record.summary}</p>
        <p className="text-sm leading-6 text-muted-foreground">
          {contradictionDateNote(record)} {CONTRADICTION_STATE.explanation}
        </p>
      </header>

      <div className="flex min-w-0 flex-col gap-3">
        {[first, second].map((side, index) => (
          <ProvenanceCard
            asOf={side.asOf}
            as="div"
            key={`${side.source}-${side.quotation.slice(0, 24)}`}
            quotation={side.quotation}
            source={side.source}
            title={
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Side {index + 1}
              </span>
            }
          />
        ))}
      </div>

      {entries.length > 0 ? (
        <footer className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {entries.length === 1 ? "Lands on" : "Lands on"}
          </span>
          {entries.map((entry) => (
            <Link
              className="underline underline-offset-4"
              href={entry.href}
              key={entry.slug}
            >
              {entry.title}
            </Link>
          ))}
        </footer>
      ) : null}
    </article>
  );
}
