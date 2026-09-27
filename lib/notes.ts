import type { Contradiction } from "@/lib/types";

export function tradeValueNote(relationship: string): string | null {
  if (relationship === "imported-from" || relationship === "exported-to") {
    return "The 14 May 2025 release names this country and prints no separate value. The monthly country table prints separate months and is not added onto this line.";
  }
  return null;
}

export function officeLabel(edge: {
  relationship: string;
  toTitle: string;
  organizationTitle: string | null;
}): string {
  if (edge.relationship === "holds-office" && edge.organizationTitle) {
    return `${edge.toTitle} · ${edge.organizationTitle}`;
  }
  return edge.toTitle;
}

export function ownsRowNote(
  edge: { relationship: string; from: string; to: string },
  contradictions: Contradiction[],
): string | null {
  if (
    edge.relationship !== "owns" ||
    edge.from !== "ministry-of-finance" ||
    edge.to !== "landsbankinn"
  ) {
    return null;
  }
  const record = contradictions.find((item) => item.id === "landsbankinn-shareholder-count");
  return record?.summary ?? null;
}
