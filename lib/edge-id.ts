import type { Edge } from "@/lib/types";

/** Compact identity for permalinks. Same fields as `edgeKey`. */
export type EdgeIdentity = Pick<
  Edge,
  "from" | "relationship" | "to" | "asOf" | "start" | "quotation"
>;

/**
 * cyrb53, public domain hash used so a connection URL is short and
 * isomorphic (no Node `crypto` in client components).
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function edgeId(edge: EdgeIdentity): string {
  const key = [
    edge.from,
    edge.relationship,
    edge.to,
    edge.asOf,
    edge.start ?? "",
    edge.quotation,
  ].join("\u001f");
  return `${cyrb53(key).toString(36)}${cyrb53(key, 1).toString(36)}`;
}

export function edgeHref(edge: EdgeIdentity): string {
  return `/connections/${edgeId(edge)}`;
}

export function findEdgeById<T extends EdgeIdentity>(
  id: string,
  edges: readonly T[],
): T | undefined {
  return edges.find((edge) => edgeId(edge) === id);
}
