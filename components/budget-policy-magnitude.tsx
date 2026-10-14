import Link from "next/link";

import { Magnitude, PolicyTreemap } from "@/components/viz";
import { policyAreaMagnitudeRows } from "@/lib/budget-magnitude";

export function BudgetPolicyMagnitude() {
  const rows = policyAreaMagnitudeRows();
  if (rows.length === 0) return null;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex max-w-reading flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">2026 authorisations by policy area</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Each bar is one printed{" "}
          <span lang="is">Heildar-fjárheimild</span> line from Article 4 for that málefnasvið.
          Where several ministries fund the same area, the largest single printed line is shown
          here; the area page lists every line. These figures are not added together.
        </p>
      </div>
      <PolicyTreemap
        cells={rows.map((row) => ({
          id: row.id,
          label: row.label,
          href: row.href,
          amount: row.amount,
        }))}
      />
      <Magnitude
        caption="Authorisations in m.kr. from the 2026 budget law."
        rows={rows.map((row) => ({
          id: row.id,
          label: row.label,
          amount: row.amount,
        }))}
      />
      <ul className="flex flex-wrap gap-2 text-sm">
        {rows.slice(0, 8).map((row) => (
          <li key={row.id}>
            <Link className="underline underline-offset-4" href={row.href}>
              {row.label}
            </Link>
          </li>
        ))}
        {rows.length > 8 ? (
          <li className="text-muted-foreground">+ {rows.length - 8} more in the list below</li>
        ) : null}
      </ul>
    </section>
  );
}
