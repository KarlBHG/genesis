import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { asOfMeta, type AsOfBucket } from "@/lib/as-of";
import {
  AS_OF_BUCKETS,
  AS_OF_BUCKET_HELP,
  AS_OF_PARAM,
  asOfBucketCounts,
  asOfWindows,
  countMatchingAsOf,
  emptyAsOfFilter,
  hasAsOfBucket,
  hasAsOfWindow,
  isAsOfFilterEmpty,
  serializeAsOfFilter,
  toggleAsOfBucket,
  toggleAsOfWindow,
  windowLabel,
  type AsOfFilter,
  type AsOfWindow,
} from "@/lib/as-of-filter";

export type AsOfFilterProps = {
  /** Route the chips link back to. */
  basePath: string;
  /** Other query parameters on the current URL, preserved on every chip. */
  params?: Record<string, string>;
  /** Hash kept on every chip so the reader stays in place. */
  anchor?: string;
  filter: AsOfFilter;
  /** Every `asOf` value in scope before filtering — drives counts and windows. */
  values: readonly string[];
  /** What the filtered rows are called, e.g. "sourced lines". */
  unit?: string;
};

function href(
  basePath: string,
  params: Record<string, string>,
  filter: AsOfFilter,
  anchor?: string,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === AS_OF_PARAM || !value) continue;
    search.set(key, value);
  }
  const serialized = serializeAsOfFilter(filter);
  if (serialized) search.set(AS_OF_PARAM, serialized);
  const query = search.toString();
  return `${basePath}${query ? `?${query}` : ""}${anchor ? `#${anchor}` : ""}`;
}

function Chip({
  active,
  children,
  label,
  to,
}: {
  active: boolean;
  children: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link
      aria-label={label}
      aria-pressed={active}
      className={`as-of-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary/40 bg-secondary text-secondary-foreground"
          : "border-border/70 text-muted-foreground hover:border-primary/25 hover:text-foreground"
      }`}
      href={to}
      role="button"
      scroll={false}
    >
      {children}
    </Link>
  );
}

/**
 * Constrain an edge list to a period using the four `asOf` buckets and the year
 * windows present in the data. State lives in `?asOf=`, so a filtered view is
 * shareable. Statute and undated rows carry no comparable year, so a year
 * window never includes them.
 */
export function AsOfFilterBar({
  basePath,
  params = {},
  anchor,
  filter,
  values,
  unit = "rows",
}: AsOfFilterProps) {
  const counts = asOfBucketCounts(values);
  const windows = asOfWindows(values);
  const total = values.length;
  const matched = isAsOfFilterEmpty(filter)
    ? total
    : countMatchingAsOf(values, filter);
  const link = (next: AsOfFilter) => href(basePath, params, next, anchor);

  const bucketsInUse = AS_OF_BUCKETS.filter(
    (bucket: AsOfBucket) => counts[bucket] > 0,
  );
  const undatedHidden =
    !isAsOfFilterEmpty(filter) && filter.windows.length > 0
      ? (["statute", "undated"] as const).reduce(
          (sum, bucket) =>
            sum + (hasAsOfBucket(filter, bucket) ? 0 : counts[bucket]),
          0,
        )
      : 0;

  return (
    <section
      aria-label="Filter by as-of date"
      className="as-of-rail flex min-w-0 flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">As of</h3>
        <p className="text-xs tabular-nums text-muted-foreground">
          {matched} of {total} {unit}
        </p>
      </div>

      {bucketsInUse.length > 0 ? (
        <div className="as-of-chip-row flex min-w-0 flex-wrap gap-2">
          {bucketsInUse.map((bucket) => (
            <Chip
              active={hasAsOfBucket(filter, bucket)}
              key={bucket}
              label={`${bucket} dates — ${AS_OF_BUCKET_HELP[bucket]}`}
              to={link(toggleAsOfBucket(filter, bucket))}
            >
              <span>{bucket}</span>
              <span className="tabular-nums opacity-70">{counts[bucket]}</span>
            </Chip>
          ))}
        </div>
      ) : null}

      {windows.length > 0 ? (
        <div className="as-of-chip-row flex min-w-0 flex-wrap gap-2">
          {windows.map((window: AsOfWindow) => (
            <Chip
              active={hasAsOfWindow(filter, window)}
              key={windowLabel(window)}
              label={`Dates in ${windowLabel(window)}`}
              to={link(toggleAsOfWindow(filter, window))}
            >
              <span className="tabular-nums">{windowLabel(window)}</span>
            </Chip>
          ))}
        </div>
      ) : null}

      {isAsOfFilterEmpty(filter) ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Every stored date is shown. Pick a bucket or a year window to narrow
          the list; the choice stays in the address so the view can be shared.
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-2">
          <p className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground">
            <span className="break-words">
              Showing{" "}
              {filter.buckets.length > 0
                ? `${filter.buckets.join(", ")} dates`
                : "dated rows"}
              {filter.windows.length > 0
                ? ` in ${filter.windows.map(windowLabel).join(", ")}`
                : ""}
              .
            </span>
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={link(emptyAsOfFilter())}
              scroll={false}
            >
              Clear
            </Link>
          </p>
          {undatedHidden > 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              <Badge className="mr-1.5 font-normal" variant="outline">
                hidden
              </Badge>
              {undatedHidden}{" "}
              {undatedHidden === 1 ? "row carries" : "rows carry"} a statute or
              undated value, which has no comparable year, so a year window
              cannot include {undatedHidden === 1 ? "it" : "them"}. Add the{" "}
              <code className="text-[0.7rem]">statute</code> or{" "}
              <code className="text-[0.7rem]">undated</code> chip to bring{" "}
              {undatedHidden === 1 ? "it" : "them"} back.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** Same bucket vocabulary as the filter, for a single stored value. */
export function AsOfBucketNote({ asOf }: { asOf: string }) {
  const meta = asOfMeta(asOf);
  return (
    <span className="text-xs text-muted-foreground">
      {AS_OF_BUCKET_HELP[meta.bucket]}
    </span>
  );
}
