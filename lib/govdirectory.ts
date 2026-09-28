import ledgerJson from "@/data/govdirectory-iceland.json";
import { getCatalog, hrefFor } from "@/lib/content";
import { PUBLIC_ENTITY_INVENTORY } from "@/lib/public-entities";

export type GovdirectoryMatchKind =
  | "same-name"
  | "name-variant"
  | "grouped"
  | "unmatched";

export type GovdirectoryRow = {
  name: string;
  wikidataId?: string;
  slug: string | null;
  matchKind: GovdirectoryMatchKind;
  note?: string;
};

export type GovdirectoryClass = {
  id: string;
  label: string;
  sourceClass: string;
  rows: GovdirectoryRow[];
};

export type GovdirectorySnapshot = {
  source: string;
  wikidataProject: string;
  license: string;
  retrieved: string;
  govdirectoryUpdated: string;
  note: string;
  classes: GovdirectoryClass[];
};

export const GOVDIRECTORY_ICELAND = ledgerJson as GovdirectorySnapshot;

export type GovdirectoryLedgerRow = GovdirectoryRow & {
  href: string | null;
  inInventory: boolean;
  wikidataHref: string | null;
};

export type GovdirectoryClassSummary = {
  id: string;
  label: string;
  sourceClass: string;
  total: number;
  matched: number;
  grouped: number;
  unmatched: number;
  rows: GovdirectoryLedgerRow[];
};

function wikidataHref(id: string | undefined): string | null {
  if (!id) return null;
  return `https://www.wikidata.org/wiki/${id}`;
}

export function getGovdirectoryLedger(
  snapshot: GovdirectorySnapshot = GOVDIRECTORY_ICELAND,
): GovdirectoryClassSummary[] {
  const catalog = getCatalog();
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const inventorySlugs = new Set(PUBLIC_ENTITY_INVENTORY.map((row) => row.slug));

  return snapshot.classes.map((group) => {
    const rows: GovdirectoryLedgerRow[] = group.rows.map((row) => {
      const entry = row.slug ? bySlug.get(row.slug) : undefined;
      return {
        ...row,
        href: entry ? hrefFor(entry) : null,
        inInventory: row.slug != null && inventorySlugs.has(row.slug),
        wikidataHref: wikidataHref(row.wikidataId),
      };
    });
    return {
      id: group.id,
      label: group.label,
      sourceClass: group.sourceClass,
      total: rows.length,
      matched: rows.filter((row) => row.matchKind !== "unmatched").length,
      grouped: rows.filter((row) => row.matchKind === "grouped").length,
      unmatched: rows.filter((row) => row.matchKind === "unmatched").length,
      rows,
    };
  });
}
