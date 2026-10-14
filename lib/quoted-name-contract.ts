import {
  RELATIONSHIPS,
  endpointExists,
  type EdgeCatalogContext,
} from "@/lib/edge-contract";
import { uniqueNameMatch, type OpnirNameHint } from "@/lib/opnir-feed";
import { isHttpUrl } from "@/lib/safe-href";
import type { Relationship } from "@/lib/types";

export const QUOTED_NAMES_RELATIVE = "data/quoted-names.json";

export const QUOTED_NAME_STATUS = "unmatched" as const;
export type QuotedNameStatus = typeof QUOTED_NAME_STATUS;

export type QuotedNameStatement = {
  printedName: string;
  source: string;
  quotation: string;
  asOf: string;
  suggestedType: Relationship | null;
  status: QuotedNameStatus;
};

export type QuotedNameQueueItem = {
  id: string;
  proposedAt: string;
  statement: QuotedNameStatement;
};

export type QuotedNameQueueFile = {
  version: 1;
  note: string;
  items: QuotedNameQueueItem[];
};

export type QuotedNameCheckResult =
  | { ok: true; statement: QuotedNameStatement }
  | { ok: false; errors: string[] };

export type QuotedNameFormInput = {
  printedName: string;
  source: string;
  quotation: string;
  asOf: string;
  suggestedType?: string;
};

export type QuotedNameCatalogContext = EdgeCatalogContext & {
  names: readonly OpnirNameHint[];
};

export const EMPTY_QUOTED_NAME_QUEUE: QuotedNameQueueFile = {
  version: 1,
  note: "Printed names from cited sentences that have no catalog slug and no office id. This file is not loaded as catalog. Unmatched stays unmatched. Do not create a player. Do not draw a dashed edge. A later human files the catalog page from the same quotation, then pastes the six-field row. A model must not pick the type or invent a slug.",
  items: [],
};

const KNOWN_STATEMENT_KEYS = new Set([
  "printedName",
  "source",
  "quotation",
  "asOf",
  "suggestedType",
  "status",
]);

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

export function formToQuotedName(
  input: QuotedNameFormInput,
): Record<string, unknown> {
  const suggested = input.suggestedType?.trim() ?? "";
  return {
    printedName: input.printedName?.trim() ?? "",
    source: input.source?.trim() ?? "",
    quotation: input.quotation?.trim() ?? "",
    asOf: input.asOf?.trim() ?? "",
    suggestedType: suggested || null,
    status: QUOTED_NAME_STATUS,
  };
}

/**
 * A placeholder is a cited name that is not an endpoint. Reuses the same
 * http(s), allowlist, and endpointExists checks as paste-intake — and refuses
 * when those checks would *accept* the name as from/to.
 */
export function checkQuotedName(
  item: unknown,
  ctx: QuotedNameCatalogContext & { where: string },
): QuotedNameCheckResult {
  const { where } = ctx;
  const errors: string[] = [];
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    return { ok: false, errors: [`${where} must be an object`] };
  }
  const row = item as Record<string, unknown>;
  for (const key of Object.keys(row)) {
    if (!KNOWN_STATEMENT_KEYS.has(key)) {
      errors.push(`${where} has unknown field "${key}"`);
    }
  }
  for (const forbidden of ["from", "to", "slug", "catalogSlug", "player"]) {
    if (forbidden in row) {
      errors.push(
        `${where} cannot set ${forbidden}; a placeholder is not a player or an edge`,
      );
    }
  }

  const printedName = requireTrimmed(row, "printedName", where, errors);
  const asOf = requireTrimmed(row, "asOf", where, errors);
  const sourceRaw = requireTrimmed(row, "source", where, errors);
  const quotation = requireTrimmed(row, "quotation", where, errors);

  let source = sourceRaw;
  if (sourceRaw && !isHttpUrl(sourceRaw)) {
    errors.push(`${where} source must be an http(s) address`);
    source = "";
  }

  if (printedName && quotation && !quotation.includes(printedName)) {
    errors.push(`${where} quotation does not print the name`);
  }

  if (printedName && endpointExists(printedName, ctx)) {
    errors.push(
      `${where} printed name "${printedName}" is already a catalog slug or office id. Paste a six-field row instead of a placeholder.`,
    );
  }
  if (printedName) {
    const unique = uniqueNameMatch(printedName, ctx.names);
    if (unique) {
      errors.push(
        `${where} printed name "${printedName}" uniquely matches catalog title ${unique}. Paste a six-field row instead of a placeholder.`,
      );
    }
  }

  let suggestedType: Relationship | null = null;
  if ("suggestedType" in row && row.suggestedType != null) {
    if (typeof row.suggestedType !== "string" || !row.suggestedType.trim()) {
      errors.push(`${where} suggestedType must be an allowlisted type or null`);
    } else if (!RELATIONSHIPS.has(row.suggestedType.trim() as Relationship)) {
      errors.push(
        `${where} has unknown type "${row.suggestedType.trim()}". A model must not invent a type.`,
      );
    } else {
      suggestedType = row.suggestedType.trim() as Relationship;
    }
  }

  if ("status" in row && row.status != null && row.status !== QUOTED_NAME_STATUS) {
    errors.push(
      `${where} status must be unmatched. Unmatched stays unmatched.`,
    );
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    statement: {
      printedName,
      source,
      quotation,
      asOf,
      suggestedType,
      status: QUOTED_NAME_STATUS,
    },
  };
}

export function quotedNameCaption(count: number): string {
  const word = count === 1 ? "name" : "names";
  return `${count} unmatched ${word}. Not catalogued. Not stubbed. Not drawn. Counts are names, not krónur.`;
}
