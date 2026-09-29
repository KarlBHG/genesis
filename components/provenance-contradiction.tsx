import Link from "next/link";

import { CitationGutter } from "@/components/citation-gutter";
import { Badge } from "@/components/ui/badge";
import {
  CONTRADICTION_STATE,
  contradictionDateNote,
  variorumLeaves,
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
 * One contradiction as a facing variorum: verso and recto are the two stored
 * sentences, in file order, each typeset with the citation-gutter grammar.
 * Facing-pages start at `lg`. Before that the two stored sentences stack.
 * Layout only — both quotations stay as filed. Stacking is not a ruling.
 * Nothing here sorts, greys, or weights a later as-of into a winner.
 */
export function ContradictionCard({
  record,
  entries,
}: {
  record: Contradiction;
  entries: ContradictionEntryLink[];
}) {
  const anchor = contradictionAnchor(record.id);
  const [verso, recto] = variorumLeaves(record);

  return (
    <article
      className="variorum flex min-w-0 scroll-mt-24 flex-col gap-5 py-5"
      data-variorum=""
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
      </header>

      <div className="variorum-spread">
        <div className="variorum-spread-grid">
          <section
            aria-label="Verso"
            className="variorum-leaf"
            data-variorum-leaf="verso"
          >
            <CitationGutter
              asOf={verso.asOf}
              quotation={verso.quotation}
              source={verso.source}
            />
          </section>
          <div aria-hidden className="variorum-spine" data-variorum-spine="" />
          <section
            aria-label="Recto"
            className="variorum-leaf"
            data-variorum-leaf="recto"
          >
            <CitationGutter
              asOf={recto.asOf}
              quotation={recto.quotation}
              source={recto.source}
            />
          </section>
        </div>
      </div>

      <p className="variorum-ruling max-w-reading text-sm leading-6 text-muted-foreground">
        {contradictionDateNote(record)} {CONTRADICTION_STATE.explanation}
      </p>

      {entries.length > 0 ? (
        <footer className="flex min-w-0 max-w-reading flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">Lands on</span>
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
