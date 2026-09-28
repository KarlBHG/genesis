import { getEdges } from "@/lib/content";
import type { Flow } from "@/lib/types";

export const CONTRACT_RELATIONSHIPS = new Set([
  "sells-power-to",
  "export-of",
  "import-line-of",
]);

/** Power-sales flow page is the contract record even when it is not an endpoint. */
const CONTRACT_FLOW_SLUGS = new Set(["landsvirkjun-power-sales"]);

export function isContractRelationship(relationship: string): boolean {
  return CONTRACT_RELATIONSHIPS.has(relationship);
}

export function flowTouchesContract(slug: string): boolean {
  if (CONTRACT_FLOW_SLUGS.has(slug)) return true;
  return getEdges().some(
    (edge) =>
      CONTRACT_RELATIONSHIPS.has(edge.relationship) &&
      (edge.from === slug || edge.to === slug),
  );
}

export function partitionOtherFlows(flows: Flow[]): {
  contracts: Flow[];
  other: Flow[];
} {
  const contracts: Flow[] = [];
  const other: Flow[] = [];
  for (const flow of flows) {
    if (flowTouchesContract(flow.slug)) contracts.push(flow);
    else other.push(flow);
  }
  return { contracts, other };
}
