import { classifyAsOfBucket, type AsOfBucket } from "@/lib/as-of";
import { retrievalCaveat, type RetrievalCaveatKind } from "@/lib/provenance";
import type { Edge } from "@/lib/types";

/**
 * The six fields `data/edges.json` refuses to load a row without. The loader in
 * `lib/content.ts` enforces them; this list is what the reader is shown, and a
 * contract test keeps the two from drifting apart.
 */
export const REQUIRED_EDGE_FIELDS = [
  {
    name: "from",
    title: "Who or what the sentence starts at",
    detail:
      "A catalogued record or a public office, by slug. A name that has no record cannot appear on one side of a connection, which is why vendors and countries sometimes stay off the graph.",
  },
  {
    name: "to",
    title: "Who or what it lands on",
    detail:
      "Same rule. Both endpoints must already exist, so the graph cannot invent a party to make a story join up.",
  },
  {
    name: "type",
    title: "Which relationship it is",
    detail:
      "One of the allowlisted relationship types, and only between the kinds of records that type may join. There is no generic “linked to”, and a relationship is not minted to fit a single page.",
  },
  {
    name: "asOf",
    title: "What the page says about when",
    detail:
      "Stored as the page prints it — a full date, a year, a span, a consolidated statute, or an explicit note that the page carries no date. It is never back-filled with the day the page was read.",
  },
  {
    name: "source",
    title: "The address it was read at",
    detail:
      "One address per row. Where the address only serves a script shell or answered with a bot check, the row says so instead of pretending the text was static.",
  },
  {
    name: "quotation",
    title: "The sentence itself",
    detail:
      "The words on the page, in the language the page uses. If a claim cannot be carried by a sentence someone else can go and read, it is not stored.",
  },
] as const;

export const AS_OF_BUCKET_ORDER: readonly AsOfBucket[] = [
  "iso",
  "year",
  "statute",
  "undated",
] as const;

export type MethodologyStats = {
  edges: number;
  relationshipTypes: number;
  buckets: Record<AsOfBucket, number>;
  caveats: Record<RetrievalCaveatKind, number>;
  caveatTotal: number;
};

export function methodologyStats(edges: readonly Edge[]): MethodologyStats {
  const buckets: Record<AsOfBucket, number> = {
    iso: 0,
    year: 0,
    statute: 0,
    undated: 0,
  };
  const caveats: Record<RetrievalCaveatKind, number> = {
    pdf: 0,
    "script-shell": 0,
    "bot-check": 0,
  };
  const types = new Set<string>();
  let caveatTotal = 0;
  for (const edge of edges) {
    buckets[classifyAsOfBucket(edge.asOf.trim())] += 1;
    types.add(edge.relationship);
    const caveat = retrievalCaveat(edge.source);
    if (caveat) {
      caveats[caveat.kind] += 1;
      caveatTotal += 1;
    }
  }
  return {
    edges: edges.length,
    relationshipTypes: types.size,
    buckets,
    caveats,
    caveatTotal,
  };
}
