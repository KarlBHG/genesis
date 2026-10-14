import { compareAsOf } from "@/lib/as-of";
import { getBySlug, getEdges } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import { labelize } from "@/lib/format";
import {
  PUBLIC_ENTITY_INVENTORY,
  type PublicEntityCategory,
  type PublicEntityCoverageRow,
  getPublicEntityCoverage,
} from "@/lib/public-entities";
import type { Edge } from "@/lib/types";

/** Inventory rows whose parent is a ministry, statute parent, or owner. */
export const PARENT_MINISTRY_CATEGORIES: PublicEntityCategory[] = [
  "agencies-regulators",
  "courts",
  "universities",
  "public-companies-funds",
];

export const PARENT_MINISTRY_TYPES = ["regulates", "appoints", "owns"] as const;

export type ParentMinistryType = (typeof PARENT_MINISTRY_TYPES)[number];

export type ParentMinistryStatus = "sourced" | "empty";

export const PARENT_MINISTRY_STATUS_LABELS: Record<ParentMinistryStatus, string> =
  {
    sourced: "sourced parent",
    empty: "empty parent",
  };

export type ParentMinistryStatement = {
  edge: Edge;
  fromSlug: string;
  fromTitle: string;
  relationship: ParentMinistryType;
  asOf: string;
  quotation: string;
  source: string;
  href: string;
};

export type ParentMinistryRow = {
  slug: string;
  title: string;
  href: string | null;
  category: PublicEntityCategory;
  catalogParent: string | null;
  status: ParentMinistryStatus;
  statements: ParentMinistryStatement[];
};

const MUNICIPALITY_SLUGS = new Set(
  PUBLIC_ENTITY_INVENTORY.filter((row) => row.category === "municipalities").map(
    (row) => row.slug,
  ),
);

function isParentMinistryType(
  relationship: string,
): relationship is ParentMinistryType {
  return (PARENT_MINISTRY_TYPES as readonly string[]).includes(relationship);
}

/**
 * Who may stand on the parent end of a sourced parent-ministry row.
 * Ministries first. Statute/about pages also print Alþingi, the Treasury,
 * the republic, Seðlabanki (for Fjármálaeftirlitið), and municipal owners.
 * MFA `represents` never counts. Union board nominations never count.
 */
export function isParentMinistryFrom(slug: string): boolean {
  if (slug.startsWith("ministry-")) return true;
  if (slug === "prime-ministers-office") return true;
  if (slug === "althingi") return true;
  if (slug === "republic-of-iceland" || slug === "rikissjodur") return true;
  if (slug === "sedlabanki") return true;
  return MUNICIPALITY_SLUGS.has(slug);
}

export function isParentMinistryScope(slug: string): boolean {
  return PUBLIC_ENTITY_INVENTORY.some(
    (row) =>
      row.slug === slug && PARENT_MINISTRY_CATEGORIES.includes(row.category),
  );
}

export function incomingParentMinistry(
  slug: string,
  edges: readonly Edge[] = getEdges(),
): Edge[] {
  return [...edges]
    .filter(
      (edge) =>
        edge.to === slug &&
        isParentMinistryType(edge.relationship) &&
        isParentMinistryFrom(edge.from),
    )
    .sort(
      (a, b) =>
        compareAsOf(b.asOf, a.asOf) ||
        a.fromTitle.localeCompare(b.fromTitle, "en") ||
        a.relationship.localeCompare(b.relationship) ||
        a.quotation.localeCompare(b.quotation, "en"),
    );
}

function statementOf(edge: Edge): ParentMinistryStatement {
  return {
    edge,
    fromSlug: edge.from,
    fromTitle: edge.fromTitle,
    relationship: edge.relationship as ParentMinistryType,
    asOf: edge.asOf,
    quotation: edge.quotation,
    source: edge.source,
    href: edgeHref(edge),
  };
}

function catalogParentOf(slug: string): string | null {
  const entry = getBySlug(slug);
  if (!entry || entry.kind !== "institution") return null;
  return entry.parent;
}

export function getParentMinistryChecklist(
  coverage: PublicEntityCoverageRow[] = getPublicEntityCoverage(),
  edges: readonly Edge[] = getEdges(),
): ParentMinistryRow[] {
  return coverage
    .filter((row) => PARENT_MINISTRY_CATEGORIES.includes(row.category))
    .map((row) => {
      const statements = incomingParentMinistry(row.slug, edges).map(statementOf);
      return {
        slug: row.slug,
        title: row.title,
        href: row.href,
        category: row.category,
        catalogParent: catalogParentOf(row.slug),
        status: statements.length > 0 ? "sourced" : "empty",
        statements,
      };
    });
}

export function parentMinistryFor(
  slug: string,
  rows: ParentMinistryRow[] = getParentMinistryChecklist(),
): ParentMinistryRow | null {
  return rows.find((row) => row.slug === slug) ?? null;
}

export function parentMinistryHoles(
  rows: ParentMinistryRow[] = getParentMinistryChecklist(),
): ParentMinistryRow[] {
  return rows.filter((row) => row.status === "empty");
}

export function parentMinistryCaption(rows: ParentMinistryRow[]): string {
  const sourced = rows.filter((row) => row.status === "sourced").length;
  const empty = rows.filter((row) => row.status === "empty").length;
  const statementCount = rows.reduce(
    (count, row) => count + row.statements.length,
    0,
  );
  return (
    `${rows.length} agencies, regulators, courts, universities, and public companies. ` +
    `${sourced} have a sourced regulates, appoints, or owns parent. ` +
    `${empty} have an empty parent. ` +
    `${statementCount} parent statements on file. ` +
    `Counts are rows, not totals. MFA represents does not count.`
  );
}

export function relationshipLabel(type: ParentMinistryType): string {
  return labelize(type);
}
