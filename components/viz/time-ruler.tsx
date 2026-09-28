import { scaleTime } from "d3-scale";

import { classifyAsOfBucket } from "@/lib/as-of";
import { formatDate } from "@/lib/format";

export type TimeMark = {
  id: string;
  label: string;
  /** An `asOf`, `start`, `date`, or `year` string straight off the record. */
  at: string;
  href?: string;
};

/**
 * A dated record placed on the ruler, or the reason it could not be placed.
 * Undated and statute-dated records are never given an invented position.
 */
type Placed = { mark: TimeMark; at: Date };

function toDate(value: string): Date | null {
  const bucket = classifyAsOfBucket(value);
  if (bucket === "undated" || bucket === "statute") return null;
  const iso = value.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!iso) {
    const year = value.match(/^(\d{4})/);
    return year ? new Date(Date.UTC(Number(year[1]), 0, 1)) : null;
  }
  return new Date(
    Date.UTC(Number(iso[1]), iso[2] ? Number(iso[2]) - 1 : 0, iso[3] ? Number(iso[3]) : 1),
  );
}

/**
 * A horizontal date axis with one tick per record. Server-rendered — d3 only
 * supplies the scale, so there is nothing to hydrate.
 *
 * Records the sources left undated stay off the axis and are counted instead,
 * so a reader can see what the ruler is not showing.
 */
export function TimeRuler({
  marks,
  label,
}: {
  marks: readonly TimeMark[];
  label: string;
}) {
  const placed: Placed[] = [];
  const unplaced: TimeMark[] = [];
  for (const mark of marks) {
    const at = toDate(mark.at);
    if (at) placed.push({ mark, at });
    else unplaced.push(mark);
  }
  placed.sort((a, b) => a.at.getTime() - b.at.getTime());

  const first = placed[0];
  const last = placed[placed.length - 1];
  if (!first || !last) {
    return (
      <p className="text-sm text-muted-foreground">
        None of these {marks.length} records carry a date that can be placed on a
        ruler.
      </p>
    );
  }

  const singleDay = first.at.getTime() === last.at.getTime();
  const scale = scaleTime()
    .domain(singleDay ? [first.at, new Date(first.at.getTime() + 86_400_000)] : [first.at, last.at])
    .range([0, 100]);

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2">
      <div
        aria-label={label}
        className="relative h-9 w-full"
        role="img"
      >
        <div className="absolute inset-x-0 top-4 h-px bg-[var(--viz-axis)]" />
        {placed.map(({ mark, at }) => (
          <span
            className="absolute top-4 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--viz-bar)]"
            key={mark.id}
            style={{ left: `${singleDay ? 0 : scale(at)}%` }}
            title={`${mark.label} · ${formatDate(mark.at)}`}
          />
        ))}
        <span className="absolute top-6 left-0 text-[0.6875rem] text-muted-foreground">
          {formatDate(first.mark.at)}
        </span>
        <span className="absolute top-6 right-0 text-[0.6875rem] text-muted-foreground">
          {formatDate(last.mark.at)}
        </span>
      </div>
      {unplaced.length > 0 ? (
        <figcaption className="text-xs leading-5 text-muted-foreground">
          {unplaced.length} of {marks.length} records are undated or carry a
          statute date, so they are not on the ruler.
        </figcaption>
      ) : null}
    </figure>
  );
}
