import { NextResponse } from "next/server";

import { getCatalog, getOffices } from "@/lib/content";
import { formToRawEdge, type IntakeFormInput } from "@/lib/edge-contract";
import {
  catalogContextFrom,
  checkIntakeProposal,
  enqueueCheckedEdge,
  intakePersistAllowed,
  readIntakeQueue,
} from "@/lib/edge-intake";

function context() {
  return catalogContextFrom(getCatalog(), getOffices());
}

export function GET() {
  const queue = intakePersistAllowed()
    ? readIntakeQueue()
    : { version: 1 as const, note: "Queue is local/dev only.", items: [] };
  return NextResponse.json({
    persistAllowed: intakePersistAllowed(),
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
      { ok: false, errors: ["proposal must be JSON"] },
      { status: 400 },
    );
  }
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, errors: ["proposal must be an object"] },
      { status: 400 },
    );
  }
  const payload = body as IntakeFormInput & { persist?: boolean };
  const raw = formToRawEdge(payload);
  const checked = checkIntakeProposal(raw, context());
  if (!checked.ok) {
    return NextResponse.json(
      { ok: false, errors: checked.errors },
      { status: 422 },
    );
  }

  const persist = payload.persist === true;
  if (!persist) {
    return NextResponse.json({
      ok: true,
      queued: false,
      persistAllowed: intakePersistAllowed(),
      row: raw,
    });
  }
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

  const { item, created } = enqueueCheckedEdge(checked.fields);
  return NextResponse.json({
    ok: true,
    queued: true,
    created,
    persistAllowed: true,
    id: item.id,
    row: item.row,
    file: "data/intake-queue.json",
  });
}
