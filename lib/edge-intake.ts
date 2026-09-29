import fs from "fs";
import path from "path";

import {
  checkRawEdge,
  catalogEntryOf,
  toEdgesJsonRow,
  type CheckedEdgeFields,
  type EdgeCatalogContext,
  type EdgeCheckResult,
} from "@/lib/edge-contract";
import { edgeId } from "@/lib/edge-id";
import type { Entry, OfficeRecord } from "@/lib/types";

export const INTAKE_QUEUE_RELATIVE = "data/intake-queue.json";

export type IntakeQueueItem = {
  id: string;
  proposedAt: string;
  status: "queued";
  row: Record<string, unknown>;
};

export type IntakeQueueFile = {
  version: 1;
  note: string;
  items: IntakeQueueItem[];
};

export const EMPTY_INTAKE_QUEUE: IntakeQueueFile = {
  version: 1,
  note: "Human-proposed edges awaiting review. This file is not loaded as catalog. Copy a row into data/edges.json only after the six fields, allowlisted type, endpoints, and amount-quotation checks would pass.",
  items: [],
};

export function intakeQueuePath(root = process.cwd()): string {
  return path.join(root, INTAKE_QUEUE_RELATIVE);
}

export function catalogContextFrom(
  entries: readonly Entry[],
  offices: readonly OfficeRecord[],
): EdgeCatalogContext {
  return {
    bySlug: new Map(entries.map((entry) => [entry.slug, catalogEntryOf(entry)])),
    offices: new Map(
      offices.map((office) => [
        office.id,
        { id: office.id, organization: office.organization },
      ]),
    ),
  };
}

export function checkIntakeProposal(
  item: unknown,
  ctx: EdgeCatalogContext,
): EdgeCheckResult {
  return checkRawEdge(item, { ...ctx, where: "proposal" });
}

/** Local/dev only. Production is a read-only atlas. */
export function intakePersistAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV !== "production";
}

function readQueueFile(file: string): IntakeQueueFile {
  if (!fs.existsSync(file)) return { ...EMPTY_INTAKE_QUEUE, items: [] };
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    parsed == null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as IntakeQueueFile).version !== 1 ||
    !Array.isArray((parsed as IntakeQueueFile).items)
  ) {
    throw new Error(`${INTAKE_QUEUE_RELATIVE} must be a version-1 queue object`);
  }
  return parsed as IntakeQueueFile;
}

function sameRow(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function enqueueCheckedEdge(
  fields: CheckedEdgeFields,
  options?: { file?: string; now?: Date },
): { item: IntakeQueueItem; created: boolean } {
  const file = options?.file ?? intakeQueuePath();
  const row = toEdgesJsonRow(fields);
  const queue = readQueueFile(file);
  const existing = queue.items.find((item) => sameRow(item.row, row));
  if (existing) return { item: existing, created: false };

  const proposedAt = (options?.now ?? new Date()).toISOString();
  const item: IntakeQueueItem = {
    id: `intake-${edgeId({
      from: fields.from,
      relationship: fields.relationship,
      to: fields.to,
      asOf: fields.asOf,
      start: fields.start,
      quotation: fields.quotation,
    })}-${proposedAt.replace(/[:.]/g, "").slice(0, 15)}`,
    proposedAt,
    status: "queued",
    row,
  };
  const next: IntakeQueueFile = {
    ...EMPTY_INTAKE_QUEUE,
    items: [...queue.items, item],
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  fs.renameSync(tmp, file);
  return { item, created: true };
}

export function readIntakeQueue(file?: string): IntakeQueueFile {
  return readQueueFile(file ?? intakeQueuePath());
}
