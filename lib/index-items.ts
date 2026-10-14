import type { IndexFacet, IndexItem } from "@/components/entry-index-browser";
import { hrefFor } from "@/lib/content";
import { degree, ledeOrSummary, primaryDate, sourceCount } from "@/lib/entry-facts";
import { dateSortKey, labelize } from "@/lib/format";
import type { Entry } from "@/lib/types";

const UNDATED = "00000000";

function sortableDate(entry: Entry): string {
  switch (entry.kind) {
    case "treaty":
      return entry.signed ? dateSortKey(entry.signed) : UNDATED;
    case "institution":
      return entry.founded ? dateSortKey(entry.founded) : UNDATED;
    case "event":
      return dateSortKey(entry.date);
    case "flow":
      return dateSortKey(entry.year);
    case "player":
      return entry.asOf ? dateSortKey(entry.asOf) : UNDATED;
    default:
      return UNDATED;
  }
}

function dateBadge(entry: Entry): string {
  if (entry.kind === "sector") return labelize(entry.area);
  const fact = primaryDate(entry);
  return `${fact.term} ${fact.value}`;
}

function extraKeywords(entry: Entry): string {
  switch (entry.kind) {
    case "treaty":
      return [entry.type, entry.status, ...entry.topics, ...entry.parties].join(" ");
    case "institution":
      return [entry.type, entry.role, entry.parent].join(" ");
    case "event":
      return entry.type;
    case "sector":
      return entry.area;
    case "flow":
      return entry.year;
    default:
      return [entry.role, entry.playerType].join(" ");
  }
}

export function toIndexItem(
  entry: Entry,
  facets: Record<string, string[]>,
): IndexItem {
  return {
    slug: entry.slug,
    title: entry.title,
    href: hrefFor(entry),
    lead: ledeOrSummary(entry),
    authoredLede: Boolean(entry.lede),
    facets,
    dateKey: sortableDate(entry),
    dateLabel: dateBadge(entry),
    degree: degree(entry),
    sources: sourceCount(entry),
    keywords: extraKeywords(entry),
  };
}

/**
 * A facet with one option filters nothing, so it is dropped rather than
 * shown as a chip that can only ever be on.
 */
export function buildFacet(
  id: string,
  label: string,
  match: "any" | "all",
  values: string[],
): IndexFacet | null {
  const options = [...new Set(values)]
    .filter(Boolean)
    .sort((a, b) => labelize(a).localeCompare(labelize(b), "is"))
    .map((value) => ({ value, label: labelize(value) }));
  if (options.length < 2) return null;
  return { id, label, match, options };
}

export function labelMap(values: string[]): Record<string, string> {
  return Object.fromEntries(
    [...new Set(values)].map((value) => [value, labelize(value)]),
  );
}
