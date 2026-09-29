import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

import {
  MONEY_BASES,
  MONEY_UNITS,
  checkRawEdge,
  quotationPrintsValue,
} from "@/lib/edge-contract";
import { kindPath, labelize } from "@/lib/format";
import {
  assertPrintedHeadingIdentities,
  PRINTED_HEADING_IDENTITIES,
} from "@/lib/identities";
import { mapSlugHasTypedLinkage } from "@/lib/map-graph";
import { isHttpUrl } from "@/lib/safe-href";
import type {
  AuditFinding,
  ChangeRecord,
  Contradiction,
  Edge,
  Entry,
  Flow,
  Institution,
  Kind,
  MapEvent,
  OfficeRecord,
  Player,
  SearchDoc,
  Sector,
  Treaty,
} from "@/lib/types";

export { MONEY_BASES, MONEY_UNITS, quotationPrintsValue };

const ROOT = path.join(process.cwd(), "content");
const DATA = path.join(process.cwd(), "data");

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

function requireHttpUrl(value: string, where: string): string {
  if (!isHttpUrl(value)) {
    throw new Error(`${where} must be an http(s) address`);
  }
  return value;
}

function optionalString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new Error(`Frontmatter "${key}" must be a string`);
  }
  return value.trim();
}

function optionalHttpUrl(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string {
  const value = optionalString(data, key);
  if (!value) return "";
  return requireHttpUrl(value, `${file} ${key}`);
}

function optionalBoolean(
  data: Record<string, unknown>,
  key: string,
  file: string,
): boolean {
  const value = data[key];
  if (value == null) return false;
  if (typeof value !== "boolean") {
    throw new Error(`${file} frontmatter "${key}" must be a boolean`);
  }
  return value;
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

/** Keeps edge document slugs unique without carrying the quotation in them. */
function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
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
  const shared = {
    title,
    slug,
    related,
    body: split.body,
    sources: split.sources,
    summary,
    lede: optionalString(data, "lede"),
    proseOnly: optionalBoolean(data, "proseOnly", file),
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
      source: requireHttpUrl(requireString(data, "source", file), `${file} source`),
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
      website: optionalHttpUrl(data, "website", file),
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
    website: optionalHttpUrl(data, "website", file),
  };
  return player;
}

export type CatalogSnapshot = {
  entries: Entry[];
  edges: Edge[];
  contradictions: Contradiction[];
  changes: ChangeRecord[];
  audits: AuditFinding[];
  offices: OfficeRecord[];
};

const DATA_FILES = [
  "edges.json",
  "offices.json",
  "places.json",
  "changes.json",
  "audits.json",
  "contradictions.json",
  "identities.json",
] as const;

/** Every file the catalog is built from, in a stable order. */
function sourceFiles(): string[] {
  const files: string[] = [];
  for (const { folder } of FOLDERS) {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith(".md")) files.push(path.join(dir, name));
    }
  }
  for (const name of DATA_FILES) files.push(path.join(DATA, name));
  return files;
}

/**
 * Reads and validates every Markdown file and JSON blob. Throws on the first
 * bad record, which is what keeps a broken edge or a missing slug from ever
 * reaching a page. The build-time index is a cache of this function's output.
 */
export function readCatalogFromSource(): CatalogSnapshot {
  const entries: Entry[] = [];
  for (const { folder, kind } of FOLDERS) {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      entries.push(readEntry(path.join(dir, name), kind));
    }
  }
  const offices = readOffices();
  const edges = buildEdges(entries, offices);
  const contradictions = buildContradictions(entries);
  const changes = buildChanges();
  const audits = buildAudits(entries);
  resolveSummarySlugs(entries);
  assertRecords(entries, offices);
  assertProseOnly(entries, edges, offices);
  assertPrintedHeadingIdentities(
    PRINTED_HEADING_IDENTITIES,
    edges,
    [
      ...entries.map((entry) => ({ id: entry.slug, title: entry.title })),
      ...offices.map((office) => ({ id: office.id, title: office.title })),
    ],
  );
  return { entries, edges, contradictions, changes, audits, offices };
}

const INDEX_VERSION = 4;
const INDEX_FILE = path.join(DATA, "generated", "content-index.json");

type StoredIndex = { version: number; digest: string; snapshot: CatalogSnapshot };

/** Hashes the bytes of every source file. Cheap next to parsing them. */
export function sourceDigest(): string {
  const hash = createHash("sha256").update(`v${INDEX_VERSION}`);
  for (const file of sourceFiles()) {
    hash.update(path.relative(process.cwd(), file));
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

/** Cheap stamp used in development to notice edits without rehashing bytes. */
function sourceStamp(): string {
  const parts: string[] = [];
  for (const file of sourceFiles()) {
    const stat = fs.statSync(file);
    parts.push(`${file}:${stat.size}:${stat.mtimeMs}`);
  }
  return parts.join("\n");
}

export function buildContentIndex(): { digest: string; snapshot: CatalogSnapshot } {
  const snapshot = readCatalogFromSource();
  const stored: StoredIndex = {
    version: INDEX_VERSION,
    digest: sourceDigest(),
    snapshot,
  };
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(stored));
  return { digest: stored.digest, snapshot };
}

/**
 * Returns the prebuilt index when it matches the current sources, otherwise
 * null so the caller falls back to a validating read. A digest mismatch means
 * the index is stale, never that stale data gets served.
 */
function readIndexFile(): CatalogSnapshot | null {
  let raw: string;
  try {
    raw = fs.readFileSync(INDEX_FILE, "utf8");
  } catch {
    return null;
  }
  let stored: StoredIndex;
  try {
    stored = JSON.parse(raw) as StoredIndex;
  } catch {
    return null;
  }
  if (stored?.version !== INDEX_VERSION || typeof stored.digest !== "string") {
    return null;
  }
  if (stored.digest !== sourceDigest()) return null;
  const snapshot = stored.snapshot;
  if (
    !snapshot ||
    !Array.isArray(snapshot.entries) ||
    !Array.isArray(snapshot.edges) ||
    !Array.isArray(snapshot.offices)
  ) {
    return null;
  }
  return snapshot;
}

let loaded: CatalogSnapshot | null = null;
let loadedStamp = "";

/**
 * One load per process instead of one per call. Outside production the stamp is
 * rechecked so a content edit shows up on the next request.
 */
function snapshot(): CatalogSnapshot {
  if (loaded) {
    if (process.env.NODE_ENV === "production") return loaded;
    if (sourceStamp() === loadedStamp) return loaded;
  }
  loaded = readIndexFile() ?? readCatalogFromSource();
  loadedStamp = sourceStamp();
  return loaded;
}

export function getCatalog(): Entry[] {
  return snapshot().entries;
}

function resolveSummarySlugs(entries: Entry[]): void {
  const titles = new Map(entries.map((entry) => [entry.slug, entry.title]));
  for (const entry of entries) {
    entry.summary = entry.summary.replace(
      /→\s*([a-z0-9][a-z0-9-]*)/g,
      (match, slug: string) =>
        titles.has(slug) ? `→ ${titles.get(slug)}` : match,
    );
  }
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

function buildEdges(entries: Entry[], officeRecords: OfficeRecord[]): Edge[] {
  const parsed: unknown = JSON.parse(fs.readFileSync(path.join(DATA, "edges.json"), "utf8"));
  if (!Array.isArray(parsed)) throw new Error("data/edges.json must be a list");
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const offices = new Map(officeRecords.map((office) => [office.id, office]));
  const titleOf = (slug: string, index: number, side: "from" | "to"): string => {
    const entry = bySlug.get(slug);
    if (entry) return entry.title;
    const office = offices.get(slug);
    if (office) return office.title;
    throw new Error(`data/edges.json edge ${index + 1} ${side} "${slug}" does not exist`);
  };
  return parsed.map((item, index) => {
    const where = `data/edges.json edge ${index + 1}`;
    const checked = checkRawEdge(item, { where, bySlug, offices });
    if (!checked.ok) throw new Error(checked.errors[0]);
    const fields = checked.fields;
    const office = offices.get(fields.to);
    const organizationEntry = office ? bySlug.get(office.organization) : undefined;
    const programEntry = fields.program ? bySlug.get(fields.program) : undefined;
    return {
      from: fields.from,
      fromTitle: titleOf(fields.from, index, "from"),
      to: fields.to,
      toTitle: titleOf(fields.to, index, "to"),
      relationship: fields.relationship,
      source: fields.source,
      quotation: fields.quotation,
      asOf: fields.asOf,
      start: fields.start,
      end: fields.end,
      channel: fields.channel,
      organization: office?.organization ?? null,
      organizationTitle: organizationEntry?.title ?? null,
      year: fields.year,
      program: fields.program,
      programTitle: programEntry?.title ?? null,
      programNullReason: fields.programNullReason,
      programSource: fields.programSource,
      programQuotation: fields.programQuotation,
      ...(fields.amount ? { amount: fields.amount } : {}),
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
      source: requireHttpUrl(
        requireRecordString(row, "source", file, index),
        `${file} record ${index + 1} source`,
      ),
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
      source: requireHttpUrl(
        requireRecordString(row, "source", file, index),
        `${file} record ${index + 1} source`,
      ),
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
      if (typeof sideRow.asOf !== "string" || !sideRow.asOf.trim()) {
        throw new Error(
          `data/contradictions.json record ${index + 1} side ${sideIndex + 1} is missing asOf. ` +
            "Store what that side's page prints — a date, a year, \"consolidated statute\", " +
            'or "undated on the …" naming the page that carries no date.',
        );
      }
      return {
        source: requireHttpUrl(
          (sideRow.source as string).trim(),
          `data/contradictions.json record ${index + 1} side ${sideIndex + 1} source`,
        ),
        quotation: (sideRow.quotation as string).trim(),
        asOf: sideRow.asOf.trim(),
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

function assertRecords(entries: Entry[], offices: OfficeRecord[]): void {
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
  for (const id of [
    "reykjavik",
    "straumsvik",
    "grundartangi",
    "reydarfjordur",
    "keflavik",
    "reykjanesbaer",
    "blonduos",
    "kopavogur",
    "hafnarfjordur",
    "akureyri",
    "gardabaer",
    "mosfellsbaer",
    "arborg",
    "akranes",
    "fjardabyggd",
    "vestmannaeyjar",
    "seltjarnarnes",
    "thingvellir",
  ]) {
    if (!placeIds.has(id)) throw new Error(`data/places.json is missing ${id}`);
  }
  for (const [index, office] of offices.entries()) {
    const holder = bySlug.get(office.holder);
    if (!holder || holder.kind !== "player" || holder.playerType !== "person") {
      throw new Error(`data/offices.json office ${index + 1} holder does not exist`);
    }
    if (!bySlug.has(office.organization)) {
      throw new Error(`data/offices.json office ${index + 1} organization does not exist`);
    }
  }
}

function assertProseOnly(
  entries: Entry[],
  edges: Edge[],
  offices: OfficeRecord[],
): void {
  for (const entry of entries) {
    const linked = mapSlugHasTypedLinkage(entry.slug, edges, offices);
    if (entry.proseOnly && linked) {
      throw new Error(
        `${entry.slug} is marked prose-only but has a typed or office-linked edge`,
      );
    }
    if (!entry.proseOnly && !linked) {
      throw new Error(
        `${entry.slug} has no typed or office-linked edge and is not marked prose-only`,
      );
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

export function getPolicyAreas(): Flow[] {
  return getFlows()
    .filter((flow) => flow.slug.startsWith("policy-area-"))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getOtherFlows(): Flow[] {
  return getFlows()
    .filter((flow) => !flow.slug.startsWith("policy-area-"))
    .sort(
      (a, b) =>
        b.year.localeCompare(a.year) || a.title.localeCompare(b.title, "en"),
    );
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
  return snapshot().offices;
}

export function getOfficeById(id: string): OfficeRecord | undefined {
  return getOffices().find((office) => office.id === id);
}

export function getEdges(): Edge[] {
  return snapshot().edges;
}

export function getContradictions(): Contradiction[] {
  return snapshot().contradictions;
}

export function getChanges(): ChangeRecord[] {
  return snapshot().changes;
}

export function getAudits(): AuditFinding[] {
  return snapshot().audits;
}

export function edgesFor(slug: string): { out: Edge[]; inn: Edge[] } {
  const edges = getEdges();
  return {
    out: edges.filter((edge) => edge.from === slug),
    inn: edges.filter((edge) => edge.to === slug),
  };
}

/**
 * Relationship wording per entry, deduplicated. Quotations stay on the edge
 * documents so an entry body is not a transcript of every edge that touches it.
 */
function relationshipLines(edges: Edge[]): Map<string, Set<string>> {
  const lines = new Map<string, Set<string>>();
  const add = (slug: string, line: string) => {
    const existing = lines.get(slug);
    if (existing) existing.add(line);
    else lines.set(slug, new Set([line]));
  };
  for (const edge of edges) {
    const label = labelize(edge.relationship);
    add(edge.from, `${label} ${edge.relationship} ${edge.toTitle}`);
    add(edge.to, `${label} ${edge.relationship} ${edge.fromTitle}`);
  }
  return lines;
}

export function toSearchDocs(entries: Entry[] = getCatalog()): SearchDoc[] {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const edges = getEdges();
  const lines = relationshipLines(edges);
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
      `${entry.body}\n${entry.sources}\n${[...(lines.get(entry.slug) ?? [])].join("\n")}`,
    ),
  }));

  const edgeDocs: SearchDoc[] = edges.map((edge) => {
    const from = bySlug.get(edge.from);
    const label = labelize(edge.relationship);
    return {
      title: `${edge.fromTitle} ${label.toLowerCase()} ${edge.toTitle}`,
      slug: `edge:${edge.from}:${edge.relationship}:${edge.to}:${edge.asOf}:${edge.start ?? ""}:${shortHash(edge.quotation)}`,
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
