import type { ReactNode } from "react";

import { ExternalLink } from "@/components/external-link";
import { Badge } from "@/components/ui/badge";
import { asOfMeta } from "@/lib/as-of";
import { icelandicLang } from "@/lib/lang";
import { retrievalCaveat } from "@/lib/provenance";

export type CitationSecondary = {
  label: string;
  quotation: string;
  source?: string | null;
};

type ClaimTag = "li" | "div" | "article";

/** Hairline URL — the stored address, written out, never paraphrased. */
export function CitationSourceLink({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <ExternalLink
      className={`citation-source print-literal-url underline-offset-4 hover:underline ${className ?? ""}`}
      href={source}
      title={source}
    >
      {source}
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
 * The proving sentence as a Tufte sidenote: as-of kicker, verbatim italic
 * quotation, hairline source URL. Never shortened, never translated.
 */
export function CitationGutter({
  quotation,
  source,
  asOf,
  secondary,
  className,
}: {
  quotation: string;
  source: string;
  asOf?: string | null;
  secondary?: CitationSecondary | null;
  className?: string;
}) {
  const meta = asOf?.trim() ? asOfMeta(asOf) : null;
  return (
    <aside
      aria-label="Citation"
      className={`citation-gutter ${className ?? ""}`}
      data-citation-gutter=""
    >
      {meta ? (
        <p className="citation-as-of">
          {meta.bucketLabel}
          {meta.display ? ` · ${meta.display}` : ""}
        </p>
      ) : null}
      <blockquote
        className="hang-quote citation-quote"
        lang={icelandicLang(quotation)}
      >
        {quotation}
      </blockquote>
      <CitationSourceLink source={source} />
      <RetrievalCaveatNote source={source} />
      {secondary ? (
        <div className="citation-secondary">
          <p className="citation-as-of">{secondary.label}</p>
          <blockquote
            className="hang-quote citation-quote"
            lang={icelandicLang(secondary.quotation)}
          >
            {secondary.quotation}
          </blockquote>
          {secondary.source ? (
            <CitationSourceLink source={secondary.source} />
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

/**
 * Claim in the reading column, citation in the gutter. Below the folio
 * threshold the same gutter stacks under the claim — not a modal.
 */
export function CitationClaim({
  children,
  gutter,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  gutter: ReactNode;
  as?: ClaimTag;
  className?: string;
}) {
  return (
    <Tag className={`citation-claim ${className ?? ""}`}>
      <div className="citation-claim-grid">
        <div className="citation-claim-body">{children}</div>
        {gutter}
      </div>
    </Tag>
  );
}

/**
 * When the quotation *is* the page — edge permalinks keep the six fields as
 * the whole page. Same type as the gutter, not a sidenote to something else.
 */
export function CitationPlate({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ClaimTag;
}) {
  return (
    <Tag
      className={`citation-plate ${className ?? ""}`}
      data-citation-plate=""
    >
      {children}
    </Tag>
  );
}
