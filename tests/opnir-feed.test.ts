import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getCatalog, getEdges, getOffices } from "@/lib/content";
import { checkIntakeProposal, catalogContextFrom } from "@/lib/edge-intake";
import { formToRawEdge } from "@/lib/edge-contract";
import { KENNITALA_RECORDS } from "@/lib/identifiers";
import {
  buildOpnirMatchContext,
  intakeFormFromOpnirItem,
  officialRowsFromStoredPays,
  parseOfficialOpnirPaste,
  parseOpnirFixture,
  programFromPrintedMalaflok,
  type OpnirFixtureFile,
} from "@/lib/opnir-feed";
import { enqueueOpnirReviewItems } from "@/lib/opnir-review";

const ROOT = process.cwd();

function ctx() {
  return buildOpnirMatchContext({
    names: [
      ...getCatalog().map((entry) => ({ id: entry.slug, title: entry.title })),
      ...getOffices().map((office) => ({ id: office.id, title: office.title })),
    ],
    kennitalaRecords: KENNITALA_RECORDS,
    paysEdges: getEdges(),
  });
}

describe("reviewed Opnir official row feed", () => {
  it("parses official JSON, CSV, and ledger lines without a program join", () => {
    const catalog = ctx();
    const json = parseOfficialOpnirPaste(
      JSON.stringify([
        {
          kaupandi: "Landspítali",
          dagsetning: "2026-08-25",
          seljandi: "Íslandsbanki hf.",
          reikningsnumer: "3546720",
          upphaed: 245,
          malaflokkur: "23.1",
          program: "policy-area-23-sjukrahusthjonusta",
        },
      ]),
      catalog,
    );
    expect(json.ok).toBe(true);
    expect(json.items).toHaveLength(1);
    const row = json.items[0]!;
    expect(row.status).toBe("needs-program");
    expect(row.official.buyer).toBe("Landspítali");
    expect(row.official.amountValue).toBe(245);
    expect(row.official.malaflokkur).toBe("23.1");
    expect(row.official.discardedProgram).toBe(true);
    expect(programFromPrintedMalaflok(row.official.malaflokkur)).toBeNull();
    expect(row.suggestedFrom).toBe("landspitali");
    expect(row.suggestedTo).toBe("islandsbanki");
    const form = intakeFormFromOpnirItem(row);
    expect(form.type).toBe("pays");
    expect(form.program).toBe("");
    expect(form.programNullReason).toBe("");
    expect(form.programSource).toBe("");
    expect("program" in form ? form.program : "missing").toBe("");

    const csv = parseOfficialOpnirPaste(
      "kaupandi,dagsetning,seljandi,reikningsnúmer,upphæð\nLandspítali,2026-08-25,Íslandsbanki hf.,3546720,245",
      catalog,
    );
    expect(csv.ok, csv.errors.join("; ")).toBe(true);
    expect(csv.items[0]?.official.quotation).toBe(
      "Landspítali; 2026-08-25; Íslandsbanki hf.; 3546720; 245",
    );
    expect(csv.items[0]?.official.malaflokkur).toBeNull();

    const lines = parseOfficialOpnirPaste(
      "Forsætisráðuneyti, aðalskrifstofa; 2026-08-10; Síminn hf.; 0615317321; 8994",
      catalog,
    );
    expect(lines.ok).toBe(true);
    expect(lines.items[0]?.suggestedFrom).toBe("prime-ministers-office");
    expect(lines.items[0]?.suggestedTo).toBe("siminn");
  });

  it("loads the bundled fixture and stored pays without inventing a málaflok", () => {
    const catalog = ctx();
    const fixture = JSON.parse(
      fs.readFileSync(path.join(ROOT, "data", "opnir-feed-fixture.json"), "utf8"),
    ) as OpnirFixtureFile;
    const parsed = parseOpnirFixture(fixture, catalog);
    expect(parsed.ok).toBe(true);
    expect(parsed.items.length).toBe(3);
    for (const item of parsed.items) {
      expect(item.origin).toBe("fixture");
      expect(intakeFormFromOpnirItem(item).program).toBe("");
      expect(programFromPrintedMalaflok(item.official.malaflokkur)).toBeNull();
    }

    const stored = officialRowsFromStoredPays(getEdges(), catalog);
    expect(stored.length).toBeGreaterThan(20);
    expect(stored.every((item) => item.origin === "stored-pays")).toBe(true);
    expect(
      stored.every((item) => intakeFormFromOpnirItem(item).program === ""),
    ).toBe(true);
    expect(
      stored.some((item) => item.official.discardedProgram),
    ).toBe(true);
  });

  it("refuses a pays proposal until a human sets program or a null reason", () => {
    const catalog = ctx();
    const parsed = parseOfficialOpnirPaste(
      "Landspítali; 2026-08-25; Íslandsbanki hf.; 3546720; 245",
      catalog,
    );
    const form = intakeFormFromOpnirItem(parsed.items[0]!);
    const unchecked = checkIntakeProposal(
      formToRawEdge(form),
      catalogContextFrom(getCatalog(), getOffices()),
    );
    expect(unchecked.ok).toBe(false);
    if (!unchecked.ok) {
      expect(unchecked.errors.some((error) => error.includes("program"))).toBe(
        true,
      );
    }

    const joined = checkIntakeProposal(
      formToRawEdge({
        ...form,
        program: "policy-area-23-sjukrahusthjonusta",
        programSource:
          "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/fjarlog-fyrir-arid-2026/greinargerdir-raduneyta/greinargerd/23-sjukrahusthjonusta/",
        programQuotation:
          "allar fjárveitingar til þessara tveggja stofnana eru undir málaflokki 23.1.",
      }),
      catalogContextFrom(getCatalog(), getOffices()),
    );
    expect(joined.ok, joined.ok ? "" : joined.errors.join("; ")).toBe(true);

    const nulled = checkIntakeProposal(
      formToRawEdge({
        ...form,
        program: "__none__",
        programNullReason:
          "The buyer ledger prints this invoice row without a málaflok heading.",
      }),
      catalogContextFrom(getCatalog(), getOffices()),
    );
    expect(nulled.ok, nulled.ok ? "" : nulled.errors.join("; ")).toBe(true);
  });

  it("queues official rows without writing edges.json", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alltikerfi-opnir-"));
    const queueFile = path.join(dir, "opnir-review-queue.json");
    const edgesPath = path.join(ROOT, "data", "edges.json");
    const before = fs.readFileSync(edgesPath);
    const beforeStat = fs.statSync(edgesPath);
    const parsed = parseOfficialOpnirPaste(
      "Landspítali; 2026-08-25; Íslandsbanki hf.; 3546720; 245",
      ctx(),
    );
    const { added } = enqueueOpnirReviewItems(parsed.items, { file: queueFile });
    expect(added).toBe(1);
    const again = enqueueOpnirReviewItems(parsed.items, { file: queueFile });
    expect(again.added).toBe(0);
    expect(fs.readFileSync(edgesPath).equals(before)).toBe(true);
    expect(fs.statSync(edgesPath).mtimeMs).toBe(beforeStat.mtimeMs);
    expect(fs.existsSync(path.join(dir, "edges.json"))).toBe(false);
    const saved = JSON.parse(fs.readFileSync(queueFile, "utf8")) as {
      items: { official: { amountValue: number } }[];
    };
    const total = saved.items.reduce((sum, item) => sum + item.official.amountValue, 0);
    expect(total).toBe(245);
    expect(fs.readFileSync(queueFile, "utf8")).not.toMatch(/sum|total/i);
  });

  it("does not scrape, fetch the ledger, or call a model", () => {
    const files = [
      "lib/opnir-feed.ts",
      "lib/opnir-review.ts",
      "app/api/intake/opnir/route.ts",
      "components/opnir-review-feed.tsx",
      "app/intake/opnir/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/opnirreikningar\.is\/rest/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"]https?:\/\//);
    }
    const api = fs.readFileSync(
      path.join(ROOT, "app/api/intake/opnir/route.ts"),
      "utf8",
    );
    expect(api).not.toMatch(/\bawait fetch\(/);
    const ui = fs.readFileSync(
      path.join(ROOT, "components/opnir-review-feed.tsx"),
      "utf8",
    );
    expect(ui).toMatch(/fetch\("\/api\/intake\/opnir"/);
    expect(ui).not.toMatch(/reduce\s*\(/);
  });

  it("keeps the Opnir feed off the primary nav", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/intake");
    expect(hrefs).not.toContain("/intake/opnir");
    expect(hrefs.some((href) => href.includes("quoted"))).toBe(false);
  });
});
