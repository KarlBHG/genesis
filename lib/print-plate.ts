import { asOfMeta } from "@/lib/as-of";
import { folioForPath, padFolio } from "@/lib/nav";

/** Honesty line on every plate. Rows stay as cited pages printed them. */
export const PRINT_COLOPHON =
  "Rows are not added together. They stay as the cited pages printed them.";

/** Methodology path printed on the colophon — never a “retrieved today” date. */
export const METHODOLOGY_HREF = "/methodology";

/**
 * Running head for a printed plate: kind · slug · as-of bucket.
 * The bucket is classified from the stored as-of, never from the print day.
 */
export function printRunningHead(
  kind: string,
  slug: string,
  asOf: string,
): string {
  return `${kind} · ${slug} · ${asOfMeta(asOf).bucketLabel}`;
}

/** Nav folio for this path, zero-padded (`02` Map, `04` Budget). */
export function printFolio(pathname: string): string | null {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  const leaf = folioForPath(pathOnly);
  return leaf ? padFolio(leaf.index) : null;
}
