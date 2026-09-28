import { scaleLinear } from "d3-scale";

import { printedFigure } from "@/components/viz/money";
import type { EdgeAmount } from "@/lib/types";

export type TreemapCell = {
  id: string;
  label: string;
  href: string;
  amount: EdgeAmount;
};

/**
 * Proportional tiles by printed authorisation. Widths share one scale; heights
 * are equal. No total is shown or computed.
 */
export function PolicyTreemap({ cells }: { cells: readonly TreemapCell[] }) {
  if (cells.length === 0) return null;
  const max = Math.max(...cells.map((cell) => cell.amount.value));
  const widthScale = scaleLinear()
    .domain([0, max])
    .range([8, 100])
    .clamp(true);

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2">
      <div
        className="flex min-h-16 w-full flex-wrap items-stretch gap-1"
        role="list"
      >
        {cells.map((cell) => (
          <a
            className="flex min-w-[4.5rem] flex-col justify-end rounded-md border border-border/80 bg-muted/40 px-2 py-1.5 text-left transition-colors hover:bg-muted/70"
            href={cell.href}
            key={cell.id}
            role="listitem"
            style={{ flexGrow: widthScale(cell.amount.value), flexBasis: "4rem" }}
            title={cell.label}
          >
            <span className="line-clamp-2 text-[11px] leading-tight">{cell.label}</span>
            <span className="mt-1 font-mono text-xs tabular-nums">
              {printedFigure(cell.amount)}
            </span>
          </a>
        ))}
      </div>
      <figcaption className="text-xs leading-5 text-muted-foreground">
        Tile width follows each printed authorisation on its own scale. These
        authorisations are not added together.
      </figcaption>
    </figure>
  );
}
