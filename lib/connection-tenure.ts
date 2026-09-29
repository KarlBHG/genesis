import { formatDate } from "@/lib/format";
import {
  isCurrentMembership,
  isUnprinted,
} from "@/lib/office-membership";
import type { Edge } from "@/lib/types";

/** Empty end on a connection is this phrase — never “current”. */
export const NO_END_STORED = "no end date stored";

export const TENURE_PARAM = "tenure";

export const CURRENT_MEMBERSHIP_LABEL = "current membership";

export const ENDED_LABEL = "ended";

export type TenureFilter = "current" | "ended";

export type ConnectionTenure = "current" | "ended" | "unlabeled";

const TENURE_IDS = new Set<string>(["current", "ended"]);

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

export function parseTenureFilter(
  raw: string | null | undefined,
): TenureFilter | null {
  const value = raw?.trim() ?? "";
  return TENURE_IDS.has(value) ? (value as TenureFilter) : null;
}

export function serializeTenureFilter(filter: TenureFilter | null): string {
  return filter ?? "";
}

export function toggleTenureFilter(
  filter: TenureFilter | null,
  next: TenureFilter,
): TenureFilter | null {
  return filter === next ? null : next;
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

export function unlabeledCareerCaption(rows: readonly Edge[]): string {
  return (
    `${rows.length} career lines have no end date stored and are not current membership. ` +
    `Current membership is a holds-office row with an empty end and a cited as-of. ` +
    `Board seats and disclosed holdings stay unlabeled when the cited page prints no end.`
  );
}
