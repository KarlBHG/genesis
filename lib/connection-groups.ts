import type { Edge } from "@/lib/types";

export type GroupBy = "from" | "relationship" | "none";

export const GROUP_BY_VIEW: Record<string, GroupBy> = {
  ownership: "none",
  investments: "from",
  authorisations: "from",
  contracts: "from",
  careers: "from",
  spending: "from",
  authority: "relationship",
  trade: "none",
};

export type EdgeGroup = {
  key: string;
  edges: Edge[];
};

export function groupEdges(edges: Edge[], by: GroupBy): EdgeGroup[] {
  if (by === "none") return edges.length > 0 ? [{ key: "", edges }] : [];
  const order: string[] = [];
  const groups = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = by === "from" ? edge.from : edge.relationship;
    const list = groups.get(key);
    if (list) {
      list.push(edge);
    } else {
      groups.set(key, [edge]);
      order.push(key);
    }
  }
  return order.map((key) => ({ key, edges: groups.get(key) ?? [] }));
}
