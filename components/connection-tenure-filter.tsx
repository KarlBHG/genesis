import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { LiveFlag } from "@/components/live-flag";
import {
  CURRENT_MEMBERSHIP_LABEL,
  ENDED_LABEL,
  NO_END_STORED,
  TENURE_PARAM,
  UNPRINTED_CAREER_HREF,
  serializeTenureFilter,
  toggleTenureFilter,
  type TenureFilter,
} from "@/lib/connection-tenure";

export type ConnectionTenureFilterProps = {
  /** Route the chips link back to. Index uses `/connections`; detail also lands there. */
  basePath?: string;
  /** Other query parameters on the current URL, preserved on every chip. */
  params?: Record<string, string>;
  filter: TenureFilter | null;
  currentCount: number;
  endedCount: number;
  total: number;
  unlabeledCount: number;
  /** On a permalink, mark the chip that matches this line without toggling it off. */
  highlight?: TenureFilter | null;
  unit?: string;
};

function href(
  basePath: string,
  params: Record<string, string>,
  filter: TenureFilter | null,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === TENURE_PARAM || !value) continue;
    search.set(key, value);
  }
  const serialized = serializeTenureFilter(filter);
  if (serialized) search.set(TENURE_PARAM, serialized);
  const query = search.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
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
 * Current vs ended on Connections. State lives in `?tenure=`, so a filtered
 * view is shareable. Current is the office membership rule. Empty ends keep
 * the label “no end date stored.”
 */
export function ConnectionTenureFilter({
  basePath = "/connections",
  params = {},
  filter,
  currentCount,
  endedCount,
  total,
  unlabeledCount,
  highlight = null,
  unit = "typed lines",
}: ConnectionTenureFilterProps) {
  const matched =
    filter === "current"
      ? currentCount
      : filter === "ended"
        ? endedCount
        : total;
  const link = (next: TenureFilter | null) => href(basePath, params, next);
  const currentActive = highlight === "current" || filter === "current";
  const endedActive = highlight === "ended" || filter === "ended";
  const currentHref =
    highlight != null ? link("current") : link(toggleTenureFilter(filter, "current"));
  const endedHref =
    highlight != null ? link("ended") : link(toggleTenureFilter(filter, "ended"));

  return (
    <section
      aria-label="Filter current or ended connections"
      className="as-of-rail flex min-w-0 flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Tenure</h3>
        <p className="text-xs tabular-nums text-muted-foreground">
          {matched} of {total} {unit}
        </p>
      </div>

      <div className="as-of-chip-row flex min-w-0 flex-wrap gap-2">
        <Chip
          active={currentActive}
          label={`${CURRENT_MEMBERSHIP_LABEL} — holds-office, no end date stored, cited as-of`}
          to={currentHref}
        >
          <span>{CURRENT_MEMBERSHIP_LABEL}</span>
          <span className="tabular-nums">{currentCount}</span>
        </Chip>
        <Chip
          active={endedActive}
          label={`${ENDED_LABEL} — the cited page printed an end date`}
          to={endedHref}
        >
          <span>{ENDED_LABEL}</span>
          <span className="tabular-nums">{endedCount}</span>
        </Chip>
      </div>

      {filter == null && highlight == null ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Every typed line is shown. Current membership is a{" "}
          <span className="font-medium">holds-office</span> row with{" "}
          {NO_END_STORED} and a cited as-of. An empty end is never labelled
          “current.” {unlabeledCount} career{" "}
          {unlabeledCount === 1 ? "line has" : "lines have"} no end date stored
          and {unlabeledCount === 1 ? "is" : "are"} not current membership
          {unlabeledCount > 0 ? (
            <>
              {" "}
              — listed, not filled, on{" "}
              <Link
                className="underline underline-offset-4 hover:text-foreground"
                href={UNPRINTED_CAREER_HREF}
              >
                the checklist
              </Link>
            </>
          ) : null}
          . <code className="text-[0.7rem]">related</code> stays a mention.
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground">
          <span className="break-words">
            {filter === "current" || highlight === "current"
              ? `Current membership: empty end and a cited as-of on a holds-office row. Empty ends stay “${NO_END_STORED}.”`
              : `Ended: the cited page printed an end date. Missing ends are not filled in.`}
          </span>
          {highlight == null ? (
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={link(null)}
              scroll={false}
            >
              Clear
            </Link>
          ) : (
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={link(null)}
            >
              All connections
            </Link>
          )}
        </p>
      )}

      {filter === "current" && unlabeledCount > 0 ? (
        <p className="text-xs leading-5 text-muted-foreground">
          <Badge className="mr-1.5 font-normal" variant="outline">
            hidden
          </Badge>
          {unlabeledCount} career{" "}
          {unlabeledCount === 1 ? "line has" : "lines have"} no end date stored
          and {unlabeledCount === 1 ? "is" : "are"} not current membership —
          board seats and disclosed holdings stay unlabeled when the page prints
          no end.{" "}
          <Link
            className="underline underline-offset-4 hover:text-foreground"
            href={UNPRINTED_CAREER_HREF}
          >
            Open the checklist
          </Link>
          .
        </p>
      ) : null}
      <LiveFlag of="tenure" />
    </section>
  );
}
