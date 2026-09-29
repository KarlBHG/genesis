import fs from "fs";
import path from "path";

import {
  EMPTY_OPNIR_REVIEW_QUEUE,
  OPNIR_REVIEW_QUEUE_RELATIVE,
  type OpnirReviewItem,
  type OpnirReviewQueueFile,
} from "@/lib/opnir-feed";

export function opnirReviewQueuePath(root = process.cwd()): string {
  return path.join(root, OPNIR_REVIEW_QUEUE_RELATIVE);
}

function readQueueFile(file: string): OpnirReviewQueueFile {
  if (!fs.existsSync(file)) return { ...EMPTY_OPNIR_REVIEW_QUEUE, items: [] };
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    parsed == null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as OpnirReviewQueueFile).version !== 1 ||
    !Array.isArray((parsed as OpnirReviewQueueFile).items)
  ) {
    throw new Error(`${OPNIR_REVIEW_QUEUE_RELATIVE} must be a version-1 queue object`);
  }
  return parsed as OpnirReviewQueueFile;
}

function writeQueueFile(file: string, queue: OpnirReviewQueueFile): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(queue, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

export function readOpnirReviewQueue(file?: string): OpnirReviewQueueFile {
  return readQueueFile(file ?? opnirReviewQueuePath());
}

export function enqueueOpnirReviewItems(
  items: readonly OpnirReviewItem[],
  options?: { file?: string },
): { queue: OpnirReviewQueueFile; added: number } {
  const file = options?.file ?? opnirReviewQueuePath();
  const queue = readQueueFile(file);
  const existing = new Set(queue.items.map((item) => item.id));
  const nextItems = [...queue.items];
  let added = 0;
  for (const item of items) {
    if (existing.has(item.id)) continue;
    nextItems.push({ ...item, status: "needs-program" });
    existing.add(item.id);
    added += 1;
  }
  const next: OpnirReviewQueueFile = {
    ...EMPTY_OPNIR_REVIEW_QUEUE,
    items: nextItems,
  };
  writeQueueFile(file, next);
  return { queue: next, added };
}
