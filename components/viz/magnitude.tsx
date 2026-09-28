import { Bar } from "@/components/viz/bar";
import { basisLabel, comparable, printedFigure, widestFigure } from "@/components/viz/money";
import type { EdgeAmount } from "@/lib/types";

/**
 * A list of printed figures, each with the sentence it was read out of. Bars
 * are only drawn when every figure shares a unit and a basis — a hospital
 * invoice in ISK and a budget authorisation in m.kr. do not belong on one
 * scale, and this component will not pretend otherwise.
 *
 * There is no total row. Adding these numbers would produce a figure no cited
 * page prints.
 */
export function Magnitude({
  rows,
  caption,
}: {
  rows: readonly { id: string; label: string; amount: EdgeAmount }[];
  caption?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No figure is printed on the cited pages for these rows.
      </p>
    );
  }
  const amounts = rows.map((row) => row.amount);
  const sameScale = comparable(amounts);
  const max = widestFigure(amounts);
  const first = amounts[0];

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-3">
      <ul className="m-0 flex min-w-0 list-none flex-col gap-3 p-0">
        {rows.map((row) => (
          <li className="min-w-0" key={row.id}>
            {sameScale ? (
              <Bar
                figure={printedFigure(row.amount)}
                label={row.label}
                max={max}
                tone={row.amount.value < 0 ? "credit" : "neutral"}
                value={row.amount.value}
              />
            ) : (
              <div className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm">{row.label}</span>
                <span className="shrink-0 font-mono text-sm tabular-nums">
                  {printedFigure(row.amount)}
                </span>
              </div>
            )}
            <p className="mt-1 text-xs leading-5 text-muted-foreground" lang="is">
              {row.amount.quotation}
            </p>
          </li>
        ))}
      </ul>
      <figcaption className="text-xs leading-5 text-muted-foreground">
        {caption ? `${caption} ` : null}
        {sameScale && first
          ? `Each bar is one printed ${basisLabel(first.basis)} figure, scaled against the largest of them. The figures are not added together.`
          : "These figures were printed in different units or documents, so they are listed rather than compared."}
      </figcaption>
    </figure>
  );
}
