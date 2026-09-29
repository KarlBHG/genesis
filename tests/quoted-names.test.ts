import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getCatalog, getOffices } from "@/lib/content";
import { checkRawEdge, endpointExists } from "@/lib/edge-contract";
import { catalogContextFrom, intakePersistAllowed } from "@/lib/edge-intake";
import {
  assertQuotedNameLedger,
  checkQuotedName,
  enqueueQuotedName,
  formToQuotedName,
  quotedNameCaption,
  readQuotedNameQueue,
} from "@/lib/quoted-names";

const ROOT = process.cwd();

function ctx() {
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

function unmatchedInput() {
  return {
    printedName: "Nowhere ehf.",
    source: "https://opnirreikningar.is/",
    quotation:
      "Nowhere ehf. is printed as a vendor on an official invoice row that names no catalog slug.",
    asOf: "2026-01-30",
    suggestedType: "pays",
  };
}

describe("quoted-name ledger", () => {
  it("keeps primary nav at ten leaves and intake off that bar", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/intake");
    expect(hrefs).not.toContain("/public-entities");
    expect(hrefs.some((href) => href.includes("quoted"))).toBe(false);
  });

  it("accepts an unmatched printed name that is not a catalog slug or office", () => {
    const checked = checkQuotedName(formToQuotedName(unmatchedInput()), {
      ...ctx(),
      where: "quoted name",
    });
    expect(checked.ok, checked.ok ? "" : checked.errors.join("; ")).toBe(true);
    if (!checked.ok) return;
    expect(checked.statement.status).toBe("unmatched");
    expect(checked.statement.suggestedType).toBe("pays");
    expect(endpointExists(checked.statement.printedName, ctx())).toBe(false);
  });

  it("refuses a catalog slug, a unique title match, and an invented type", () => {
    const catalog = ctx();
    const slug = checkQuotedName(
      formToQuotedName({
        printedName: "althingi",
        source: "https://www.althingi.is/",
        quotation: "althingi is printed as a slug, not as a leftover name.",
        asOf: "2026",
      }),
      { ...catalog, where: "quoted name" },
    );
    expect(slug.ok).toBe(false);
    if (!slug.ok) {
      expect(slug.errors.some((error) => error.includes("catalog slug"))).toBe(
        true,
      );
    }

    const title = checkQuotedName(
      formToQuotedName({
        printedName: "Síminn",
        source: "https://www.siminn.is/",
        quotation: "Síminn is printed as the vendor on the buyer ledger.",
        asOf: "2026",
      }),
      { ...catalog, where: "quoted name" },
    );
    expect(title.ok).toBe(false);
    if (!title.ok) {
      expect(
        title.errors.some((error) => error.includes("uniquely matches")),
      ).toBe(true);
    }

    const invented = checkQuotedName(
      formToQuotedName({
        ...unmatchedInput(),
        suggestedType: "linked-to",
      }),
      { ...catalog, where: "quoted name" },
    );
    expect(invented.ok).toBe(false);
    if (!invented.ok) {
      expect(invented.errors.some((error) => error.includes("unknown type"))).toBe(
        true,
      );
    }
  });

  it("reuses paste-intake source, quotation, and stub-player refusals", () => {
    const catalog = ctx();
    expect(
      checkQuotedName(
        formToQuotedName({
          ...unmatchedInput(),
          source: "javascript:alert(1)",
        }),
        { ...catalog, where: "quoted name" },
      ).ok,
    ).toBe(false);
    expect(
      checkQuotedName(
        formToQuotedName({
          ...unmatchedInput(),
          quotation: "A sentence that never prints the leftover vendor.",
        }),
        { ...catalog, where: "quoted name" },
      ).ok,
    ).toBe(false);
    expect(
      checkQuotedName(
        {
          ...formToQuotedName(unmatchedInput()),
          player: "ghost-vendor",
        },
        { ...catalog, where: "quoted name" },
      ).ok,
    ).toBe(false);
    expect(
      checkQuotedName(
        {
          ...formToQuotedName(unmatchedInput()),
          status: "matched",
        },
        { ...catalog, where: "quoted name" },
      ).ok,
    ).toBe(false);
  });

  it("does not make a placeholder an endpoint the edge loader will accept", () => {
    const catalog = ctx();
    const checked = checkQuotedName(formToQuotedName(unmatchedInput()), {
      ...catalog,
      where: "quoted name",
    });
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const edge = checkRawEdge(
      {
        from: "althingi",
        to: checked.statement.printedName,
        type: "pays",
        asOf: "2026-01-30",
        source: "https://opnirreikningar.is/",
        quotation: checked.statement.quotation,
        year: "2026",
        program: null,
        programNullReason: "placeholder is not an endpoint",
      },
      { ...catalog, where: "proposal" },
    );
    expect(edge.ok).toBe(false);
    if (!edge.ok) {
      expect(edge.errors.some((error) => error.includes("does not exist"))).toBe(
        true,
      );
    }
  });

  it("queues a placeholder without writing edges.json or a player file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alltikerfi-quoted-"));
    const queueFile = path.join(dir, "quoted-names.json");
    const edgesPath = path.join(ROOT, "data", "edges.json");
    const playersDir = path.join(ROOT, "content", "players");
    const beforeEdges = fs.readFileSync(edgesPath);
    const beforeStat = fs.statSync(edgesPath);
    const beforePlayers = fs.readdirSync(playersDir);
    const catalog = ctx();
    const checked = checkQuotedName(formToQuotedName(unmatchedInput()), {
      ...catalog,
      where: "quoted name",
    });
    expect(checked.ok, checked.ok ? "" : checked.errors.join("; ")).toBe(true);
    if (!checked.ok) return;
    const { item, created } = enqueueQuotedName(checked.statement, {
      file: queueFile,
      now: new Date("2026-09-29T12:00:00.000Z"),
    });
    expect(created).toBe(true);
    expect(item.statement.status).toBe("unmatched");
    const again = enqueueQuotedName(checked.statement, { file: queueFile });
    expect(again.created).toBe(false);
    assertQuotedNameLedger(readQuotedNameQueue(queueFile), catalog);
    expect(fs.readFileSync(edgesPath).equals(beforeEdges)).toBe(true);
    expect(fs.statSync(edgesPath).mtimeMs).toBe(beforeStat.mtimeMs);
    expect(fs.readdirSync(playersDir)).toEqual(beforePlayers);
    expect(fs.existsSync(path.join(dir, "edges.json"))).toBe(false);
  });

  it("loads the committed queue as unmatched names, never krónur", () => {
    const queue = readQuotedNameQueue();
    expect(queue.version).toBe(1);
    expect(queue.items).toEqual([]);
    assertQuotedNameLedger(queue, ctx());
    const caption = quotedNameCaption(queue.items.length);
    expect(caption).toContain("unmatched");
    expect(caption).toContain("not krónur");
    expect(caption).not.toMatch(/\b(ISK|mkr|makr|USD)\b/);
    expect(queue.items.every((item) => item.statement.status === "unmatched")).toBe(
      true,
    );
  });

  it("does not scrape, fetch, or call a model from the quoted-name modules", () => {
    const files = [
      "lib/quoted-name-contract.ts",
      "lib/quoted-names.ts",
      "app/api/intake/quoted-names/route.ts",
      "components/quoted-name-ledger.tsx",
      "app/intake/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*input\.(source|url)/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
    const api = fs.readFileSync(
      path.join(ROOT, "app/api/intake/quoted-names/route.ts"),
      "utf8",
    );
    expect(api).not.toMatch(/\bawait fetch\(/);
    expect(intakePersistAllowed({ NODE_ENV: "production" })).toBe(false);
  });

  it("is not read by map or connection drawing", () => {
    const files = [
      "lib/map-graph.ts",
      "lib/geo-map.ts",
      "components/connection-graph.tsx",
      "components/connections/connection-edge.ts",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/quoted-name/);
    }
  });
});
