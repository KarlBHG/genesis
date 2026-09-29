import { digitsOfKennitala } from "@/lib/kennitala";
import { edgeId } from "@/lib/edge-id";
import { isHttpUrl } from "@/lib/safe-href";
import type { Edge } from "@/lib/types";

/** Ledger root stored on every Opnir `pays` row — the site prints no per-invoice URL. */
export const OPNIR_LEDGER_SOURCE = "https://opnirreikningar.is/";

export const OPNIR_FIXTURE_RELATIVE = "data/opnir-feed-fixture.json";
export const OPNIR_REVIEW_QUEUE_RELATIVE = "data/opnir-review-queue.json";

export type OfficialOpnirRow = {
  buyer: string;
  date: string;
  vendor: string;
  invoiceNumber: string;
  amountValue: number;
  amountText: string;
  kennitala: string | null;
  /** Printed heading only. Never mapped to a policy-area slug. */
  malaflokkur: string | null;
  quotation: string;
  source: string;
  discardedProgram: boolean;
};

export type OpnirReviewItem = {
  id: string;
  status: "needs-program";
  origin: "paste" | "fixture" | "stored-pays";
  official: OfficialOpnirRow;
  suggestedFrom: string | null;
  suggestedTo: string | null;
};

export type OpnirParseResult = {
  ok: boolean;
  errors: string[];
  items: OpnirReviewItem[];
};

export type OpnirReviewQueueFile = {
  version: 1;
  note: string;
  items: OpnirReviewItem[];
};

export const EMPTY_OPNIR_REVIEW_QUEUE: OpnirReviewQueueFile = {
  version: 1,
  note: "Official Opnir invoice rows awaiting a human program join or an explicit null reason. This file is not loaded as catalog. A málaflok is never invented from the vendor’s line of business.",
  items: [],
};

export type OpnirNameHint = { id: string; title: string };

export type OpnirMatchContext = {
  names: readonly OpnirNameHint[];
  kennitalaByDigits: ReadonlyMap<string, string>;
  paysAliases: ReadonlyMap<string, string>;
};

const BUYER_KEYS = new Set([
  "kaupandi",
  "buyer",
  "buyername",
  "fromname",
  "stofnun",
]);
const DATE_KEYS = new Set(["dagsetning", "date", "asof", "invoicedate"]);
const VENDOR_KEYS = new Set([
  "seljandi",
  "vendor",
  "seller",
  "toname",
  "vidskiptamadur",
]);
const INVOICE_KEYS = new Set([
  "reikningsnumer",
  "reikningur",
  "invoice",
  "invoicenumber",
  "invoiceno",
  "nr",
]);
const AMOUNT_KEYS = new Set([
  "upphaed",
  "amount",
  "amountisk",
  "amountvalue",
  "amounttext",
  "verd",
  "isk",
]);
const KT_KEYS = new Set(["kennitala", "kt", "vendorkennitala", "sellertaxid"]);
const MALAFLOK_KEYS = new Set(["malaflokkur", "malaflok", "policyarea"]);

const LEDGER_LINE =
  /^(.+?);\s*(\d{4}-\d{2}-\d{2});\s*(.+?);\s*(.+?);\s*(-?\d[\d.,\s]*)$/;

export function normalizeOpnirKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/ð/g, "d")
    .replace(/þ/g, "th")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function normalizeOpnirName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ð/g, "d")
    .replace(/þ/g, "th")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/,?\s*adalskrifstofa\b/g, "")
    .replace(/\b(hf|ehf|ohf|svf|slhf)\.?\b/g, "")
    .replace(/[().,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstString(
  row: Record<string, unknown>,
  keys: ReadonlySet<string>,
): string {
  for (const [rawKey, value] of Object.entries(row)) {
    if (!keys.has(normalizeOpnirKey(rawKey))) continue;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function parseAmountText(text: string): { value: number; text: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const token = trimmed.replace(/\s/g, "").replace(/kr\.?$/i, "");
  const readings = [
    Number(token.replace(/\./g, "").replace(",", ".")),
    Number(token.replace(/,/g, "")),
  ].filter((value) => Number.isFinite(value));
  const value = readings[0];
  if (value == null) return null;
  return { value, text: trimmed };
}

export function quotationFromOfficial(row: {
  buyer: string;
  date: string;
  vendor: string;
  invoiceNumber: string;
  amountText: string;
}): string {
  return `${row.buyer}; ${row.date}; ${row.vendor}; ${row.invoiceNumber}; ${row.amountText}`;
}

export function parseLedgerQuotation(
  quotation: string,
): Omit<OfficialOpnirRow, "kennitala" | "malaflokkur" | "source" | "discardedProgram"> | null {
  const match = quotation.trim().match(LEDGER_LINE);
  if (!match) return null;
  const buyer = match[1]!.trim();
  const date = match[2]!.trim();
  const vendor = match[3]!.trim();
  const invoiceNumber = match[4]!.trim();
  const amountText = match[5]!.trim();
  const amount = parseAmountText(amountText);
  if (!amount) return null;
  return {
    buyer,
    date,
    vendor,
    invoiceNumber,
    amountValue: amount.value,
    amountText: amount.text,
    quotation: quotationFromOfficial({
      buyer,
      date,
      vendor,
      invoiceNumber,
      amountText: amount.text,
    }),
  };
}

function officialFromObject(
  row: Record<string, unknown>,
): { official: OfficialOpnirRow; errors: string[] } {
  const errors: string[] = [];
  const quotation =
    typeof row.quotation === "string" ? row.quotation.trim() : "";
  const fromQuotation = quotation ? parseLedgerQuotation(quotation) : null;

  const buyer = firstString(row, BUYER_KEYS) || fromQuotation?.buyer || "";
  const date = firstString(row, DATE_KEYS) || fromQuotation?.date || "";
  const vendor = firstString(row, VENDOR_KEYS) || fromQuotation?.vendor || "";
  const invoiceNumber =
    firstString(row, INVOICE_KEYS) || fromQuotation?.invoiceNumber || "";
  const amountField = firstString(row, AMOUNT_KEYS);
  const amount =
    parseAmountText(amountField) ??
    (fromQuotation
      ? { value: fromQuotation.amountValue, text: fromQuotation.amountText }
      : null);

  if (!buyer) errors.push("missing kaupandi/buyer");
  if (!date) errors.push("missing dagsetning/date");
  if (!vendor) errors.push("missing seljandi/vendor");
  if (!invoiceNumber) errors.push("missing reikningsnúmer/invoice");
  if (!amount) errors.push("missing or unreadable upphæð/amount");
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push(`date "${date}" is not YYYY-MM-DD`);
  }

  const kennitalaRaw = firstString(row, KT_KEYS);
  const kennitala = kennitalaRaw ? digitsOfKennitala(kennitalaRaw) || null : null;

  const printedMalaflok = firstString(row, MALAFLOK_KEYS);
  const discardedProgram = Boolean(
    ("program" in row && row.program != null && row.program !== "") ||
      ("programNullReason" in row && row.programNullReason),
  );

  const sourceRaw =
    typeof row.source === "string" && row.source.trim()
      ? row.source.trim()
      : OPNIR_LEDGER_SOURCE;
  const source = isHttpUrl(sourceRaw) ? sourceRaw : OPNIR_LEDGER_SOURCE;
  if (sourceRaw !== source) {
    errors.push("source must be an http(s) address");
  }

  const amountText = amount?.text ?? "";
  const official: OfficialOpnirRow = {
    buyer,
    date,
    vendor,
    invoiceNumber,
    amountValue: amount?.value ?? Number.NaN,
    amountText,
    kennitala: kennitala && kennitala.length === 10 ? kennitala : kennitalaRaw || null,
    malaflokkur: printedMalaflok || null,
    quotation:
      fromQuotation?.quotation ||
      (buyer && date && vendor && invoiceNumber && amountText
        ? quotationFromOfficial({
            buyer,
            date,
            vendor,
            invoiceNumber,
            amountText,
          })
        : quotation),
    source,
    discardedProgram,
  };
  return { official, errors };
}

function splitCsvLine(line: string, delimiter: "," | ";"): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

function parseCsvObjects(text: string): Record<string, unknown>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter: "," | ";" =
    lines[0]!.includes(";") && !lines[0]!.includes(",") ? ";" : ",";
  const headers = splitCsvLine(lines[0]!, delimiter);
  if (headers.length < 2) return [];
  const looksLikeHeader = headers.some(
    (header) =>
      BUYER_KEYS.has(normalizeOpnirKey(header)) ||
      DATE_KEYS.has(normalizeOpnirKey(header)) ||
      VENDOR_KEYS.has(normalizeOpnirKey(header)),
  );
  if (!looksLikeHeader) return [];
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

function extractRowList(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed == null || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  for (const key of ["rows", "items", "invoices", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  if (
    typeof record.kaupandi === "string" ||
    typeof record.buyer === "string" ||
    typeof record.quotation === "string"
  ) {
    return [record];
  }
  return null;
}

function reviewId(official: OfficialOpnirRow, origin: OpnirReviewItem["origin"]): string {
  return `opnir-${origin}-${edgeId({
    from: official.buyer,
    relationship: "pays",
    to: official.vendor,
    asOf: official.date,
    start: null,
    quotation: official.quotation,
  })}`;
}

export function paysAliasesFromEdges(
  edges: readonly Pick<Edge, "relationship" | "from" | "to" | "quotation">[],
): Map<string, string> {
  const votes = new Map<string, Map<string, number>>();
  for (const edge of edges) {
    if (edge.relationship !== "pays") continue;
    const parsed = parseLedgerQuotation(edge.quotation);
    if (!parsed) continue;
    for (const [name, slug] of [
      [parsed.buyer, edge.from],
      [parsed.vendor, edge.to],
    ] as const) {
      const key = normalizeOpnirName(name);
      if (!key) continue;
      const bySlug = votes.get(key) ?? new Map<string, number>();
      bySlug.set(slug, (bySlug.get(slug) ?? 0) + 1);
      votes.set(key, bySlug);
    }
  }
  const unique = new Map<string, string>();
  for (const [key, bySlug] of votes) {
    if (bySlug.size !== 1) continue;
    const slug = [...bySlug.keys()][0];
    if (slug) unique.set(key, slug);
  }
  return unique;
}

function uniqueNameMatch(
  printed: string,
  names: readonly OpnirNameHint[],
): string | null {
  const key = normalizeOpnirName(printed);
  if (!key) return null;
  const hits = names.filter((name) => {
    const title = normalizeOpnirName(name.title);
    const paren = name.title.split("(")[0]?.trim() ?? "";
    return (
      title === key ||
      normalizeOpnirName(paren) === key ||
      title.startsWith(`${key} `) ||
      key.startsWith(title)
    );
  });
  if (hits.length === 1) return hits[0]!.id;
  return null;
}

export function suggestEndpoints(
  official: OfficialOpnirRow,
  ctx: OpnirMatchContext,
): { from: string | null; to: string | null } {
  const fromAlias = ctx.paysAliases.get(normalizeOpnirName(official.buyer)) ?? null;
  const toAlias = ctx.paysAliases.get(normalizeOpnirName(official.vendor)) ?? null;
  const fromName = uniqueNameMatch(official.buyer, ctx.names);
  const toName = uniqueNameMatch(official.vendor, ctx.names);
  let toKennitala: string | null = null;
  if (official.kennitala) {
    const digits = digitsOfKennitala(official.kennitala);
    toKennitala = ctx.kennitalaByDigits.get(digits) ?? null;
  }
  return {
    from: fromAlias ?? fromName,
    to: toKennitala ?? toAlias ?? toName,
  };
}

function toReviewItem(
  official: OfficialOpnirRow,
  origin: OpnirReviewItem["origin"],
  ctx: OpnirMatchContext,
): OpnirReviewItem {
  const suggested = suggestEndpoints(official, ctx);
  return {
    id: reviewId(official, origin),
    status: "needs-program",
    origin,
    official,
    suggestedFrom: suggested.from,
    suggestedTo: suggested.to,
  };
}

/**
 * Parse a paste of official CSV/JSON, ledger quotation lines, or stored pays
 * objects. Program / málaflok joins are stripped. Nothing is fetched.
 */
export function parseOfficialOpnirPaste(
  text: string,
  ctx: OpnirMatchContext,
  origin: OpnirReviewItem["origin"] = "paste",
): OpnirParseResult {
  const raw = text.trim();
  if (!raw) return { ok: false, errors: ["paste is empty"], items: [] };

  const errors: string[] = [];
  let objects: Record<string, unknown>[] = [];

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      const list = extractRowList(parsed);
      if (!list) {
        return {
          ok: false,
          errors: ["JSON must be a list of invoice objects, or { rows: [...] }"],
          items: [],
        };
      }
      for (const [index, item] of list.entries()) {
        if (item == null || typeof item !== "object" || Array.isArray(item)) {
          errors.push(`row ${index + 1} is not an object`);
          continue;
        }
        objects.push(item as Record<string, unknown>);
      }
    } catch {
      return { ok: false, errors: ["JSON is not parseable"], items: [] };
    }
  } else {
    const csv = parseCsvObjects(raw);
    if (csv.length > 0) {
      objects = csv;
    } else {
      const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      for (const [index, line] of lines.entries()) {
        const parsed = parseLedgerQuotation(line);
        if (!parsed) {
          errors.push(`line ${index + 1} is not a ledger quotation`);
          continue;
        }
        objects.push({
          quotation: parsed.quotation,
          kaupandi: parsed.buyer,
          dagsetning: parsed.date,
          seljandi: parsed.vendor,
          reikningsnumer: parsed.invoiceNumber,
          upphaed: parsed.amountText,
        });
      }
    }
  }

  const items: OpnirReviewItem[] = [];
  const seen = new Set<string>();
  for (const [index, object] of objects.entries()) {
    const { official, errors: rowErrors } = officialFromObject(object);
    if (rowErrors.length > 0) {
      errors.push(`row ${index + 1}: ${rowErrors.join("; ")}`);
      continue;
    }
    const item = toReviewItem(official, origin, ctx);
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }

  return { ok: items.length > 0, errors, items };
}

export type OpnirFixtureFile = {
  version: 1;
  source: string;
  note: string;
  rows: Record<string, unknown>[];
};

export function parseOpnirFixture(
  fixture: OpnirFixtureFile,
  ctx: OpnirMatchContext,
): OpnirParseResult {
  return parseOfficialOpnirPaste(JSON.stringify(fixture.rows), ctx, "fixture");
}

export function officialRowsFromStoredPays(
  edges: readonly Edge[],
  ctx: OpnirMatchContext,
): OpnirReviewItem[] {
  const items: OpnirReviewItem[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    if (edge.relationship !== "pays") continue;
    if (!edge.source.includes("opnirreikningar.is")) continue;
    const parsed = parseLedgerQuotation(edge.quotation);
    if (!parsed) continue;
    const official: OfficialOpnirRow = {
      ...parsed,
      kennitala: null,
      malaflokkur: null,
      source: OPNIR_LEDGER_SOURCE,
      discardedProgram: edge.program != null || Boolean(edge.programNullReason),
    };
    const item = toReviewItem(official, "stored-pays", ctx);
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

/** Year as the invoice date prints it. Not derived from a range. */
export function yearFromOpnirDate(date: string): string {
  return date.slice(0, 4);
}

/**
 * A málaflokkur string on an official row is evidence the page printed a
 * heading. It is never turned into a policy-area slug here.
 */
export function programFromPrintedMalaflok(_printed: string | null): null {
  return null;
}

export function buildOpnirMatchContext(input: {
  names: readonly OpnirNameHint[];
  kennitalaRecords: readonly { slug: string; kennitala: string }[];
  paysEdges: readonly Pick<Edge, "relationship" | "from" | "to" | "quotation">[];
}): OpnirMatchContext {
  const kennitalaByDigits = new Map<string, string>();
  for (const record of input.kennitalaRecords) {
    const digits = digitsOfKennitala(record.kennitala);
    if (digits.length === 10) kennitalaByDigits.set(digits, record.slug);
  }
  return {
    names: input.names,
    kennitalaByDigits,
    paysAliases: paysAliasesFromEdges(input.paysEdges),
  };
}

export function sanitizeOpnirReviewItem(
  raw: unknown,
  ctx: OpnirMatchContext,
): OpnirReviewItem | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const officialRaw = record.official;
  if (
    officialRaw == null ||
    typeof officialRaw !== "object" ||
    Array.isArray(officialRaw)
  ) {
    return null;
  }
  const { official, errors } = officialFromObject(
    officialRaw as Record<string, unknown>,
  );
  if (errors.length > 0) return null;
  const origin =
    record.origin === "fixture" || record.origin === "stored-pays"
      ? record.origin
      : "paste";
  return toReviewItem(official, origin, ctx);
}

/** Prefill for paste-intake. Program fields stay empty until a human fills them. */
export function intakeFormFromOpnirItem(item: OpnirReviewItem): {
  from: string;
  to: string;
  type: "pays";
  asOf: string;
  source: string;
  quotation: string;
  year: string;
  amountValue: string;
  amountUnit: "ISK";
  amountBasis: "invoice";
  amountQuotation: string;
  program: "";
  programNullReason: "";
  programSource: "";
  programQuotation: "";
} {
  return {
    from: item.suggestedFrom ?? "",
    to: item.suggestedTo ?? "",
    type: "pays",
    asOf: item.official.date,
    source: item.official.source,
    quotation: item.official.quotation,
    year: yearFromOpnirDate(item.official.date),
    amountValue: String(item.official.amountValue),
    amountUnit: "ISK",
    amountBasis: "invoice",
    amountQuotation: item.official.quotation,
    program: "",
    programNullReason: "",
    programSource: "",
    programQuotation: "",
  };
}
