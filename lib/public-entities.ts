import inventoryJson from "@/data/public-entity-inventory.json";
import { getCatalog, getEdges, getOffices, hrefFor } from "@/lib/content";
import { MAP_ENTRIES } from "@/lib/geo-map";

export type PublicEntityCategory =
  | "state"
  | "agencies-regulators"
  | "courts"
  | "universities"
  | "municipalities"
  | "public-companies-funds"
  | "political-parties";

export type MapMode = "mapped" | "office-only";

export type PublicEntityInventoryRow = {
  slug: string;
  category: PublicEntityCategory;
  mapMode: MapMode;
};

export const PUBLIC_ENTITY_CATEGORIES: PublicEntityCategory[] = [
  "state",
  "agencies-regulators",
  "courts",
  "universities",
  "municipalities",
  "public-companies-funds",
  "political-parties",
];

export const PUBLIC_ENTITY_CATEGORY_LABELS: Record<PublicEntityCategory, string> = {
  state: "State",
  "agencies-regulators": "Agencies and regulators",
  courts: "Courts",
  universities: "Universities",
  municipalities: "Municipalities",
  "public-companies-funds": "Public companies and funds",
  "political-parties": "Political parties",
};

export const PUBLIC_ENTITY_INVENTORY =
  inventoryJson as PublicEntityInventoryRow[];

export type PublicEntityCoverageRow = PublicEntityInventoryRow & {
  title: string;
  href: string | null;
  inCatalog: boolean;
  mapped: boolean;
  directTypedLinks: number;
  officeLinks: number;
  officeLinked: boolean;
  typedLinkage: boolean;
};

function officeLinksFor(
  slug: string,
  edges: ReturnType<typeof getEdges>,
  offices: ReturnType<typeof getOffices>,
): number {
  const officeIds = offices
    .filter((office) => office.organization === slug)
    .map((office) => office.id);
  if (officeIds.length === 0) return 0;
  return edges.filter((edge) => officeIds.includes(edge.from) || officeIds.includes(edge.to))
    .length;
}

function fallbackTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPublicEntityCoverage(): PublicEntityCoverageRow[] {
  const catalog = getCatalog();
  const edges = getEdges();
  const offices = getOffices();
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  const mapSlugs = new Set(MAP_ENTRIES.map((row) => row.slug));

  return PUBLIC_ENTITY_INVENTORY.map((row) => {
    const entry = bySlug.get(row.slug);
    const directTypedLinks = edges.filter(
      (edge) => edge.from === row.slug || edge.to === row.slug,
    ).length;
    const officeLinks = officeLinksFor(row.slug, edges, offices);
    return {
      ...row,
      title: entry?.title ?? fallbackTitle(row.slug),
      href: entry ? hrefFor(entry) : null,
      inCatalog: Boolean(entry),
      mapped: mapSlugs.has(row.slug),
      directTypedLinks,
      officeLinks,
      officeLinked: officeLinks > 0,
      typedLinkage: directTypedLinks > 0 || officeLinks > 0,
    };
  }).sort((left, right) => {
    if (left.category !== right.category) {
      return (
        PUBLIC_ENTITY_CATEGORIES.indexOf(left.category) -
        PUBLIC_ENTITY_CATEGORIES.indexOf(right.category)
      );
    }
    return left.title.localeCompare(right.title, "is");
  });
}

export type PublicEntityCategorySummary = {
  category: PublicEntityCategory;
  total: number;
  mapped: number;
  typedLinked: number;
  officeLinked: number;
};

export function summarizePublicEntityCoverage(
  rows: PublicEntityCoverageRow[] = getPublicEntityCoverage(),
): PublicEntityCategorySummary[] {
  return PUBLIC_ENTITY_CATEGORIES.map((category) => {
    const grouped = rows.filter((row) => row.category === category);
    return {
      category,
      total: grouped.length,
      mapped: grouped.filter((row) => row.mapped).length,
      typedLinked: grouped.filter((row) => row.typedLinkage).length,
      officeLinked: grouped.filter((row) => row.officeLinked).length,
    };
  });
}
