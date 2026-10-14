import { labelize, yearOf } from "@/lib/format";
import type { Edge } from "@/lib/types";

export type StripId = "budget" | "power" | "ownership";

export function edgeKey(edge: Edge): string {
  return [edge.from, edge.relationship, edge.to, edge.asOf, edge.start ?? "", edge.quotation].join("|");
}

export function figureOnLine(note: string): string | null {
  const hits = [...note.matchAll(/(\d[\d.,]*)\s*(m\.kr\.|billion ISK)/gi)];
  if (hits.length !== 1) return null;
  const hit = hits[0];
  if (!hit) return null;
  return `${hit[1]} ${hit[2]}`;
}

export function lineLabel(edge: Edge): string {
  const year = yearOf(edge.asOf);
  const parts = [labelize(edge.relationship)];
  if (year !== "Undated") parts.push(year);
  const figure = figureOnLine(edge.quotation);
  if (figure) parts.push(figure);
  return parts.join(" · ");
}

export function stripOf(edge: Edge): StripId | "other" {
  if (edge.relationship === "funds") return "budget";
  if (edge.relationship === "sells-power-to") return "power";
  if (
    edge.from === "ministry-of-finance" &&
    edge.to === "landsvirkjun" &&
    edge.relationship === "appoints"
  ) {
    return "power";
  }
  if (edge.from === "landsvirkjun" && edge.to === "hordur-arnarson") return "power";
  if (edge.from === "aluminium-exports-2024" && edge.to === "power-and-aluminium") {
    return "power";
  }
  if (edge.relationship === "invests-in" || edge.relationship === "owns") return "ownership";
  if (edge.from === "financial-supervisory-authority" && edge.relationship === "regulates") {
    return "ownership";
  }
  if (edge.from === "sedlabanki" && edge.to === "arion-banki") return "ownership";
  return "other";
}

const OWNERSHIP_RANK = [
  "financial-supervisory-authority",
  "bru",
  "birta",
  "lsr",
  "stapi",
  "arion-banki",
  "islandsbanki",
  "sedlabanki",
  "ministry-of-finance",
  "reykjavikurborg",
];

export function sortStripEdges(edges: Edge[], strip: StripId | "other"): Edge[] {
  return edges.slice().sort((a, b) => {
    if (strip === "budget") {
      const aHealth = a.asOf.startsWith("2024") ? 0 : 1;
      const bHealth = b.asOf.startsWith("2024") ? 0 : 1;
      if (aHealth !== bHealth) return aHealth - bHealth;
    }
    if (strip === "ownership") {
      const aRank = OWNERSHIP_RANK.indexOf(a.from);
      const bRank = OWNERSHIP_RANK.indexOf(b.from);
      const aOrder = aRank === -1 ? OWNERSHIP_RANK.length : aRank;
      const bOrder = bRank === -1 ? OWNERSHIP_RANK.length : bRank;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    const from = a.fromTitle.localeCompare(b.fromTitle, "en");
    if (from !== 0) return from;
    const to = a.toTitle.localeCompare(b.toTitle, "en");
    if (to !== 0) return to;
    return a.asOf.localeCompare(b.asOf);
  });
}
