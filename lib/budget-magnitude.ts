import { getBySlug, getEdges, getPolicyAreas, hrefFor } from "@/lib/content";
import type { EdgeAmount } from "@/lib/types";

export type PolicyAreaMagnitudeRow = {
  id: string;
  label: string;
  href: string;
  amount: EdgeAmount;
};

/**
 * One printed authorisation per policy area: the largest single
 * Heildar-fjárheimild line on file for that slug. Rows are not summed.
 */
export function policyAreaMagnitudeRows(): PolicyAreaMagnitudeRow[] {
  const areas = getPolicyAreas();
  const bySlug = new Map<string, PolicyAreaMagnitudeRow>();

  for (const edge of getEdges()) {
    if (
      edge.relationship !== "funds" ||
      !edge.to.startsWith("policy-area-") ||
      !edge.amount
    ) {
      continue;
    }
    const entry = getBySlug(edge.to);
    const label = entry?.title ?? edge.toTitle;
    const href = entry ? hrefFor(entry) : `/money/${edge.to}`;
    const existing = bySlug.get(edge.to);
    if (!existing || edge.amount.value > existing.amount.value) {
      bySlug.set(edge.to, { id: edge.to, label, href, amount: edge.amount });
    }
  }

  const order = new Map(areas.map((area, index) => [area.slug, index]));
  return [...bySlug.values()].sort(
    (a, b) =>
      (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999) ||
      b.amount.value - a.amount.value,
  );
}
