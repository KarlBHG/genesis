import { NextResponse } from "next/server";

import { getCatalog, getEdges, getOffices } from "@/lib/content";
import { KENNITALA_RECORDS } from "@/lib/identifiers";
import { intakePersistAllowed } from "@/lib/edge-intake";
import {
  buildOpnirMatchContext,
  officialRowsFromStoredPays,
  parseOfficialOpnirPaste,
  parseOpnirFixture,
  sanitizeOpnirReviewItem,
  type OpnirFixtureFile,
  type OpnirReviewItem,
} from "@/lib/opnir-feed";
import {
  enqueueOpnirReviewItems,
  readOpnirReviewQueue,
} from "@/lib/opnir-review";
import fixtureJson from "@/data/opnir-feed-fixture.json";

function matchContext() {
  const catalog = getCatalog();
  const offices = getOffices();
  return buildOpnirMatchContext({
    names: [
      ...catalog.map((entry) => ({ id: entry.slug, title: entry.title })),
      ...offices.map((office) => ({ id: office.id, title: office.title })),
    ],
    kennitalaRecords: KENNITALA_RECORDS,
    paysEdges: getEdges(),
  });
}

function fixture(): OpnirFixtureFile {
  return fixtureJson as OpnirFixtureFile;
}

export function GET() {
  const persistAllowed = intakePersistAllowed();
  const queue = persistAllowed
    ? readOpnirReviewQueue()
    : { version: 1 as const, note: "Queue is local/dev only.", items: [] };
  return NextResponse.json({
    persistAllowed,
    queued: queue.items.length,
    items: queue.items,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["request must be JSON"] },
      { status: 400 },
    );
  }
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, errors: ["request must be an object"] },
      { status: 400 },
    );
  }
  const payload = body as { action?: string; text?: string; items?: unknown };
  const action = payload.action;
  const ctx = matchContext();

  if (action === "parse") {
    const text = typeof payload.text === "string" ? payload.text : "";
    const parsed = parseOfficialOpnirPaste(text, ctx, "paste");
    return NextResponse.json({
      ok: parsed.ok,
      errors: parsed.errors,
      items: parsed.items,
      persistAllowed: intakePersistAllowed(),
    });
  }

  if (action === "load-fixture") {
    const parsed = parseOpnirFixture(fixture(), ctx);
    return NextResponse.json({
      ok: parsed.ok,
      errors: parsed.errors,
      items: parsed.items,
      persistAllowed: intakePersistAllowed(),
    });
  }

  if (action === "load-stored-pays") {
    const items = officialRowsFromStoredPays(getEdges(), ctx);
    return NextResponse.json({
      ok: items.length > 0,
      errors: items.length > 0 ? [] : ["no stored Opnir pays rows"],
      items,
      persistAllowed: intakePersistAllowed(),
    });
  }

  if (action === "queue") {
    if (!intakePersistAllowed()) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            "Queuing is a local/dev action. It does not write data/edges.json, and it is disabled in production.",
          ],
        },
        { status: 403 },
      );
    }
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    const items: OpnirReviewItem[] = [];
    for (const raw of rawItems) {
      const item = sanitizeOpnirReviewItem(raw, ctx);
      if (item) items.push(item);
    }
    if (items.length === 0) {
      return NextResponse.json(
        { ok: false, errors: ["no official rows to queue"] },
        { status: 422 },
      );
    }
    const { queue, added } = enqueueOpnirReviewItems(items);
    return NextResponse.json({
      ok: true,
      added,
      queued: queue.items.length,
      items: queue.items,
      persistAllowed: true,
      file: "data/opnir-review-queue.json",
    });
  }

  return NextResponse.json(
    {
      ok: false,
      errors: [
        "action must be parse, load-fixture, load-stored-pays, or queue",
      ],
    },
    { status: 400 },
  );
}
