import identitiesJson from "@/data/identities.json";
import {
  normalizeOpnirName,
  parseLedgerQuotation,
  uniqueNameMatch,
  type OpnirNameHint,
} from "@/lib/opnir-feed";
import { isHttpUrl } from "@/lib/safe-href";
import type { Edge } from "@/lib/types";

export const IDENTITY_STATUSES = ["sitting", "unmatched", "refused"] as const;
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];

export const IDENTITY_STATUS_LABELS: Record<IdentityStatus, string> = {
  sitting: "Sitting",
  unmatched: "Unmatched",
  refused: "Refused",
};

export type PrintedHeadingIdentity = {
  id: string;
  printedHeading: string;
  /** Catalog slug the heading currently sits on. Null when unmatched. */
  catalogSlug: string | null;
  role: "from" | "to";
  status: IdentityStatus;
  source: string;
  quotation: string;
  asOf: string;
};

export type IdentityCatalogHint = OpnirNameHint & { title: string };

const STATUSES = new Set<string>(IDENTITY_STATUSES);

export const PRINTED_HEADING_IDENTITIES =
  identitiesJson as PrintedHeadingIdentity[];

function isRole(value: unknown): value is PrintedHeadingIdentity["role"] {
  return value === "from" || value === "to";
}

export function identityKey(row: Pick<PrintedHeadingIdentity, "printedHeading" | "role" | "catalogSlug">): string {
  return [
    normalizeOpnirName(row.printedHeading),
    row.role,
    row.catalogSlug ?? "",
  ].join("\u001f");
}

export function assertPrintedHeadingIdentity(
  row: PrintedHeadingIdentity,
  catalogSlugs: ReadonlySet<string>,
): void {
  if (!row.id.trim()) throw new Error("identity is missing id");
  if (!row.printedHeading.trim()) {
    throw new Error(`${row.id} is missing printedHeading`);
  }
  if (!STATUSES.has(row.status)) {
    throw new Error(`${row.id} status "${row.status}" is not sitting/unmatched/refused`);
  }
  if (!isRole(row.role)) {
    throw new Error(`${row.id} role must be from or to`);
  }
  if (!row.quotation.includes(row.printedHeading)) {
    throw new Error(`${row.id} quotation does not print the heading`);
  }
  if (!isHttpUrl(row.source)) {
    throw new Error(`${row.id} source must be an http(s) address`);
  }
  if (!row.asOf.trim()) throw new Error(`${row.id} is missing asOf`);

  if (row.status === "unmatched") {
    if (row.catalogSlug != null) {
      throw new Error(`${row.id} unmatched identity cannot sit on a catalog slug`);
    }
    return;
  }

  if (!row.catalogSlug?.trim()) {
    throw new Error(`${row.id} ${row.status} identity needs a catalogSlug`);
  }
  if (!catalogSlugs.has(row.catalogSlug)) {
    throw new Error(`${row.id} catalogSlug "${row.catalogSlug}" does not exist`);
  }
}

/**
 * When a printed Opnir heading uniquely matches a different catalog title than
 * the slug the `pays` row sits on, an identity statement must exist. The row
 * is not re-parented here. Unmatched headings stay unmatched.
 */
export function assertPrintedHeadingIdentities(
  identities: readonly PrintedHeadingIdentity[],
  edges: readonly Edge[],
  names: readonly IdentityCatalogHint[],
): void {
  const catalogSlugs = new Set(names.map((name) => name.id));
  const seenIds = new Set<string>();
  const byKey = new Map<string, PrintedHeadingIdentity>();

  for (const row of identities) {
    assertPrintedHeadingIdentity(row, catalogSlugs);
    if (seenIds.has(row.id)) throw new Error(`duplicate identity id ${row.id}`);
    seenIds.add(row.id);
    byKey.set(identityKey(row), row);
  }

  for (const [index, edge] of edges.entries()) {
    if (edge.relationship !== "pays") continue;
    const parsed = parseLedgerQuotation(edge.quotation);
    if (!parsed) continue;

    for (const [printed, slug, role] of [
      [parsed.buyer, edge.from, "from"],
      [parsed.vendor, edge.to, "to"],
    ] as const) {
      const unique = uniqueNameMatch(printed, names);
      if (!unique || unique === slug) continue;
      const key = identityKey({
        printedHeading: printed,
        role,
        catalogSlug: slug,
      });
      const statement = byKey.get(key);
      if (!statement || statement.status !== "sitting") {
        throw new Error(
          `data/edges.json edge ${index + 1} prints "${printed}" on ${slug} ` +
            `but the unique catalog title match is ${unique}. ` +
            `Add a sitting identity statement before re-parenting.`,
        );
      }
    }
  }
}

export function identityForPaysEdge(
  edge: Pick<Edge, "relationship" | "from" | "to" | "quotation">,
  identities: readonly PrintedHeadingIdentity[] = PRINTED_HEADING_IDENTITIES,
): PrintedHeadingIdentity | null {
  if (edge.relationship !== "pays") return null;
  const parsed = parseLedgerQuotation(edge.quotation);
  if (!parsed) return null;
  return (
    identities.find(
      (row) =>
        row.status !== "unmatched" &&
        normalizeOpnirName(row.printedHeading) ===
          normalizeOpnirName(row.role === "to" ? parsed.vendor : parsed.buyer) &&
        row.catalogSlug === (row.role === "to" ? edge.to : edge.from),
    ) ?? null
  );
}

export function uniqueMatchForHeading(
  printedHeading: string,
  names: readonly OpnirNameHint[],
): string | null {
  return uniqueNameMatch(printedHeading, names);
}
