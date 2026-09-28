import { edgesFor } from "@/lib/content";
import { formatDate, labelize } from "@/lib/format";
import type { Entry, Kind } from "@/lib/types";

const URL_PATTERN = /https?:\/\/[^\s)\]<>"']+/g;

/** Section names are plural; a single record needs the singular. */
const KIND_NOUN: Record<Kind, string> = {
  treaty: "Treaty",
  institution: "Institution",
  event: "Event",
  sector: "Sector",
  flow: "Money flow",
  player: "Player",
};

export function kindNoun(kind: Kind): string {
  return KIND_NOUN[kind];
}

export type EntryFact = { term: string; value: string };

/**
 * The one date a reader needs for this kind: when the record was agreed,
 * founded, dated, or last checked on the source page.
 */
export function primaryDate(entry: Entry): EntryFact {
  switch (entry.kind) {
    case "treaty":
      return { term: "Signed", value: formatDate(entry.signed) };
    case "institution":
      return {
        term: "Founded",
        value: entry.founded ? formatDate(entry.founded) : "Not stated",
      };
    case "event":
      return { term: "Date", value: formatDate(entry.date) };
    case "flow":
      return { term: "Year", value: entry.year };
    case "player":
      return {
        term: "As of",
        value: entry.asOf ? formatDate(entry.asOf) : "Not dated",
      };
    default:
      return { term: "Area", value: labelize(entry.area) };
  }
}

/** Distinct source URLs a reader can open from this page: prose plus edges. */
export function sourceCount(entry: Entry): number {
  const urls = new Set<string>();
  for (const markdown of [entry.sources, entry.body]) {
    for (const url of markdown.match(URL_PATTERN) ?? []) {
      urls.add(url.replace(/[.,;]+$/, ""));
    }
  }
  if (entry.kind === "treaty" && entry.source) urls.add(entry.source);
  const { out, inn } = edgesFor(entry.slug);
  for (const edge of [...out, ...inn]) {
    urls.add(edge.source);
    if (edge.programSource) urls.add(edge.programSource);
  }
  return urls.size;
}

/** Typed edges touching this entry, in either direction. */
export function degree(entry: Entry): number {
  const { out, inn } = edgesFor(entry.slug);
  return out.length + inn.length;
}

/**
 * The compact strip under the lede. Every value is either recorded or
 * explicitly "Not stated" — never inferred.
 */
export function factStrip(entry: Entry): EntryFact[] {
  const connections = degree(entry);
  const sources = sourceCount(entry);
  return [
    { term: "Kind", value: kindNoun(entry.kind) },
    primaryDate(entry),
    {
      term: "Connections",
      value: entry.proseOnly
        ? "Prose only · no typed edge"
        : connections === 0
          ? "None typed yet"
          : `${connections} typed ${connections === 1 ? "edge" : "edges"}`,
    },
    {
      term: "Sources",
      value:
        sources === 0
          ? "None recorded"
          : `${sources} ${sources === 1 ? "link" : "links"}`,
    },
  ];
}

/**
 * The sentence that leads a page, a card, a social preview, and a
 * description tag. Authored `lede` wins; the derived summary is the
 * fallback, trimmed so it never runs past a preview box.
 */
export function ledeOrSummary(entry: Entry): string {
  return entry.lede || entry.summary;
}

export function clampSentence(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  if (stop > limit * 0.5) return cut.slice(0, stop + 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : limit).trimEnd()}…`;
}
