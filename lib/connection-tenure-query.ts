/**
 * Client-safe tenure query helpers. Keep `fs` / catalog loaders out of this
 * file so the Connections chips can hydrate without pulling the Markdown tree.
 */

/** Empty end on a connection is this phrase — never “current”. */
export const NO_END_STORED = "no end date stored";

/** Checklist of leftover career ends on the existing Connections leaf. */
export const UNPRINTED_CAREER_ANCHOR = "unprinted-ends";

export const UNPRINTED_CAREER_HREF = `/connections#${UNPRINTED_CAREER_ANCHOR}`;

export const TENURE_PARAM = "tenure";

export const CURRENT_MEMBERSHIP_LABEL = "current membership";

export const ENDED_LABEL = "ended";

export type TenureFilter = "current" | "ended";

const TENURE_IDS = new Set<string>(["current", "ended"]);

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
