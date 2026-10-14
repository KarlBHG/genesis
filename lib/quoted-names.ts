import fs from "fs";
import path from "path";
import { createHash } from "crypto";

import { endpointExists } from "@/lib/edge-contract";
import {
  EMPTY_QUOTED_NAME_QUEUE,
  QUOTED_NAMES_RELATIVE,
  QUOTED_NAME_STATUS,
  checkQuotedName,
  type QuotedNameCatalogContext,
  type QuotedNameQueueFile,
  type QuotedNameQueueItem,
  type QuotedNameStatement,
} from "@/lib/quoted-name-contract";

export {
  EMPTY_QUOTED_NAME_QUEUE,
  QUOTED_NAMES_RELATIVE,
  QUOTED_NAME_STATUS,
  checkQuotedName,
  formToQuotedName,
  quotedNameCaption,
} from "@/lib/quoted-name-contract";
export type {
  QuotedNameCatalogContext,
  QuotedNameCheckResult,
  QuotedNameFormInput,
  QuotedNameQueueFile,
  QuotedNameQueueItem,
  QuotedNameStatement,
  QuotedNameStatus,
} from "@/lib/quoted-name-contract";

export function quotedNamesPath(root = process.cwd()): string {
  return path.join(root, QUOTED_NAMES_RELATIVE);
}

function statementKey(statement: QuotedNameStatement): string {
  return [
    statement.printedName,
    statement.source,
    statement.quotation,
    statement.asOf,
  ].join("\u001f");
}

function quotedNameId(
  statement: QuotedNameStatement,
  proposedAt: string,
): string {
  const digest = createHash("sha256")
    .update(statementKey(statement))
    .digest("hex")
    .slice(0, 12);
  return `quoted-${digest}-${proposedAt.replace(/[:.]/g, "").slice(0, 15)}`;
}

function readQueueFile(file: string): QuotedNameQueueFile {
  if (!fs.existsSync(file)) return { ...EMPTY_QUOTED_NAME_QUEUE, items: [] };
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    parsed == null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as QuotedNameQueueFile).version !== 1 ||
    !Array.isArray((parsed as QuotedNameQueueFile).items)
  ) {
    throw new Error(`${QUOTED_NAMES_RELATIVE} must be a version-1 queue object`);
  }
  return parsed as QuotedNameQueueFile;
}

function writeQueueFile(file: string, queue: QuotedNameQueueFile): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(queue, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

export function readQuotedNameQueue(file?: string): QuotedNameQueueFile {
  return readQueueFile(file ?? quotedNamesPath());
}

export function enqueueQuotedName(
  statement: QuotedNameStatement,
  options?: { file?: string; now?: Date },
): { item: QuotedNameQueueItem; created: boolean } {
  const file = options?.file ?? quotedNamesPath();
  const queue = readQueueFile(file);
  const key = statementKey(statement);
  const existing = queue.items.find(
    (item) => statementKey(item.statement) === key,
  );
  if (existing) return { item: existing, created: false };

  const proposedAt = (options?.now ?? new Date()).toISOString();
  const item: QuotedNameQueueItem = {
    id: quotedNameId(statement, proposedAt),
    proposedAt,
    statement: { ...statement, status: QUOTED_NAME_STATUS },
  };
  const next: QuotedNameQueueFile = {
    ...EMPTY_QUOTED_NAME_QUEUE,
    items: [...queue.items, item],
  };
  writeQueueFile(file, next);
  return { item, created: true };
}

export function assertQuotedNameLedger(
  queue: QuotedNameQueueFile,
  ctx: QuotedNameCatalogContext,
): void {
  if (queue.version !== 1) {
    throw new Error(`${QUOTED_NAMES_RELATIVE} must be version 1`);
  }
  const seenIds = new Set<string>();
  for (const [index, item] of queue.items.entries()) {
    const where = `${QUOTED_NAMES_RELATIVE} item ${index + 1}`;
    if (!item.id?.trim()) throw new Error(`${where} is missing id`);
    if (seenIds.has(item.id)) {
      throw new Error(`${where} duplicate id ${item.id}`);
    }
    seenIds.add(item.id);
    const checked = checkQuotedName(item.statement, { ...ctx, where });
    if (!checked.ok) throw new Error(checked.errors.join("; "));
    if (endpointExists(item.statement.printedName, ctx)) {
      throw new Error(
        `${where} printed name "${item.statement.printedName}" cannot be an endpoint`,
      );
    }
  }
}
