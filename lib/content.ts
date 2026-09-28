import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";

import { kindPath, labelize } from "@/lib/format";
import type {
  AuditFinding,
  CareerChannel,
  ChangeRecord,
  Connection,
  Contradiction,
  Edge,
  Entry,
  Flow,
  Institution,
  Kind,
  MapEvent,
  OfficeRecord,
  Player,
  Relationship,
  SearchDoc,
  Sector,
  Treaty,
} from "@/lib/types";

const ROOT = path.join(process.cwd(), "content");
const DATA = path.join(process.cwd(), "data");

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
  "holds-office",
  "sits-on-board",
  "pays",
  "elects",
  "imported-from",
  "exported-to",
  "incorporates",
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
  loadedEdges = buildEdges(entries);
  loadedContradictions = buildContradictions(entries);
  loadedChanges = buildChanges();
  loadedAudits = buildAudits(entries);
  loadedOffices = readOffices();
  assertRecords(entries);
  return entries;
});

let loadedEdges: Edge[] = [];
let loadedContradictions: Contradiction[] = [];
let loadedChanges: ChangeRecord[] = [];
let loadedAudits: AuditFinding[] = [];
let loadedOffices: OfficeRecord[] = [];

const EDGE_FIELDS = ["from", "to", "type", "asOf", "source", "quotation"] as const;

function requireEdgeString(row: Record<string, unknown>, key: string, index: number): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`data/edges.json edge ${index + 1} is missing ${key}`);
  }
  return value.trim();
}

function readOffices(): OfficeRecord[] {
  const parsed: unknown = JSON.parse(
    fs.readFileSync(path.join(DATA, "offices.json"), "utf8"),
  );
  if (!Array.isArray(parsed)) throw new Error("data/offices.json must be a list");
  return parsed.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`data/offices.json office ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    const record: OfficeRecord = {
      id: "",
      title: "",
      holder: "",
      organization: "",
      asOf: "",
    };
    for (const key of ["id", "title", "holder", "organization", "asOf"] as const) {
      const value = row[key];
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`data/offices.json office ${index + 1} is missing ${key}`);
      }
      record[key] = value.trim();
    }
    return record;
  });
}

function buildEdges(entries: Entry[]): Edge[] {
  const parsed: unknown = JSON.parse(fs.readFileSync(path.join(DATA, "edges.json"), "utf8"));
  if (!Array.isArray(parsed)) throw new Error("data/edges.json must be a list");
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const offices = new Map(readOffices().map((office) => [office.id, office]));
  const titleOf = (slug: string, index: number, side: "from" | "to"): string => {
    const entry = bySlug.get(slug);
    if (entry) return entry.title;
    const office = offices.get(slug);
    if (office) return office.title;
    throw new Error(`data/edges.json edge ${index + 1} ${side} "${slug}" does not exist`);
  };
  return parsed.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`data/edges.json edge ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    for (const key of EDGE_FIELDS) {
      if (!(key in row)) throw new Error(`data/edges.json edge ${index + 1} is missing ${key}`);
    }
    const from = requireEdgeString(row, "from", index);
    const to = requireEdgeString(row, "to", index);
    const type = requireEdgeString(row, "type", index);
    const asOf = requireEdgeString(row, "asOf", index);
    const source = requireEdgeString(row, "source", index);
    const quotation = requireEdgeString(row, "quotation", index);
    if (!RELATIONSHIPS.has(type as Relationship)) {
      throw new Error(`data/edges.json edge ${index + 1} has unknown type "${type}"`);
    }
    if (from === to) throw new Error(`data/edges.json edge ${index + 1} points at itself`);
    const relationship = type as Relationship;
    const fromEntry = bySlug.get(from);
    const career =
      relationship === "holds-office" ||
      relationship === "sits-on-board" ||
      (relationship === "invests-in" &&
        fromEntry?.kind === "player" &&
        fromEntry.playerType === "person");
    let start: string | null = null;
    let end: string | null = null;
    let channel: CareerChannel | null = null;
    if (career) {
      for (const key of ["start", "end", "channel"] as const) {
        if (!(key in row)) {
          throw new Error(`data/edges.json edge ${index + 1} is missing ${key}`);
        }
      }
      start = requireEdgeString(row, "start", index);
      end = requireEdgeString(row, "end", index);
      const channelValue = requireEdgeString(row, "channel", index);
      if (channelValue !== "political" && channelValue !== "business") {
        throw new Error(`data/edges.json edge ${index + 1} has unknown channel "${channelValue}"`);
      }
      channel = channelValue;
    }
    const office = offices.get(to);
    const organizationEntry = office ? bySlug.get(office.organization) : undefined;
    if (office && !organizationEntry) {
      throw new Error(
        `data/edges.json edge ${index + 1} office "${to}" organization does not exist`,
      );
    }
    return {
      from,
      fromTitle: titleOf(from, index, "from"),
      to,
      toTitle: titleOf(to, index, "to"),
      relationship,
      source,
      quotation,
      asOf,
      start,
      end,
      channel,
      organization: office?.organization ?? null,
      organizationTitle: organizationEntry?.title ?? null,
    };
  });
}

function requireRecordString(row: Record<string, unknown>, key: string, file: string, index: number): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${file} record ${index + 1} is missing ${key}`);
  }
  return value.trim();
}

function buildChanges(): ChangeRecord[] {
  const file = "data/changes.json";
  const parsed: unknown = JSON.parse(fs.readFileSync(path.join(DATA, "changes.json"), "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${file} must be a list`);
  return parsed.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${file} record ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    return {
      id: requireRecordString(row, "id", file, index),
      edgeId: requireRecordString(row, "edgeId", file, index),
      field: requireRecordString(row, "field", file, index),
      oldValue: requireRecordString(row, "oldValue", file, index),
      newValue: requireRecordString(row, "newValue", file, index),
      observed: requireRecordString(row, "observed", file, index),
      source: requireRecordString(row, "source", file, index),
    };
  });
}

function buildAudits(entries: Entry[]): AuditFinding[] {
  const file = "data/audits.json";
  const parsed: unknown = JSON.parse(fs.readFileSync(path.join(DATA, "audits.json"), "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${file} must be a list`);
  const slugs = new Set(entries.map((entry) => entry.slug));
  return parsed.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${file} record ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    const listed = row.entries;
    if (!Array.isArray(listed) || listed.length === 0 || listed.some((slug) => typeof slug !== "string")) {
      throw new Error(`${file} record ${index + 1} entries must be a list of slugs`);
    }
    for (const slug of listed) {
      if (!slugs.has(slug)) throw new Error(`${file} record ${index + 1} names missing slug "${slug}"`);
    }
    return {
      id: requireRecordString(row, "id", file, index),
      entries: listed.map((slug) => slug.trim()),
      published: requireRecordString(row, "published", file, index),
      source: requireRecordString(row, "source", file, index),
      quotation: requireRecordString(row, "quotation", file, index),
    };
  });
}

function buildContradictions(entries: Entry[]): Contradiction[] {
  const parsed: unknown = JSON.parse(
    fs.readFileSync(path.join(DATA, "contradictions.json"), "utf8"),
  );
  if (!Array.isArray(parsed)) throw new Error("data/contradictions.json must be a list");
  const slugs = new Set(entries.map((entry) => entry.slug));
  return parsed.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`data/contradictions.json record ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    for (const key of ["id", "entries", "summary", "sides"] as const) {
      if (!(key in row)) {
        throw new Error(`data/contradictions.json record ${index + 1} is missing ${key}`);
      }
    }
    if (typeof row.id !== "string" || !row.id.trim()) {
      throw new Error(`data/contradictions.json record ${index + 1} is missing id`);
    }
    const summary = row.summary;
    if (typeof summary !== "string" || !summary.trim()) {
      throw new Error(`data/contradictions.json record ${index + 1} is missing summary`);
    }
    if (!Array.isArray(row.entries) || row.entries.length === 0) {
      throw new Error(`data/contradictions.json record ${index + 1} is missing entries`);
    }
    const entrySlugs = row.entries.map((slug, entryIndex) => {
      if (typeof slug !== "string" || !slug.trim()) {
        throw new Error(
          `data/contradictions.json record ${index + 1} entry ${entryIndex + 1} is missing`,
        );
      }
      if (!slugs.has(slug)) {
        throw new Error(
          `data/contradictions.json record ${index + 1} entry "${slug}" does not exist`,
        );
      }
      return slug;
    });
    if (!Array.isArray(row.sides) || row.sides.length !== 2) {
      throw new Error(`data/contradictions.json record ${index + 1} needs two sides`);
    }
    const sides = row.sides.map((side, sideIndex) => {
      if (side == null || typeof side !== "object" || Array.isArray(side)) {
        throw new Error(
          `data/contradictions.json record ${index + 1} side ${sideIndex + 1} must be an object`,
        );
      }
      const sideRow = side as Record<string, unknown>;
      for (const key of ["source", "quotation"] as const) {
        if (!(key in sideRow)) {
          throw new Error(
            `data/contradictions.json record ${index + 1} side ${sideIndex + 1} is missing ${key}`,
          );
        }
        if (typeof sideRow[key] !== "string" || !sideRow[key].trim()) {
          throw new Error(
            `data/contradictions.json record ${index + 1} side ${sideIndex + 1} is missing ${key}`,
          );
        }
      }
      return {
        source: (sideRow.source as string).trim(),
        quotation: (sideRow.quotation as string).trim(),
      };
    });
    const first = sides[0];
    const second = sides[1];
    if (!first || !second) {
      throw new Error(`data/contradictions.json record ${index + 1} needs two sides`);
    }
    return {
      id: (row.id as string).trim(),
      entries: entrySlugs,
      summary: summary.trim(),
      sides: [first, second],
    };
  });
}

function assertRecords(entries: Entry[]): void {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const places: unknown = JSON.parse(fs.readFileSync(path.join(DATA, "places.json"), "utf8"));
  if (!Array.isArray(places)) throw new Error("data/places.json must be a list");
  const placeIds = new Set<string>();
  for (const [index, item] of places.entries()) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`data/places.json place ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    for (const key of ["id", "name"] as const) {
      if (typeof row[key] !== "string" || !row[key].trim()) {
        throw new Error(`data/places.json place ${index + 1} is missing ${key}`);
      }
    }
    if (typeof row.lat !== "number" || typeof row.lon !== "number") {
      throw new Error(`data/places.json place ${index + 1} is missing lat or lon`);
    }
    placeIds.add(row.id as string);
  }
  for (const id of ["reykjavik", "straumsvik", "grundartangi", "reydarfjordur", "keflavik", "blonduos"]) {
    if (!placeIds.has(id)) throw new Error(`data/places.json is missing ${id}`);
  }
  const offices: unknown = JSON.parse(fs.readFileSync(path.join(DATA, "offices.json"), "utf8"));
  if (!Array.isArray(offices)) throw new Error("data/offices.json must be a list");
  for (const [index, item] of offices.entries()) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`data/offices.json office ${index + 1} must be an object`);
    }
    const row = item as Record<string, unknown>;
    for (const key of ["id", "title", "holder", "organization", "asOf"] as const) {
      if (typeof row[key] !== "string" || !row[key].trim()) {
        throw new Error(`data/offices.json office ${index + 1} is missing ${key}`);
      }
    }
    const holder = bySlug.get(row.holder as string);
    if (!holder || holder.kind !== "player" || holder.playerType !== "person") {
      throw new Error(`data/offices.json office ${index + 1} holder does not exist`);
    }
    if (!bySlug.has(row.organization as string)) {
      throw new Error(`data/offices.json office ${index + 1} organization does not exist`);
    }
  }
}

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
  if (entry) return { title: entry.title, href: hrefFor(entry) };
  const office = getOfficeById(slug);
  if (office) return { title: office.title, href: `/offices/${office.id}` };
  return null;
}

export function getOffices(): OfficeRecord[] {
  getCatalog();
  return loadedOffices;
}

export function getOfficeById(id: string): OfficeRecord | undefined {
  return getOffices().find((office) => office.id === id);
}

export function getEdges(): Edge[] {
  getCatalog();
  return loadedEdges;
}

export function getContradictions(): Contradiction[] {
  getCatalog();
  return loadedContradictions;
}

export function getChanges(): ChangeRecord[] {
  getCatalog();
  return loadedChanges;
}

export function getAudits(): AuditFinding[] {
  getCatalog();
  return loadedAudits;
}

export function edgesFor(slug: string): { out: Edge[]; inn: Edge[] } {
  const edges = getEdges();
  return {
    out: edges.filter((edge) => edge.from === slug),
    inn: edges.filter((edge) => edge.to === slug),
  };
}

export function toSearchDocs(entries: Entry[] = getCatalog()): SearchDoc[] {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const entryDocs: SearchDoc[] = entries.map((entry) => ({
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
      `${entry.body}\n${entry.sources}\n${getEdges()
        .filter((edge) => edge.from === entry.slug || edge.to === entry.slug)
        .map(
          (edge) =>
            `${labelize(edge.relationship)} ${edge.relationship} ${edge.quotation}`,
        )
        .join("\n")}`,
    ),
  }));

  const edgeDocs: SearchDoc[] = getEdges().map((edge) => {
    const from = bySlug.get(edge.from);
    const label = labelize(edge.relationship);
    return {
      title: `${edge.fromTitle} ${label.toLowerCase()} ${edge.toTitle}`,
      slug: `edge:${edge.from}:${edge.relationship}:${edge.to}:${edge.asOf}:${edge.start ?? ""}:${edge.quotation}`,
      kind: "edge",
      href: from ? hrefFor(from) : "/connections",
      summary: `${label}. ${edge.quotation}`,
      topics: [label, edge.relationship],
      body: plainBody(
        `${label} ${edge.relationship} ${edge.quotation} ${edge.fromTitle} ${edge.toTitle} ${edge.organizationTitle ?? ""}`,
      ),
    };
  });

  return [...entryDocs, ...edgeDocs];
}
