import Link from "next/link";

import { ProvenanceCard } from "@/components/provenance-card";
import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { labelize } from "@/lib/format";
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
}: {
  edge: Edge;
  as?: "li" | "div" | "article";
  className?: string;
  note?: string | null;
  showRelationship?: boolean;
  /** For `pays` rows: print the budget heading that joined the invoice. */
  showProgramQuotation?: boolean;
}) {
  return (
    <ProvenanceCard
      amount={edge.amount ?? null}
      as={as}
      asOf={edge.asOf}
      className={className}
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
      note={note}
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
        <>
          <EndpointLink slug={edge.from} title={edge.fromTitle} />
          {" → "}
          <EndpointLink
            slug={edge.to}
            title={
              edge.relationship === "holds-office" ? officeLabel(edge) : edge.toTitle
            }
          />
        </>
      }
    />
  );
}
