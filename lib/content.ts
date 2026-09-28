import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { isInvoiceProgramPilotBuyer } from "@/lib/invoice-budget";
import { kindPath, labelize } from "@/lib/format";
import type {
  AuditFinding,
  CareerChannel,
  ChangeRecord,
  Contradiction,
  Edge,
  EdgeAmount,
  Entry,
  Flow,
  Institution,
  Kind,
  MapEvent,
  MoneyBasis,
  MoneyUnit,
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

export const MONEY_UNITS = new Set<MoneyUnit>(["ISK", "mkr", "makr", "USD"]);

export const MONEY_BASES = new Set<MoneyBasis>([
  "authorisation",
  "invoice",
  "statement",
  "trade-release",
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
  return { entries, edges, contradictions, changes, audits, offices };
}

const INDEX_VERSION = 3;
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

const EDGE_FIELDS = ["from", "to", "type", "asOf", "source", "quotation"] as const;

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

function requireEdgeString(row: Record<string, unknown>, key: string, index: number): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`data/edges.json edge ${index + 1} is missing ${key}`);
  }
  return value.trim();
}

/**
 * Every way a number can be read out of a printed figure. Icelandic pages use
 * `192.293,9`; ledger exports print `3546720`. We try both separator
 * conventions rather than reformatting anything.
 */
function readingsOf(token: string): number[] {
  const trimmed = token.replace(/\s/g, "");
  const readings = new Set<number>();
  for (const candidate of [
    trimmed.replace(/\./g, "").replace(",", "."),
    trimmed.replace(/,/g, ""),
  ]) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) readings.add(parsed);
  }
  return [...readings];
}

/** True when `quotation` literally prints `value`, under either convention. */
export function quotationPrintsValue(value: number, quotation: string): boolean {
  const tokens = quotation.match(/-?\d[\d.,\s]*\d|-?\d/g) ?? [];
  return tokens.some((token) => readingsOf(token).includes(value));
}

function readEdgeAmount(
  row: Record<string, unknown>,
  quotation: string,
  index: number,
): EdgeAmount | undefined {
  if (!("amount" in row) || row.amount == null) return undefined;
  const where = `data/edges.json edge ${index + 1} amount`;
  const raw = row.amount;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`${where} must be an object`);
  }
  const money = raw as Record<string, unknown>;
  for (const key of Object.keys(money)) {
    if (!["value", "unit", "basis", "quotation"].includes(key)) {
      throw new Error(`${where} has unknown field "${key}"`);
    }
  }
  const { value, unit, basis } = money;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${where} value must be a finite number`);
  }
  if (typeof unit !== "string" || !MONEY_UNITS.has(unit as MoneyUnit)) {
    throw new Error(`${where} has unknown unit "${String(unit)}"`);
  }
  if (typeof basis !== "string" || !MONEY_BASES.has(basis as MoneyBasis)) {
    throw new Error(`${where} has unknown basis "${String(basis)}"`);
  }
  const cited = money.quotation;
  if (typeof cited !== "string" || !cited.trim()) {
    throw new Error(`${where} is missing quotation`);
  }
  const citation = cited.trim();
  if (!quotation.includes(citation)) {
    throw new Error(`${where} quotation is not part of the edge quotation`);
  }
  if (!quotationPrintsValue(value, citation)) {
    throw new Error(`${where} value ${value} is not printed in its quotation`);
  }
  return { value, unit: unit as MoneyUnit, basis: basis as MoneyBasis, quotation: citation };
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
    const amount = readEdgeAmount(row, quotation, index);
    const office = offices.get(to);
    const organizationEntry = office ? bySlug.get(office.organization) : undefined;
    if (office && !organizationEntry) {
      throw new Error(
        `data/edges.json edge ${index + 1} office "${to}" organization does not exist`,
      );
    }
    let year: string | null = null;
    let program: string | null = null;
    let programTitle: string | null = null;
    let programNullReason: string | null = null;
    let programSource: string | null = null;
    let programQuotation: string | null = null;
    if (relationship === "pays") {
      if ("year" in row) {
        if (row.year === null) {
          year = null;
        } else if (typeof row.year === "string" && row.year.trim()) {
          year = row.year.trim();
        } else if (typeof row.year === "number" && Number.isInteger(row.year)) {
          year = String(row.year);
        } else {
          throw new Error(`data/edges.json edge ${index + 1} year must be a string or integer`);
        }
      }
      if ("program" in row) {
        if (row.program === null) {
          program = null;
        } else if (typeof row.program === "string" && row.program.trim()) {
          program = row.program.trim();
          const programEntry = bySlug.get(program);
          if (!programEntry || programEntry.kind !== "flow") {
            throw new Error(
              `data/edges.json edge ${index + 1} program "${program}" is not a money flow`,
            );
          }
          if (!program.startsWith("policy-area-")) {
            throw new Error(
              `data/edges.json edge ${index + 1} program must be a policy-area slug`,
            );
          }
          programTitle = programEntry.title;
        } else {
          throw new Error(`data/edges.json edge ${index + 1} program must be a slug or null`);
        }
      }
      if ("programNullReason" in row) {
        if (row.programNullReason === null) {
          programNullReason = null;
        } else if (
          typeof row.programNullReason === "string" &&
          row.programNullReason.trim()
        ) {
          programNullReason = row.programNullReason.trim();
        } else {
          throw new Error(
            `data/edges.json edge ${index + 1} programNullReason must be a string or null`,
          );
        }
      }
      if ("programSource" in row) {
        if (row.programSource === null) {
          programSource = null;
        } else if (typeof row.programSource === "string" && row.programSource.trim()) {
          programSource = row.programSource.trim();
        } else {
          throw new Error(
            `data/edges.json edge ${index + 1} programSource must be a string or null`,
          );
        }
      }
      if ("programQuotation" in row) {
        if (row.programQuotation === null) {
          programQuotation = null;
        } else if (
          typeof row.programQuotation === "string" &&
          row.programQuotation.trim()
        ) {
          programQuotation = row.programQuotation.trim();
        } else {
          throw new Error(
            `data/edges.json edge ${index + 1} programQuotation must be a string or null`,
          );
        }
      }
      if (program != null) {
        if (programNullReason) {
          throw new Error(
            `data/edges.json edge ${index + 1} cannot set programNullReason when program is set`,
          );
        }
        if (!programSource || !programQuotation) {
          throw new Error(
            `data/edges.json edge ${index + 1} joined program needs programSource and programQuotation`,
          );
        }
      }
      if (program === null && "program" in row && !programNullReason) {
        throw new Error(
          `data/edges.json edge ${index + 1} program null needs programNullReason`,
        );
      }
      if (isInvoiceProgramPilotBuyer(from)) {
        if (!year) {
          throw new Error(`data/edges.json edge ${index + 1} pilot pays row is missing year`);
        }
        if (!("program" in row)) {
          throw new Error(`data/edges.json edge ${index + 1} pilot pays row is missing program`);
        }
      }
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
      year,
      program,
      programTitle,
      programNullReason,
      programSource,
      programQuotation,
      ...(amount ? { amount } : {}),
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
      if (typeof sideRow.asOf !== "string" || !sideRow.asOf.trim()) {
        throw new Error(
          `data/contradictions.json record ${index + 1} side ${sideIndex + 1} is missing asOf. ` +
            "Store what that side's page prints — a date, a year, \"consolidated statute\", " +
            'or "undated on the …" naming the page that carries no date.',
        );
      }
      return {
        source: (sideRow.source as string).trim(),
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
  for (const id of ["reykjavik", "straumsvik", "grundartangi", "reydarfjordur", "keflavik", "blonduos"]) {
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
