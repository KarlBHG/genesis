import Link from "next/link";

import { AsOfChip } from "@/components/as-of-chip";
import { CitationClaim, CitationGutter } from "@/components/citation-gutter";
import { Badge } from "@/components/ui/badge";
import { printedFigure } from "@/components/viz/money";
import { resolveSlug } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import { labelize } from "@/lib/format";
import { officeLabel } from "@/lib/notes";
import type { Edge } from "@/lib/types";

/**
 * Which end of the edge to name. `both` prints "A funds B" for index pages;
 * `outward` and `inward` print only the other end, for a page that already
 * names the subject in its heading.
 */
export type EdgeRowSide = "both" | "outward" | "inward";

/**
 * How to show a `pays` row's budget heading: `chip` links the policy area
 * inline, `quotation` prints the ledger heading and its source.
 */
export type EdgeRowProgram = "none" | "chip" | "quotation";

function SlugLink({
  slug,
  title,
  className,
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const target = resolveSlug(slug);
  if (!target) return <>{title}</>;
  return (
    <Link className={className ?? "underline underline-offset-4"} href={target.href}>
      {title}
    </Link>
  );
}

/**
 * The one way this app draws a stored edge.
 *
 * Every row shows the same four things in the same order: who, the typed
 * relationship, when it was true, and the sentence that says so. The proving
 * sentence lives in the citation gutter, tagged `lang="is"` when it reads as
 * Icelandic, so a screen reader does not announce an English sentence with
 * Icelandic phonemes.
 *
 * When an `amount` is present it is printed as its own source printed it.
 * Amounts are never added across rows, so there is no total line here.
 */
export function EdgeRow({
  edge,
  side = "both",
  note = null,
  showAmount = true,
  program = "none",
}: {
  edge: Edge;
  side?: EdgeRowSide;
  note?: string | null;
  showAmount?: boolean;
  program?: EdgeRowProgram;
}) {
  const otherSlug = side === "inward" ? edge.from : edge.to;
  const otherTitle =
    side === "inward"
      ? edge.fromTitle
      : edge.relationship === "holds-office"
        ? edge.toTitle
        : officeLabel(edge);

  return (
    <CitationClaim
      as="li"
      className="border-b border-border/60 py-3 last:border-0"
      gutter={
        <CitationGutter
          asOf={edge.asOf}
          quotation={edge.quotation}
          secondary={
            program === "quotation" && edge.programQuotation
              ? {
                  label: "Program heading",
                  quotation: edge.programQuotation,
                  source: edge.programSource,
                }
              : null
          }
          source={edge.source}
        />
      }
    >
      <p className="break-words">
        {side === "both" ? (
          <>
            <SlugLink
              className="font-medium underline underline-offset-4"
              slug={edge.from}
              title={edge.fromTitle}
            />{" "}
          </>
        ) : null}
        <Badge variant={side === "both" ? "secondary" : "outline"}>
          {labelize(edge.relationship)}
        </Badge>{" "}
        <SlugLink
          className="font-medium underline underline-offset-4"
          slug={otherSlug}
          title={otherTitle}
        />
        {edge.relationship === "holds-office" && edge.organizationTitle ? (
          <>
            {" · "}
            <SlugLink
              slug={edge.organization ?? ""}
              title={edge.organizationTitle}
            />
          </>
        ) : null}
        {edge.asOf ? (
          <span className="text-sm text-muted-foreground">
            {" "}
            · <AsOfChip asOf={edge.asOf} />
          </span>
        ) : null}
        {edge.year ? (
          <Badge className="ml-2 font-normal" variant="outline">
            Fiscal {edge.year}
          </Badge>
        ) : null}
        {program === "chip" && edge.program ? (
          <span className="text-sm text-muted-foreground">
            {" · Program "}
            <SlugLink slug={edge.program} title={edge.programTitle ?? edge.program} />
          </span>
        ) : null}
      </p>

      {showAmount && edge.amount ? (
        <p className="font-mono text-sm tabular-nums">
          {printedFigure(edge.amount)}
        </p>
      ) : null}

      {note ? (
        <p className="break-words text-sm leading-6 text-muted-foreground">{note}</p>
      ) : null}

      <p className="print:hidden">
        <Link
          className="text-sm text-muted-foreground underline underline-offset-4"
          href={edgeHref(edge)}
        >
          Open this connection
        </Link>
      </p>
    </CitationClaim>
  );
}
