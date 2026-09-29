import { resolveSlug } from "@/lib/content";
import {
  NO_END_STORED,
  type TenureFilter,
} from "@/lib/connection-tenure-query";
import { edgeHref } from "@/lib/edge-id";
import { formatDate, labelize } from "@/lib/format";
import {
  isCurrentMembership,
  isUnprinted,
} from "@/lib/office-membership";
import type { Edge, Relationship } from "@/lib/types";

export {
  CURRENT_MEMBERSHIP_LABEL,
  ENDED_LABEL,
  NO_END_STORED,
  TENURE_PARAM,
  UNPRINTED_CAREER_ANCHOR,
  UNPRINTED_CAREER_HREF,
  parseTenureFilter,
  serializeTenureFilter,
  toggleTenureFilter,
  type TenureFilter,
} from "@/lib/connection-tenure-query";

export type ConnectionTenure = "current" | "ended" | "unlabeled";

/** Career files store start, end, and channel. Invoices and authority lines do not. */
export function isCareerStored(
  edge: Pick<Edge, "relationship" | "channel">,
): boolean {
  return (
    edge.relationship === "holds-office" ||
    edge.relationship === "sits-on-board" ||
    (edge.relationship === "invests-in" && edge.channel != null)
  );
}

export function isPrintedEnd(end: string | null | undefined): boolean {
  return !isUnprinted(end);
}

/**
 * Current membership on Connections: a `holds-office` row with no end date
 * stored and a cited as-of. Same rule as the office Post. Board seats and
 * disclosed holdings with an empty end stay unlabeled — not inferred current.
 */
export function isCurrentConnection(
  edge: Pick<Edge, "relationship" | "end" | "asOf">,
): boolean {
  return edge.relationship === "holds-office" && isCurrentMembership(edge);
}

export function connectionTenure(
  edge: Pick<Edge, "relationship" | "end" | "asOf">,
): ConnectionTenure {
  if (isPrintedEnd(edge.end)) return "ended";
  if (isCurrentConnection(edge)) return "current";
  return "unlabeled";
}

export function displayConnectionEnd(
  end: string | null | undefined,
): string {
  if (isUnprinted(end)) return NO_END_STORED;
  return formatDate(end!.trim());
}

export function matchesTenureFilter(
  edge: Pick<Edge, "relationship" | "end" | "asOf">,
  filter: TenureFilter | null,
): boolean {
  if (filter == null) return true;
  if (filter === "current") return isCurrentConnection(edge);
  return isPrintedEnd(edge.end);
}

export function filterByTenure<T extends Pick<Edge, "relationship" | "end" | "asOf">>(
  edges: readonly T[],
  filter: TenureFilter | null,
): T[] {
  if (filter == null) return [...edges];
  return edges.filter((edge) => matchesTenureFilter(edge, filter));
}

export function tenureCounts(
  edges: readonly Pick<Edge, "relationship" | "end" | "asOf">[],
): { current: number; ended: number; unlabeled: number } {
  let current = 0;
  let ended = 0;
  let unlabeled = 0;
  for (const edge of edges) {
    const tenure = connectionTenure(edge);
    if (tenure === "current") current += 1;
    else if (tenure === "ended") ended += 1;
    else unlabeled += 1;
  }
  return { current, ended, unlabeled };
}

/**
 * Career rows whose end is empty and that are not current membership.
 * Connections label these “no end date stored.” They are not drawn as current.
 */
export function unlabeledCareerEnds(edges: readonly Edge[]): Edge[] {
  return edges.filter(
    (edge) =>
      isCareerStored(edge) &&
      isUnprinted(edge.end) &&
      !isCurrentConnection(edge),
  );
}

export function unlabeledCareerCaption(
  rows: readonly Pick<Edge, "relationship">[],
): string {
  const counts = unprintedCareerTypeCounts(rows);
  return (
    `${rows.length} career lines have no end date stored and are not current membership. ` +
    `${counts.investsIn} disclosed holdings (invests-in) and ${counts.sitsOnBoard} board seats. ` +
    (counts.holdsOffice === 0
      ? `No leftover holds-office row: every empty-end office membership already has a cited as-of. `
      : `${counts.holdsOffice} holds-office rows with an empty end and no cited as-of. `) +
    `Empty end stays “${NO_END_STORED},” never “current.” ` +
    `Counts are rows, not totals. Listed, not filled.`
  );
}

export type UnprintedCareerRelationship = Extract<
  Relationship,
  "invests-in" | "sits-on-board" | "holds-office"
>;

export type UnprintedCareerRow = {
  from: string;
  fromTitle: string;
  fromHref: string | null;
  relationship: UnprintedCareerRelationship;
  relationshipLabel: string;
  to: string;
  toTitle: string;
  toHref: string | null;
  href: string;
  asOf: string;
  label: typeof NO_END_STORED;
};

export function unprintedCareerTypeCounts(
  rows: readonly Pick<Edge, "relationship">[],
): { investsIn: number; sitsOnBoard: number; holdsOffice: number } {
  let investsIn = 0;
  let sitsOnBoard = 0;
  let holdsOffice = 0;
  for (const row of rows) {
    if (row.relationship === "invests-in") investsIn += 1;
    else if (row.relationship === "sits-on-board") sitsOnBoard += 1;
    else if (row.relationship === "holds-office") holdsOffice += 1;
  }
  return { investsIn, sitsOnBoard, holdsOffice };
}

/**
 * Leftover career ends as checklist rows. Empty end stays
 * “no end date stored.” Nothing is filled from as-of or a neighbouring term.
 */
export function unprintedCareerRows(
  edges: readonly Edge[],
): UnprintedCareerRow[] {
  return unlabeledCareerEnds(edges)
    .map((edge) => {
      const from = resolveSlug(edge.from);
      const to = resolveSlug(edge.to);
      return {
        from: edge.from,
        fromTitle: edge.fromTitle,
        fromHref: from?.href ?? null,
        relationship: edge.relationship as UnprintedCareerRelationship,
        relationshipLabel: labelize(edge.relationship),
        to: edge.to,
        toTitle: edge.toTitle,
        toHref: to?.href ?? null,
        href: edgeHref(edge),
        asOf: edge.asOf,
        label: NO_END_STORED as typeof NO_END_STORED,
      };
    })
    .sort(
      (a, b) =>
        a.fromTitle.localeCompare(b.fromTitle, "en") ||
        a.relationship.localeCompare(b.relationship) ||
        a.toTitle.localeCompare(b.toTitle, "en"),
    );
}

export function isUnprintedCareerEnd(
  edge: Pick<Edge, "relationship" | "end" | "asOf" | "channel">,
): boolean {
  return (
    isCareerStored(edge) &&
    isUnprinted(edge.end) &&
    !isCurrentConnection(edge)
  );
}
