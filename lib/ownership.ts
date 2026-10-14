import { compareAsOf } from "@/lib/as-of";
import { getContradictions, getEdges } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import {
  PUBLIC_ENTITY_INVENTORY,
  type PublicEntityCoverageRow,
  getPublicEntityCoverage,
} from "@/lib/public-entities";
import type { Contradiction, Edge } from "@/lib/types";

/**
 * BODS 0.4 names: the *subject* is the entity that is owned; the *interested
 * party* is who the cited page says has the interest. Stored `owns` edges keep
 * from = interested party and to = subject. The permalink is the statement.
 */
export type OwnershipStatement = {
  edge: Edge;
  subjectSlug: string;
  subjectTitle: string;
  interestedPartySlug: string;
  interestedPartyTitle: string;
  asOf: string;
  quotation: string;
  source: string;
  href: string;
};

/** Contradictions whose sides are about holding or shareholder count, not a typed owns row. */
export const OWNERSHIP_CONTRADICTION_IDS = [
  "landsbankinn-shareholder-count",
  "landsvirkjun-form-and-holding",
] as const;

export type SoeOwnershipStatus = "sourced" | "contradiction-only" | "none";

export const SOE_OWNERSHIP_STATUS_LABELS: Record<SoeOwnershipStatus, string> = {
  sourced: "sourced statement",
  "contradiction-only": "only a contradiction",
  none: "no sourced owns",
};

export type SoeOwnershipRow = {
  slug: string;
  title: string;
  href: string | null;
  status: SoeOwnershipStatus;
  statements: OwnershipStatement[];
  contradictions: Contradiction[];
};

export function isOwnsEdge(edge: Pick<Edge, "relationship">): boolean {
  return edge.relationship === "owns";
}

export function ownershipStatement(edge: Edge): OwnershipStatement {
  return {
    edge,
    subjectSlug: edge.to,
    subjectTitle: edge.toTitle,
    interestedPartySlug: edge.from,
    interestedPartyTitle: edge.fromTitle,
    asOf: edge.asOf,
    quotation: edge.quotation,
    source: edge.source,
    href: edgeHref(edge),
  };
}

export function incomingOwns(
  slug: string,
  edges: readonly Edge[] = getEdges(),
): Edge[] {
  return [...edges]
    .filter((edge) => edge.relationship === "owns" && edge.to === slug)
    .sort(
      (a, b) =>
        compareAsOf(b.asOf, a.asOf) ||
        a.fromTitle.localeCompare(b.fromTitle, "en") ||
        a.quotation.localeCompare(b.quotation, "en"),
    );
}

export function ownershipContradictionsFor(
  slug: string,
  contradictions: readonly Contradiction[] = getContradictions(),
): Contradiction[] {
  const ids = new Set<string>(OWNERSHIP_CONTRADICTION_IDS);
  return contradictions.filter(
    (record) => ids.has(record.id) && record.entries.includes(slug),
  );
}

function soeStatus(
  statements: OwnershipStatement[],
  contradictions: Contradiction[],
): SoeOwnershipStatus {
  if (statements.length > 0) return "sourced";
  if (contradictions.length > 0) return "contradiction-only";
  return "none";
}

export function getSoeOwnershipChecklist(
  coverage: PublicEntityCoverageRow[] = getPublicEntityCoverage(),
  edges: readonly Edge[] = getEdges(),
  contradictions: readonly Contradiction[] = getContradictions(),
): SoeOwnershipRow[] {
  return coverage
    .filter((row) => row.category === "public-companies-funds")
    .map((row) => {
      const statements = incomingOwns(row.slug, edges).map(ownershipStatement);
      const related = ownershipContradictionsFor(row.slug, contradictions);
      return {
        slug: row.slug,
        title: row.title,
        href: row.href,
        status: soeStatus(statements, related),
        statements,
        contradictions: related,
      };
    });
}

export function soeOwnershipFor(
  slug: string,
  rows: SoeOwnershipRow[] = getSoeOwnershipChecklist(),
): SoeOwnershipRow | null {
  return rows.find((row) => row.slug === slug) ?? null;
}

export function isInventoryPublicCompanyOrFund(slug: string): boolean {
  return PUBLIC_ENTITY_INVENTORY.some(
    (row) => row.slug === slug && row.category === "public-companies-funds",
  );
}

export function soeOwnershipCaption(rows: SoeOwnershipRow[]): string {
  const sourced = rows.filter((row) => row.status === "sourced").length;
  const contradictionOnly = rows.filter(
    (row) => row.status === "contradiction-only",
  ).length;
  const none = rows.filter((row) => row.status === "none").length;
  const statementCount = rows.reduce(
    (count, row) => count + row.statements.length,
    0,
  );
  return (
    `${rows.length} inventory public companies and funds. ` +
    `${sourced} have a sourced owns statement. ` +
    `${none} have none. ` +
    `${contradictionOnly} have only a contradiction. ` +
    `${statementCount} owns statements on file. ` +
    `Counts are rows, not share totals.`
  );
}

export function soeHoleRows(
  rows: SoeOwnershipRow[] = getSoeOwnershipChecklist(),
): SoeOwnershipRow[] {
  return rows.filter((row) => row.status !== "sourced");
}
