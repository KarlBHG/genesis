import type { EdgeCatalogContext } from "@/lib/edge-contract";
import type { Relationship } from "@/lib/types";

/**
 * Who may stand on one end of a typed edge. A `player` is split into
 * `person` and `organization` the same way the catalog already does.
 * Offices are a separate endpoint kind (they are not catalog slugs).
 */
export const PAIR_KIND_LIST = [
  "person",
  "organization",
  "institution",
  "office",
  "event",
  "treaty",
  "sector",
  "flow",
] as const;

export type PairKind = (typeof PAIR_KIND_LIST)[number];

export type PairSpec = readonly [from: PairKind, to: PairKind];

const BODY = ["institution", "organization"] as const;
const REGULATES_TO = [
  "institution",
  "organization",
  "event",
  "flow",
  "sector",
] as const;

function product(
  from: readonly PairKind[],
  to: readonly PairKind[],
): readonly PairSpec[] {
  return from.flatMap((left) => to.map((right) => [left, right] as const));
}

/**
 * LittleSis-style pair law: each verb names which kinds may stand on
 * each end. Unused-but-intended body pairs stay allowed so a later
 * sourced parent-ministry `regulates` / `appoints` / `owns` row is not
 * an exception. Event-from `regulates` is not intended.
 */
export const PAIR_TYPE_LAW = {
  "holds-office": [["person", "office"]],
  "sits-on-board": [["person", "organization"]],
  appoints: product(BODY, BODY),
  regulates: product(BODY, REGULATES_TO),
  owns: product(BODY, BODY),
  "invests-in": [...product(BODY, BODY), ["person", "organization"]],
  pays: [
    ["institution", "organization"],
    ["organization", "organization"],
  ],
  elects: [
    ["event", "institution"],
    ["institution", "institution"],
  ],
  "sells-power-to": [["organization", "organization"]],
  "export-of": [["flow", "sector"]],
  "import-line-of": [
    ["flow", "flow"],
    ["flow", "sector"],
  ],
  "imported-from": [["flow", "institution"]],
  "exported-to": [["flow", "institution"]],
  "tariff-terms": [["treaty", "sector"]],
  incorporates: [
    ["event", "treaty"],
    ["institution", "treaty"],
  ],
  funds: [
    ["event", "institution"],
    ["flow", "flow"],
    ["flow", "institution"],
    ["flow", "organization"],
    ["flow", "sector"],
    ["institution", "flow"],
    ["institution", "institution"],
    ["institution", "organization"],
    ["organization", "organization"],
  ],
  represents: [
    ["event", "event"],
    ["event", "institution"],
    ["event", "organization"],
    ["event", "treaty"],
    ["institution", "event"],
    ["institution", "institution"],
    ["institution", "treaty"],
    ["organization", "organization"],
    ["organization", "sector"],
    ["treaty", "event"],
  ],
} as const satisfies Record<Relationship, readonly PairSpec[]>;

export type PairTypeEdgeIdentity = {
  from: string;
  relationship: Relationship;
  to: string;
  asOf: string;
  start?: string | null;
  quotation: string;
};

/** Same fields and join as `edgeKey` in `components/connections/connection-edge.ts`. */
export function pairTypeEdgeKey(edge: PairTypeEdgeIdentity): string {
  return [
    edge.from,
    edge.relationship,
    edge.to,
    edge.asOf,
    edge.start ?? "",
    edge.quotation,
  ].join("|");
}

/**
 * Existing illegal pairs, listed by `edgeKey`. Not invented. A new row
 * with the same kinds but a different quotation is not covered.
 */
export const PAIR_TYPE_EXCEPTIONS: readonly string[] = [
  pairTypeEdgeKey({
    from: "landsvirkjun",
    relationship: "appoints",
    to: "hordur-arnarson",
    asOf: "2026-04-21",
    start: null,
    quotation:
      "The Board of Directors appoints the CEO, and the Board and the CEO are responsible for the management of the company. The CEO of Landsvirkjun is Hörður Arnarson, who in collaboration with the Board is responsible for the day to day administration of the company.",
  }),
  pairTypeEdgeKey({
    from: "2008-financial-crisis",
    relationship: "regulates",
    to: "landsbankinn",
    asOf: "2008-10",
    start: null,
    quotation: "Landsbanki and Kaupthing. Though it was unclear if the banks were insolvent,",
  }),
];

const PAIR_TYPE_EXCEPTION_KEYS = new Set(PAIR_TYPE_EXCEPTIONS);

export function pairKindOf(
  slug: string,
  ctx: EdgeCatalogContext,
): PairKind | null {
  if (ctx.offices.has(slug)) return "office";
  const entry = ctx.bySlug.get(slug);
  if (!entry) return null;
  if (entry.kind === "player") {
    return entry.playerType === "person" ? "person" : "organization";
  }
  if (
    entry.kind === "institution" ||
    entry.kind === "event" ||
    entry.kind === "treaty" ||
    entry.kind === "sector" ||
    entry.kind === "flow"
  ) {
    return entry.kind;
  }
  return null;
}

export function pairAllowed(
  relationship: Relationship,
  fromKind: PairKind,
  toKind: PairKind,
): boolean {
  return PAIR_TYPE_LAW[relationship].some(
    ([from, to]) => from === fromKind && to === toKind,
  );
}

export function isListedPairTypeException(edge: PairTypeEdgeIdentity): boolean {
  return PAIR_TYPE_EXCEPTION_KEYS.has(pairTypeEdgeKey(edge));
}

export function pairTypeError(
  where: string,
  relationship: Relationship,
  fromKind: PairKind,
  toKind: PairKind,
): string {
  return `${where} ${relationship} cannot run from ${fromKind} to ${toKind}`;
}

export function leftoverPairTypeKeys(
  edges: readonly PairTypeEdgeIdentity[],
  ctx: EdgeCatalogContext,
): string[] {
  const leftover: string[] = [];
  for (const edge of edges) {
    const fromKind = pairKindOf(edge.from, ctx);
    const toKind = pairKindOf(edge.to, ctx);
    if (!fromKind || !toKind) continue;
    if (!pairAllowed(edge.relationship, fromKind, toKind)) {
      leftover.push(pairTypeEdgeKey(edge));
    }
  }
  return leftover.sort();
}
