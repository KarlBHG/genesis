import { scaleLinear } from "d3-scale";

/**
 * One horizontal bar, drawn to a caller-supplied domain. Server-rendered: the
 * width is computed here, not in the browser.
 *
 * `max` must be a figure some cited page prints (see `widestFigure`), never a
 * total this app worked out for itself.
 */
export function Bar({
  value,
  max,
  label,
  figure,
  tone = "neutral",
}: {
  value: number;
  max: number;
  /** Read out to assistive tech in place of the bar itself. */
  label: string;
  /** The figure as printed, shown beside the bar. */
  figure?: string;
  tone?: "neutral" | "credit";
}) {
  const scale = scaleLinear().domain([0, max || 1]).range([0, 100]).clamp(true);
  const width = scale(Math.abs(value));
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm">{label}</span>
        {figure ? (
          <span className="shrink-0 font-mono text-sm tabular-nums">{figure}</span>
        ) : null}
      </div>
      <div
        aria-label={figure ? `${label}: ${figure}` : label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--viz-track)]"
        role="img"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background:
              tone === "credit" ? "var(--viz-credit)" : "var(--viz-bar)",
          }}
        />
      </div>
    </div>
  );
}
