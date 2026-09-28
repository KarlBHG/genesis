import { classifyAsOfBucket, type AsOfBucket } from "@/lib/as-of";

/**
 * Shared `?asOf=` filter for edge lists.
 *
 * The vocabulary is the four `asOf` buckets plus year windows. A phrase date is
 * never read as an ISO date: only `iso` and `year` rows carry a comparable
 * year, so `statute` and `undated` rows can be selected by bucket but never
 * fall inside a year window.
 */

export const AS_OF_PARAM = "asOf";

export const AS_OF_BUCKETS: readonly AsOfBucket[] = [
  "iso",
  "year",
  "statute",
  "undated",
] as const;

export const AS_OF_BUCKET_HELP: Record<AsOfBucket, string> = {
  iso: "A full date printed on the page: an invoice date, a signature date, a fact-sheet cut-off.",
  year: "The page prints a year or a span of years and no day.",
  statute: "A consolidated statute, read as it stood on the pass. There is no single as-of day.",
  undated: "The page prints no date at all. The stored value says which page was undated.",
};

export type AsOfWindow = { from: number; to: number };

export type AsOfFilter = {
  buckets: AsOfBucket[];
  windows: AsOfWindow[];
};

const BUCKET_IDS = new Set<string>(AS_OF_BUCKETS);

export function emptyAsOfFilter(): AsOfFilter {
  return { buckets: [], windows: [] };
}

/** No token selected means every row passes. */
export function isAsOfFilterEmpty(filter: AsOfFilter): boolean {
  return filter.buckets.length === 0 && filter.windows.length === 0;
}

export function windowToken(window: AsOfWindow): string {
  return window.from === window.to
    ? String(window.from)
    : `${window.from}-${window.to}`;
}

export function windowLabel(window: AsOfWindow): string {
  return window.from === window.to
    ? String(window.from)
    : `${window.from}–${window.to}`;
}

function parseWindowToken(token: string): AsOfWindow | null {
  const single = token.match(/^(\d{4})$/);
  if (single) {
    const year = Number(single[1]);
    return { from: year, to: year };
  }
  const span = token.match(/^(\d{4})-(\d{4})$/);
  if (span) {
    const from = Number(span[1]);
    const to = Number(span[2]);
    return from <= to ? { from, to } : { from: to, to: from };
  }
  return null;
}

export function parseAsOfFilter(raw: string | null | undefined): AsOfFilter {
  if (!raw || !raw.trim()) return emptyAsOfFilter();
  const buckets: AsOfBucket[] = [];
  const windows: AsOfWindow[] = [];
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;
    if (BUCKET_IDS.has(token)) {
      if (!buckets.includes(token as AsOfBucket)) buckets.push(token as AsOfBucket);
      continue;
    }
    const window = parseWindowToken(token);
    if (window && !windows.some((item) => windowToken(item) === windowToken(window))) {
      windows.push(window);
    }
  }
  return { buckets, windows };
}

/** Empty string when nothing is selected, so the parameter stays off the URL. */
export function serializeAsOfFilter(filter: AsOfFilter): string {
  return [
    ...AS_OF_BUCKETS.filter((bucket) => filter.buckets.includes(bucket)),
    ...filter.windows.map(windowToken),
  ].join(",");
}

export function toggleAsOfBucket(
  filter: AsOfFilter,
  bucket: AsOfBucket,
): AsOfFilter {
  const selected = filter.buckets.includes(bucket);
  return {
    buckets: selected
      ? filter.buckets.filter((item) => item !== bucket)
      : [...filter.buckets, bucket],
    windows: filter.windows,
  };
}

export function toggleAsOfWindow(
  filter: AsOfFilter,
  window: AsOfWindow,
): AsOfFilter {
  const token = windowToken(window);
  const selected = filter.windows.some((item) => windowToken(item) === token);
  return {
    buckets: filter.buckets,
    windows: selected
      ? filter.windows.filter((item) => windowToken(item) !== token)
      : [...filter.windows, window],
  };
}

export function hasAsOfBucket(filter: AsOfFilter, bucket: AsOfBucket): boolean {
  return filter.buckets.includes(bucket);
}

export function hasAsOfWindow(filter: AsOfFilter, window: AsOfWindow): boolean {
  const token = windowToken(window);
  return filter.windows.some((item) => windowToken(item) === token);
}

/**
 * The year a row can be placed on a timeline, or null when it cannot. Phrase
 * dates and consolidated statutes return null even when a year appears inside
 * the phrase.
 */
export function comparableYear(asOf: string): number | null {
  const value = asOf.trim();
  const bucket = classifyAsOfBucket(value);
  if (bucket !== "iso" && bucket !== "year") return null;
  const leading = value.match(/^(\d{4})/);
  return leading ? Number(leading[1]) : null;
}

export function matchesAsOfFilter(asOf: string, filter: AsOfFilter): boolean {
  if (isAsOfFilterEmpty(filter)) return true;
  if (filter.buckets.includes(classifyAsOfBucket(asOf.trim()))) return true;
  const year = comparableYear(asOf);
  if (year == null) return false;
  return filter.windows.some(
    (window) => year >= window.from && year <= window.to,
  );
}

export function filterByAsOf<T>(
  items: readonly T[],
  asOfOf: (item: T) => string,
  filter: AsOfFilter,
): T[] {
  if (isAsOfFilterEmpty(filter)) return [...items];
  return items.filter((item) => matchesAsOfFilter(asOfOf(item), filter));
}

export function asOfBucketCounts(
  values: readonly string[],
): Record<AsOfBucket, number> {
  const counts: Record<AsOfBucket, number> = {
    iso: 0,
    year: 0,
    statute: 0,
    undated: 0,
  };
  for (const value of values) counts[classifyAsOfBucket(value.trim())] += 1;
  return counts;
}

/**
 * Year windows built from the values actually present: each of the four most
 * recent years on its own, then decades for what came before. Rows with no
 * comparable year get no window — they are reachable only through the
 * `statute` and `undated` chips.
 */
export function asOfWindows(values: readonly string[]): AsOfWindow[] {
  const years = [
    ...new Set(
      values
        .map((value) => comparableYear(value))
        .filter((year): year is number => year != null),
    ),
  ].sort((a, b) => b - a);
  if (years.length === 0) return [];
  const recent = years.slice(0, 4);
  const older = years.slice(4);
  const windows: AsOfWindow[] = recent.map((year) => ({ from: year, to: year }));
  const decades = new Set(older.map((year) => Math.floor(year / 10) * 10));
  for (const decade of [...decades].sort((a, b) => b - a)) {
    windows.push({ from: decade, to: decade + 9 });
  }
  return windows;
}

export function countMatchingAsOf(
  values: readonly string[],
  filter: AsOfFilter,
): number {
  return values.filter((value) => matchesAsOfFilter(value, filter)).length;
}
