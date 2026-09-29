import type { ReactNode } from "react";

import { AsOfChip } from "@/components/as-of-chip";
import { ExternalLink } from "@/components/external-link";
import { Badge } from "@/components/ui/badge";
import { basisLabel, printedFigure } from "@/components/viz/money";
import { icelandicLang } from "@/lib/lang";
import { retrievalCaveat, sourceLabel } from "@/lib/provenance";
import type { EdgeAmount } from "@/lib/types";

export type ProvenanceSecondary = {
  label: string;
  quotation: string;
  source?: string | null;
};

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
};

export function ProvenanceSourceLink({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <ExternalLink
      className={`inline-flex max-w-full items-baseline gap-1.5 text-xs underline-offset-4 hover:underline ${className ?? ""}`}
      href={source}
      title={source}
    >
      <span className="font-medium break-all">{sourceLabel(source)}</span>
      <span className="text-muted-foreground">↗</span>
    </ExternalLink>
  );
}

export function RetrievalCaveatNote({ source }: { source: string }) {
  const caveat = retrievalCaveat(source);
  if (!caveat) return null;
  return (
    <p className="flex flex-col gap-1 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-baseline sm:gap-2">
      <Badge className="w-fit shrink-0 font-normal" variant="outline">
        {caveat.label}
      </Badge>
      <span className="break-words">{caveat.note}</span>
    </p>
  );
}

/**
 * One sourced line: what it supports, when the page said it, the quotation
 * itself, the address, and how the address had to be read.
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
}: ProvenanceCardProps) {
  return (
    <Tag
      className={`flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 bg-background/70 p-4 ${className ?? ""}`}
    >
      {title || asOf || meta ? (
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

      <blockquote
        className="hang-quote border-l-2 border-primary/25 pl-3 text-sm leading-6 break-words"
        lang={icelandicLang(quotation)}
      >
        {quotation}
      </blockquote>

      {secondary ? (
        <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {secondary.label}
          </p>
          <blockquote
            className="hang-quote text-sm leading-6 break-words"
            lang={icelandicLang(secondary.quotation)}
          >
            {secondary.quotation}
          </blockquote>
          {secondary.source ? (
            <ProvenanceSourceLink source={secondary.source} />
          ) : null}
        </div>
      ) : null}

      {note ? (
        <p className="text-xs leading-5 break-words text-muted-foreground">{note}</p>
      ) : null}

      <div className="flex min-w-0 flex-col gap-1.5">
        <ProvenanceSourceLink source={source} />
        <RetrievalCaveatNote source={source} />
      </div>
    </Tag>
  );
}
