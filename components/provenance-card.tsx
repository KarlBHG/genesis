import type { ReactNode } from "react";

import { AsOfChip } from "@/components/as-of-chip";
import {
  CitationClaim,
  CitationGutter,
  CitationPlate,
  type CitationSecondary,
} from "@/components/citation-gutter";
import { basisLabel, printedFigure } from "@/components/viz/money";
import type { EdgeAmount } from "@/lib/types";

export type ProvenanceSecondary = CitationSecondary;

/** @deprecated Use CitationSourceLink — kept so older imports still type-check. */
export {
  CitationSourceLink as ProvenanceSourceLink,
  RetrievalCaveatNote,
} from "@/components/citation-gutter";

type ProvenanceCardProps = {
  /** Address the quotation was read from. */
  source: string;
  /** The sentence as the page prints it. Never paraphrased here. */
  quotation: string;
  /** Raw `asOf` value; the bucket chip is derived, not stored. */
  asOf?: string | null;
  /** Headline for the row — usually the relationship it supports. */
  title?: ReactNode;
  /** Extra chips beside the as-of chip, e.g. fiscal year. */
  meta?: ReactNode;
  /** A figure the cited page prints, rendered by the shared money primitive. */
  amount?: EdgeAmount | null;
  /** A second quotation that carries the row, e.g. the budget-heading line. */
  secondary?: ProvenanceSecondary | null;
  /** Caveat written for this row, beyond the one derived from the address. */
  note?: ReactNode;
  as?: "li" | "div" | "article";
  className?: string;
  /**
   * `gutter` (default): citation sits in the Tufte margin on other pages.
   * `page`: the quotation is the body — edge permalinks keep the six fields
   * as the whole page.
   */
  layout?: "gutter" | "page";
};

function ClaimHeader({
  title,
  asOf,
  meta,
  amount,
  note,
}: {
  title?: ReactNode;
  asOf?: string | null;
  meta?: ReactNode;
  amount?: EdgeAmount | null;
  note?: ReactNode;
}) {
  const hasHeader = Boolean(title || asOf || meta);
  return (
    <>
      {hasHeader ? (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1.5">
          {title ? (
            <p className="min-w-0 flex-1 break-words text-sm font-medium">
              {title}
            </p>
          ) : null}
          <span className="flex flex-wrap items-center gap-2 text-xs">
            {asOf ? <AsOfChip asOf={asOf} /> : null}
            {meta}
          </span>
        </div>
      ) : null}

      {amount ? (
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-sm tabular-nums">
            {printedFigure(amount)}
          </span>
          <span className="text-xs text-muted-foreground">
            as the {basisLabel(amount.basis)} prints it — not converted, not
            added to anything
          </span>
        </p>
      ) : null}

      {note ? (
        <p className="text-xs leading-5 break-words text-muted-foreground">
          {note}
        </p>
      ) : null}
    </>
  );
}

/**
 * One sourced line: what it supports, when the page said it, and a citation
 * gutter for the proving sentence.
 *
 * `components/viz/EdgeRow` is the compact way to list stored edges inside an
 * entry or index. This is the provenance-first presentation, for surfaces whose
 * subject is the sourcing rather than the relationship — and for sourced rows
 * that are not edges at all, such as contradiction sides and audit sentences.
 */
export function ProvenanceCard({
  source,
  quotation,
  asOf,
  title,
  meta,
  amount,
  secondary,
  note,
  as: Tag = "div",
  className,
  layout = "gutter",
}: ProvenanceCardProps) {
  const gutter = (
    <CitationGutter
      asOf={asOf}
      quotation={quotation}
      secondary={secondary}
      source={source}
    />
  );

  if (layout === "page") {
    return (
      <CitationPlate as={Tag} className={className}>
        <ClaimHeader
          amount={amount}
          asOf={null}
          meta={meta}
          note={note}
          title={title}
        />
        {gutter}
      </CitationPlate>
    );
  }

  return (
    <CitationClaim as={Tag} className={className} gutter={gutter}>
      <ClaimHeader
        amount={amount}
        asOf={asOf}
        meta={meta}
        note={note}
        title={title}
      />
    </CitationClaim>
  );
}
