import Link from "next/link";
import type { ReactNode } from "react";

import { ProvenanceCard } from "@/components/provenance-card";
import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { labelize } from "@/lib/format";
import { identityForPaysEdge } from "@/lib/identities";
import { officeLabel } from "@/lib/notes";
import type { Edge } from "@/lib/types";

function EndpointLink({ slug, title }: { slug: string; title: string }) {
  const target = resolveSlug(slug);
  if (!target) return <>{title}</>;
  return (
    <Link className="underline underline-offset-4" href={target.href}>
      {title}
    </Link>
  );
}

function printedHeadingNote(edge: Edge): ReactNode {
  const identity = identityForPaysEdge(edge);
  if (!identity) return null;
  const sits = identity.catalogSlug ? resolveSlug(identity.catalogSlug) : null;
  return (
    <>
      Printed heading{" "}
      <span lang="is">{identity.printedHeading}</span>
      {sits ? <> sits on {sits.title}</> : <> is unmatched</>}. This is an
      identity statement, not a silent rename.{" "}
      <Link className="underline underline-offset-4" href="/money#printed-headings">
        Heading identities
      </Link>
      .
    </>
  );
}

/**
 * A stored edge in the provenance-first presentation.
 *
 * Use `components/viz/EdgeRow` to list edges on an entry or index page. Use this
 * where the sourcing is the subject — the evidence room, obligation themes, the
 * invoice-to-budget bridge — because it also shows how the address had to be
 * read and, for `pays` rows, the ledger heading that carries the join.
 */
export function ProvenanceEdgeCard({
  edge,
  as = "li",
  className,
  note,
  showRelationship = true,
  showProgramQuotation = false,
  showTitle = true,
  layout = "gutter",
}: {
  edge: Edge;
  as?: "li" | "div" | "article";
  className?: string;
  note?: string | null;
  showRelationship?: boolean;
  /** For `pays` rows: print the budget heading that joined the invoice. */
  showProgramQuotation?: boolean;
  /** Permalink pages already title the relationship in the masthead. */
  showTitle?: boolean;
  layout?: "gutter" | "page";
}) {
  return (
    <ProvenanceCard
      amount={edge.amount ?? null}
      as={as}
      asOf={edge.asOf}
      className={className}
      layout={layout}
      meta={
        <>
          {showRelationship ? (
            <Badge className="font-normal" variant="outline">
              {labelize(edge.relationship)}
            </Badge>
          ) : null}
          {edge.year ? (
            <Badge className="font-normal" variant="outline">
              Fiscal {edge.year}
            </Badge>
          ) : null}
        </>
      }
      note={note ?? printedHeadingNote(edge)}
      quotation={edge.quotation}
      secondary={
        showProgramQuotation && edge.programQuotation
          ? {
              label: "The ledger heading that joins this row to the policy area",
              quotation: edge.programQuotation,
              source: edge.programSource,
            }
          : null
      }
      source={edge.source}
      title={
        showTitle ? (
          <>
            <EndpointLink slug={edge.from} title={edge.fromTitle} />
            {" → "}
            <EndpointLink
              slug={edge.to}
              title={
                edge.relationship === "holds-office"
                  ? officeLabel(edge)
                  : edge.toTitle
              }
            />
          </>
        ) : undefined
      }
    />
  );
}
