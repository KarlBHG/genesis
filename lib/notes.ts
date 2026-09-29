import type { Contradiction } from "@/lib/types";

export function tradeValueNote(relationship: string): string | null {
  if (relationship === "imported-from" || relationship === "exported-to") {
    return "The cited 14 May 2025 release names this partner and prints no separate bilateral value; Hagstofa’s monthly country tables are not summed onto this edge.";
  }
  if (relationship === "export-of") {
    return "Commodity export rows use the release table in billion ISK where printed; share-only lines (for example aluminium) do not multiply into ISK here.";
  }
  if (relationship === "import-line-of") {
    return "Commodity import rows use the release table “The value of exports and imports in 2023 and 2024” in billion ISK.";
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
  if (edge.relationship !== "owns") return null;
  const id =
    edge.to === "landsbankinn"
      ? "landsbankinn-shareholder-count"
      : edge.to === "landsvirkjun"
        ? "landsvirkjun-form-and-holding"
        : null;
  if (!id) return null;
  const record = contradictions.find((item) => item.id === id);
  return record?.summary ?? null;
}
