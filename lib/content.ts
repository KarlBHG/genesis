import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";

import { kindPath } from "@/lib/format";
import type {
  Connection,
  Edge,
  Entry,
  Flow,
  Institution,
  Kind,
  MapEvent,
  Player,
  Relationship,
  SearchDoc,
  Sector,
  Treaty,
} from "@/lib/types";

const ROOT = path.join(process.cwd(), "content");

const RELATIONSHIPS = new Set<Relationship>([
  "owns",
  "regulates",
  "appoints",
  "sells-power-to",
  "represents",
  "funds",
  "export-of",
  "import-line-of",
  "tariff-terms",
  "invests-in",
]);

const FOLDERS: { folder: string; kind: Kind }[] = [
  { folder: "treaties", kind: "treaty" },
  { folder: "institutions", kind: "institution" },
  { folder: "events", kind: "event" },
  { folder: "business", kind: "sector" },
  { folder: "money", kind: "flow" },
  { folder: "players", kind: "player" },
];

function requireString(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${file} is missing frontmatter "${key}"`);
  }
  return value.trim();
}

function optionalString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new Error(`Frontmatter "${key}" must be a string`);
  }
  return value.trim();
}

function stringArray(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string[] {
  const value = data[key];
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${file} frontmatter "${key}" must be a list of strings`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function connectionsOf(data: Record<string, unknown>, file: string): Connection[] {
  const value = data.connections;
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${file} frontmatter "connections" must be a list`);
  }
  return value.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${file} connection ${index + 1} must be a mapping`);
    }
    const row = item as Record<string, unknown>;
    const relationship = requireString(row, "relationship", file);
    if (!RELATIONSHIPS.has(relationship as Relationship)) {
      throw new Error(
        `${file} connection ${index + 1} has unknown relationship "${relationship}"`,
      );
    }
    return {
      to: requireString(row, "to", file),
      relationship: relationship as Relationship,
      source: requireString(row, "source", file),
      note: requireString(row, "note", file),
      asOf: optionalString(row, "asOf"),
    };
  });
}

function stripTitle(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, "").trim();
}

function splitSources(markdown: string): { body: string; sources: string } {
  const match = markdown.match(/\n(?:## Sources|\*\*Sources:\*\*)\s*\n/);
  if (!match || match.index == null) {
    return { body: markdown.trim(), sources: "" };
  }
  return {
    body: markdown.slice(0, match.index).trim(),
    sources: markdown.slice(match.index + match[0].length).trim(),
  };
}

function summaryFrom(body: string): string {
  const marked = body.match(/## Summary\s+([\s\S]*?)(?=\n## |\s*$)/);
  const source = (marked?.[1] ?? body).replace(/^#{1,6}\s+.+$/gm, "").trim();
  const paragraph = source
    .split(/\n\n+/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("-") && !part.startsWith("*"));
  return (paragraph ?? "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function plainBody(markdown: string): string {
  return markdown
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readEntry(filePath: string, kind: Kind): Entry {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const file = path.relative(ROOT, filePath);
  const slug = requireString(data, "slug", file);
  const filename = path.basename(filePath, ".md");
  if (slug !== filename) {
    throw new Error(`${file} slug "${slug}" does not match the filename`);
  }

  const split = splitSources(stripTitle(parsed.content.trim()));
  const summary = summaryFrom(split.body);
  const title = requireString(data, "title", file);
  const related = stringArray(data, "related", file);
  const connections = connectionsOf(data, file);
  const shared = {
    title,
    slug,
    related,
    connections,
    body: split.body,
    sources: split.sources,
    summary,
  };

  if (kind === "treaty") {
    const treaty: Treaty = {
      kind,
      ...shared,
      type: requireString(data, "type", file),
      signed: requireString(data, "signed", file),
      effective: optionalString(data, "effective"),
      parties: stringArray(data, "parties", file),
      status: requireString(data, "status", file),
      topics: stringArray(data, "topics", file),
      source: requireString(data, "source", file),
    };
    return treaty;
  }

  if (kind === "institution") {
    const institution: Institution = {
      kind,
      ...shared,
      type: requireString(data, "type", file),
      founded: optionalString(data, "founded"),
      role: requireString(data, "role", file),
      parent: optionalString(data, "parent"),
      website: optionalString(data, "website"),
    };
    return institution;
  }

  if (kind === "event") {
    const event: MapEvent = {
      kind,
      ...shared,
      date: requireString(data, "date", file),
      type: requireString(data, "type", file),
    };
    return event;
  }

  if (kind === "sector") {
    const sector: Sector = {
      kind,
      ...shared,
      area: requireString(data, "area", file),
    };
    return sector;
  }

  if (kind === "flow") {
    const flow: Flow = {
      kind,
      ...shared,
      year: requireString(data, "year", file),
    };
    return flow;
  }

  const playerType = requireString(data, "playerType", file);
  if (playerType !== "organization" && playerType !== "person") {
    throw new Error(`${file} playerType must be "organization" or "person"`);
  }
  const player: Player = {
    kind: "player",
    ...shared,
    playerType,
    role: requireString(data, "role", file),
    asOf: optionalString(data, "asOf"),
    website: optionalString(data, "website"),
  };
  return player;
}

export const getCatalog = cache((): Entry[] => {
  const entries: Entry[] = [];
  for (const { folder, kind } of FOLDERS) {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      entries.push(readEntry(path.join(dir, name), kind));
    }
  }
  const slugs = new Set(entries.map((entry) => entry.slug));
  for (const entry of entries) {
    for (const connection of entry.connections) {
      if (!slugs.has(connection.to)) {
        throw new Error(
          `${entry.slug} connection points at missing slug "${connection.to}"`,
        );
      }
      if (connection.to === entry.slug) {
        throw new Error(`${entry.slug} connection points at itself`);
      }
    }
  }
  return entries;
});

export function getBySlug(slug: string): Entry | undefined {
  return getCatalog().find((entry) => entry.slug === slug);
}

export function getTreaties(): Treaty[] {
  return getCatalog().filter((entry): entry is Treaty => entry.kind === "treaty");
}

export function getInstitutions(): Institution[] {
  return getCatalog().filter(
    (entry): entry is Institution => entry.kind === "institution",
  );
}

export function getEvents(): MapEvent[] {
  return getCatalog().filter((entry): entry is MapEvent => entry.kind === "event");
}

export function getSectors(): Sector[] {
  return getCatalog().filter((entry): entry is Sector => entry.kind === "sector");
}

export function getFlows(): Flow[] {
  return getCatalog().filter((entry): entry is Flow => entry.kind === "flow");
}

export function getPlayers(): Player[] {
  return getCatalog().filter((entry): entry is Player => entry.kind === "player");
}

export function hrefFor(entry: Entry): string {
  return `${kindPath(entry.kind)}/${entry.slug}`;
}

export function resolveSlug(slug: string): { title: string; href: string } | null {
  const entry = getBySlug(slug);
  if (!entry) return null;
  return { title: entry.title, href: hrefFor(entry) };
}

export function getEdges(): Edge[] {
  const entries = getCatalog();
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const edges: Edge[] = [];
  for (const entry of entries) {
    for (const connection of entry.connections) {
      const target = bySlug.get(connection.to);
      if (!target) continue;
      edges.push({
        from: entry.slug,
        fromTitle: entry.title,
        to: connection.to,
        toTitle: target.title,
        relationship: connection.relationship,
        source: connection.source,
        note: connection.note,
        asOf: connection.asOf,
      });
    }
  }
  return edges;
}

export function edgesFor(slug: string): { out: Edge[]; inn: Edge[] } {
  const edges = getEdges();
  return {
    out: edges.filter((edge) => edge.from === slug),
    inn: edges.filter((edge) => edge.to === slug),
  };
}

export function toSearchDocs(entries: Entry[] = getCatalog()): SearchDoc[] {
  return entries.map((entry) => ({
    title: entry.title,
    slug: entry.slug,
    kind: entry.kind,
    href: hrefFor(entry),
    summary: entry.summary,
    topics:
      entry.kind === "treaty"
        ? entry.topics
        : entry.kind === "institution"
          ? [entry.role]
          : entry.kind === "sector"
            ? [entry.area]
            : entry.kind === "flow"
              ? [entry.year]
              : entry.kind === "player"
                ? [entry.role, entry.playerType]
                : [entry.type],
    body: plainBody(
      `${entry.body}\n${entry.sources}\n${entry.connections
        .map((connection) => `${connection.relationship} ${connection.note}`)
        .join("\n")}`,
    ),
  }));
}
