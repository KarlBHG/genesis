import { NextResponse } from "next/server";

import { getCatalog, getOffices } from "@/lib/content";
import { catalogContextFrom, intakePersistAllowed } from "@/lib/edge-intake";
import {
  QUOTED_NAMES_RELATIVE,
  checkQuotedName,
  enqueueQuotedName,
  formToQuotedName,
  readQuotedNameQueue,
  type QuotedNameFormInput,
} from "@/lib/quoted-names";

function context() {
  const catalog = getCatalog();
  const offices = getOffices();
  return {
    ...catalogContextFrom(catalog, offices),
    names: [
      ...catalog.map((entry) => ({ id: entry.slug, title: entry.title })),
      ...offices.map((office) => ({ id: office.id, title: office.title })),
    ],
  };
}

export function GET() {
  const queue = readQuotedNameQueue();
  return NextResponse.json({
    persistAllowed: intakePersistAllowed(),
    unmatched: queue.items.length,
    items: queue.items,
    file: QUOTED_NAMES_RELATIVE,
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
  const payload = body as QuotedNameFormInput & { persist?: boolean };
  const raw = formToQuotedName(payload);
  const checked = checkQuotedName(raw, { ...context(), where: "quoted name" });
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
      statement: checked.statement,
    });
  }
  if (!intakePersistAllowed()) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          "Queuing is a local/dev action. It does not write a player, it does not write data/edges.json, and it is disabled in production.",
        ],
      },
      { status: 403 },
    );
  }

  const { item, created } = enqueueQuotedName(checked.statement);
  return NextResponse.json({
    ok: true,
    queued: true,
    created,
    persistAllowed: true,
    id: item.id,
    statement: item.statement,
    file: QUOTED_NAMES_RELATIVE,
  });
}
