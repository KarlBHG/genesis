import { classifyAsOfBucket, compareAsOf } from "@/lib/as-of";
import { matchesAsOfFilter, type AsOfFilter } from "@/lib/as-of-filter";
import type { Contradiction, ContradictionSide } from "@/lib/types";

/**
 * Every contradiction on file is unresolved by design. The project stores both
 * sentences and does not pick one, so there is no resolved state to render.
 */
export const CONTRADICTION_STATE = {
  id: "unresolved",
  label: "Unresolved",
  explanation:
    "Both sentences stay. Nothing here picks a winner, averages the two, or marks one side as corrected — that would put a number on the page that no source prints.",
} as const;

export function contradictionAsOfValues(record: Contradiction): string[] {
  return record.sides.map((side) => side.asOf);
}

/**
 * Verso then recto, in the order the file stores them. Never sorted by later
 * as-of — that would weight a column.
 */
export function variorumLeaves(
  record: Contradiction,
): [ContradictionSide, ContradictionSide] {
  return record.sides;
}

/** A contradiction is in scope when either of its sides is. */
export function matchesContradiction(
  record: Contradiction,
  filter: AsOfFilter,
): boolean {
  return contradictionAsOfValues(record).some((asOf) =>
    matchesAsOfFilter(asOf, filter),
  );
}

/** The later of the two sides, used to order the list. Never sorts phrases as ISO. */
export function latestSideAsOf(record: Contradiction): string {
  const [first, second] = record.sides;
  return compareAsOf(first.asOf, second.asOf) >= 0 ? first.asOf : second.asOf;
}

export function sortContradictions(records: Contradiction[]): Contradiction[] {
  return [...records].sort(
    (a, b) =>
      compareAsOf(latestSideAsOf(b), latestSideAsOf(a)) ||
      a.id.localeCompare(b.id),
  );
}

/**
 * What the pair of as-of values means for a reader comparing the two sides.
 * Same-date disagreement and dated-versus-undated disagreement are different
 * problems, so the surface says which one this is.
 */
export function contradictionDateNote(record: Contradiction): string {
  const [first, second] = record.sides;
  const buckets = [
    classifyAsOfBucket(first.asOf),
    classifyAsOfBucket(second.asOf),
  ];
  const undated = buckets.filter((bucket) => bucket === "undated").length;
  if (undated === 2) {
    return "Neither page prints a date, so neither sentence can be called the later reading.";
  }
  if (buckets.includes("statute")) {
    return undated === 1
      ? "One side is a consolidated statute, read as it stood on the pass, and the other page prints no date at all. Neither side can be called the later reading."
      : "One side is a consolidated statute, read as it stood on the pass. It has no single as-of day to compare against the other.";
  }
  if (undated === 1) {
    return "Only one side carries a date. The undated sentence is not therefore the older one — the page simply does not say.";
  }
  if (first.asOf === second.asOf) {
    return "Both sentences carry the same as-of value, so this is one source disagreeing with itself.";
  }
  return "The two sides carry different as-of values. The later reading does not cancel the earlier one; both are stored.";
}
