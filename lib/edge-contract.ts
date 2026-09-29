import { isHttpUrl } from "@/lib/safe-href";
import type {
  CareerChannel,
  EdgeAmount,
  Entry,
  Kind,
  MoneyBasis,
  MoneyUnit,
  OfficeRecord,
  Relationship,
} from "@/lib/types";

/**
 * The six fields a typed edge must carry. The catalog loader and the paste
 * intake both refuse a row that is missing any of them.
 */
export const REQUIRED_EDGE_FIELD_NAMES = [
  "from",
  "to",
  "type",
  "asOf",
  "source",
  "quotation",
] as const;

export type RequiredEdgeFieldName = (typeof REQUIRED_EDGE_FIELD_NAMES)[number];

export const RELATIONSHIP_LIST = [
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
] as const satisfies readonly Relationship[];

export const RELATIONSHIPS = new Set<Relationship>(RELATIONSHIP_LIST);

export const MONEY_UNITS = new Set<MoneyUnit>(["ISK", "mkr", "makr", "USD"]);

export const MONEY_BASES = new Set<MoneyBasis>([
  "authorisation",
  "invoice",
  "statement",
  "trade-release",
]);

export type EdgeCatalogEntry = Pick<Entry, "kind" | "slug"> & {
  playerType?: "organization" | "person";
};

export type EdgeCatalogOffice = Pick<OfficeRecord, "id" | "organization">;

export type EdgeCatalogContext = {
  bySlug: ReadonlyMap<string, EdgeCatalogEntry>;
  offices: ReadonlyMap<string, EdgeCatalogOffice>;
};

export type CheckedEdgeFields = {
  from: string;
  to: string;
  relationship: Relationship;
  asOf: string;
  source: string;
  quotation: string;
  start: string | null;
  end: string | null;
  channel: CareerChannel | null;
  year: string | null;
  program: string | null;
  programNullReason: string | null;
  programSource: string | null;
  programQuotation: string | null;
  amount?: EdgeAmount;
};

export type EdgeCheckResult =
  | { ok: true; fields: CheckedEdgeFields }
  | { ok: false; errors: string[] };

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

export function catalogEntryOf(entry: Entry): EdgeCatalogEntry {
  return {
    kind: entry.kind,
    slug: entry.slug,
    playerType: entry.kind === "player" ? entry.playerType : undefined,
  };
}

export function isCareerEdge(
  relationship: Relationship,
  fromPlayerType?: "organization" | "person",
): boolean {
  return (
    relationship === "holds-office" ||
    relationship === "sits-on-board" ||
    (relationship === "invests-in" && fromPlayerType === "person")
  );
}

export function endpointExists(
  slug: string,
  ctx: EdgeCatalogContext,
): boolean {
  return ctx.bySlug.has(slug) || ctx.offices.has(slug);
}

function requireTrimmed(
  row: Record<string, unknown>,
  key: string,
  where: string,
  errors: string[],
): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${where} is missing ${key}`);
    return "";
  }
  return value.trim();
}

function readAmount(
  row: Record<string, unknown>,
  quotation: string,
  where: string,
  errors: string[],
): EdgeAmount | undefined {
  if (!("amount" in row) || row.amount == null) return undefined;
  const amountWhere = `${where} amount`;
  const raw = row.amount;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    errors.push(`${amountWhere} must be an object`);
    return undefined;
  }
  const money = raw as Record<string, unknown>;
  for (const key of Object.keys(money)) {
    if (!["value", "unit", "basis", "quotation"].includes(key)) {
      errors.push(`${amountWhere} has unknown field "${key}"`);
    }
  }
  const { value, unit, basis } = money;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${amountWhere} value must be a finite number`);
  }
  if (typeof unit !== "string" || !MONEY_UNITS.has(unit as MoneyUnit)) {
    errors.push(`${amountWhere} has unknown unit "${String(unit)}"`);
  }
  if (typeof basis !== "string" || !MONEY_BASES.has(basis as MoneyBasis)) {
    errors.push(`${amountWhere} has unknown basis "${String(basis)}"`);
  }
  const cited = money.quotation;
  if (typeof cited !== "string" || !cited.trim()) {
    errors.push(`${amountWhere} is missing quotation`);
    return undefined;
  }
  const citation = cited.trim();
  if (!quotation.includes(citation)) {
    errors.push(`${amountWhere} quotation is not part of the edge quotation`);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (!quotationPrintsValue(value, citation)) {
      errors.push(
        `${amountWhere} value ${value} is not printed in its quotation`,
      );
    }
  }
  if (errors.some((item) => item.startsWith(amountWhere))) return undefined;
  return {
    value: value as number,
    unit: unit as MoneyUnit,
    basis: basis as MoneyBasis,
    quotation: citation,
  };
}

function readOptionalPaysString(
  row: Record<string, unknown>,
  key: string,
  where: string,
  errors: string[],
  asUrl = false,
): string | null | undefined {
  if (!(key in row)) return undefined;
  if (row[key] === null) return null;
  if (typeof row[key] === "string" && (row[key] as string).trim()) {
    const value = (row[key] as string).trim();
    if (asUrl && !isHttpUrl(value)) {
      errors.push(`${where} ${key} must be an http(s) address`);
      return undefined;
    }
    return value;
  }
  errors.push(`${where} ${key} must be a string or null`);
  return undefined;
}

/**
 * The same checks `lib/content.ts` runs on each `data/edges.json` row.
 * Collects every problem so a paste form can show them together. The loader
 * still throws the first error.
 */
export function checkRawEdge(
  item: unknown,
  ctx: EdgeCatalogContext & { where: string },
): EdgeCheckResult {
  const { where } = ctx;
  const errors: string[] = [];
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    return { ok: false, errors: [`${where} must be an object`] };
  }
  const row = item as Record<string, unknown>;
  const from = requireTrimmed(row, "from", where, errors);
  const to = requireTrimmed(row, "to", where, errors);
  const type = requireTrimmed(row, "type", where, errors);
  const asOf = requireTrimmed(row, "asOf", where, errors);
  const sourceRaw = requireTrimmed(row, "source", where, errors);
  const quotation = requireTrimmed(row, "quotation", where, errors);

  let source = sourceRaw;
  if (sourceRaw && !isHttpUrl(sourceRaw)) {
    errors.push(`${where} source must be an http(s) address`);
    source = "";
  }

  let relationship: Relationship | null = null;
  if (type) {
    if (!RELATIONSHIPS.has(type as Relationship)) {
      errors.push(`${where} has unknown type "${type}"`);
    } else {
      relationship = type as Relationship;
    }
  }

  if (from && to && from === to) {
    errors.push(`${where} points at itself`);
  }
  if (from && !endpointExists(from, ctx)) {
    errors.push(`${where} from "${from}" does not exist`);
  }
  if (to && !endpointExists(to, ctx)) {
    errors.push(`${where} to "${to}" does not exist`);
  }

  const fromEntry = ctx.bySlug.get(from);
  const office = ctx.offices.get(to);
  if (office && !ctx.bySlug.has(office.organization)) {
    errors.push(`${where} office "${to}" organization does not exist`);
  }

  let start: string | null = null;
  let end: string | null = null;
  let channel: CareerChannel | null = null;
  const career =
    relationship != null && isCareerEdge(relationship, fromEntry?.playerType);
  if (career) {
    start = requireTrimmed(row, "start", where, errors) || null;
    end = requireTrimmed(row, "end", where, errors) || null;
    const channelValue = requireTrimmed(row, "channel", where, errors);
    if (
      channelValue &&
      channelValue !== "political" &&
      channelValue !== "business"
    ) {
      errors.push(`${where} has unknown channel "${channelValue}"`);
    } else if (channelValue === "political" || channelValue === "business") {
      channel = channelValue;
    }
  }

  const amount = readAmount(row, quotation, where, errors);

  let year: string | null = null;
  let program: string | null = null;
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
        errors.push(`${where} year must be a string or integer`);
      }
    }
    if ("program" in row) {
      if (row.program === null) {
        program = null;
      } else if (typeof row.program === "string" && row.program.trim()) {
        program = row.program.trim();
        const programEntry = ctx.bySlug.get(program);
        if (!programEntry || programEntry.kind !== "flow") {
          errors.push(`${where} program "${program}" is not a money flow`);
        }
        if (program && !program.startsWith("policy-area-")) {
          errors.push(`${where} program must be a policy-area slug`);
        }
      } else {
        errors.push(`${where} program must be a slug or null`);
      }
    }
    const nullReason = readOptionalPaysString(
      row,
      "programNullReason",
      where,
      errors,
    );
    if (nullReason !== undefined) programNullReason = nullReason;
    const pSource = readOptionalPaysString(
      row,
      "programSource",
      where,
      errors,
      true,
    );
    if (pSource !== undefined) programSource = pSource;
    const pQuote = readOptionalPaysString(
      row,
      "programQuotation",
      where,
      errors,
    );
    if (pQuote !== undefined) programQuotation = pQuote;

    if (program != null) {
      if (programNullReason) {
        errors.push(
          `${where} cannot set programNullReason when program is set`,
        );
      }
      if (!programSource || !programQuotation) {
        errors.push(
          `${where} joined program needs programSource and programQuotation`,
        );
      }
    }
    if (program === null && "program" in row && !programNullReason) {
      errors.push(`${where} program null needs programNullReason`);
    }
    if (!year) errors.push(`${where} pays row is missing year`);
    if (!("program" in row)) {
      errors.push(`${where} pays row is missing program`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  if (!relationship) return { ok: false, errors: [`${where} is missing type`] };

  return {
    ok: true,
    fields: {
      from,
      to,
      relationship,
      asOf,
      source,
      quotation,
      start,
      end,
      channel,
      year,
      program,
      programNullReason,
      programSource,
      programQuotation,
      ...(amount ? { amount } : {}),
    },
  };
}

/** Shape a human would paste into `data/edges.json`. */
export function toEdgesJsonRow(
  fields: CheckedEdgeFields,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    from: fields.from,
    to: fields.to,
    type: fields.relationship,
    asOf: fields.asOf,
    source: fields.source,
    quotation: fields.quotation,
  };
  if (fields.start != null) row.start = fields.start;
  if (fields.end != null) row.end = fields.end;
  if (fields.channel != null) row.channel = fields.channel;
  if (fields.amount) row.amount = fields.amount;
  if (fields.relationship === "pays") {
    row.year = fields.year;
    row.program = fields.program;
    if (fields.programNullReason != null) {
      row.programNullReason = fields.programNullReason;
    }
    if (fields.programSource != null) row.programSource = fields.programSource;
    if (fields.programQuotation != null) {
      row.programQuotation = fields.programQuotation;
    }
  }
  return row;
}

export type IntakeFormInput = {
  from: string;
  to: string;
  type: string;
  asOf: string;
  source: string;
  quotation: string;
  start?: string;
  end?: string;
  channel?: string;
  amountValue?: string;
  amountUnit?: string;
  amountBasis?: string;
  amountQuotation?: string;
  year?: string;
  /** Policy-area slug, empty, or `__none__` for an explicit null join. */
  program?: string;
  programNullReason?: string;
  programSource?: string;
  programQuotation?: string;
};

function optionalTrim(value: string | undefined): string {
  return value?.trim() ?? "";
}

/**
 * Turn the paste form into the same object shape `data/edges.json` uses.
 * Blank optional groups are omitted so the loader's "field missing" rules apply.
 */
export function formToRawEdge(input: IntakeFormInput): Record<string, unknown> {
  const row: Record<string, unknown> = {
    from: optionalTrim(input.from),
    to: optionalTrim(input.to),
    type: optionalTrim(input.type),
    asOf: optionalTrim(input.asOf),
    source: optionalTrim(input.source),
    quotation: optionalTrim(input.quotation),
  };
  const start = optionalTrim(input.start);
  const end = optionalTrim(input.end);
  const channel = optionalTrim(input.channel);
  if (start) row.start = start;
  if (end) row.end = end;
  if (channel) row.channel = channel;

  const amountValue = optionalTrim(input.amountValue);
  const amountUnit = optionalTrim(input.amountUnit);
  const amountBasis = optionalTrim(input.amountBasis);
  const amountQuotation = optionalTrim(input.amountQuotation);
  if (amountValue || amountUnit || amountBasis || amountQuotation) {
    const parsed = Number(amountValue.replace(/\s/g, "").replace(",", "."));
    row.amount = {
      value: amountValue === "" ? NaN : parsed,
      unit: amountUnit,
      basis: amountBasis,
      quotation: amountQuotation,
    };
  }

  const type = optionalTrim(input.type);
  if (type === "pays") {
    const year = optionalTrim(input.year);
    if (year) row.year = year;
    const program = optionalTrim(input.program);
    if (program === "__none__") {
      row.program = null;
      const reason = optionalTrim(input.programNullReason);
      if (reason) row.programNullReason = reason;
    } else if (program) {
      row.program = program;
      const programSource = optionalTrim(input.programSource);
      const programQuotation = optionalTrim(input.programQuotation);
      if (programSource) row.programSource = programSource;
      if (programQuotation) row.programQuotation = programQuotation;
    }
  }
  return row;
}

export const KIND_GROUP_ORDER: { kind: Kind | "office"; label: string }[] = [
  { kind: "institution", label: "Institutions" },
  { kind: "player", label: "People and organisations" },
  { kind: "flow", label: "Money flows" },
  { kind: "treaty", label: "Treaties" },
  { kind: "event", label: "Events" },
  { kind: "sector", label: "Business" },
  { kind: "office", label: "Public offices" },
];
