import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import {
  getCatalog,
  getOffices,
  readCatalogFromSource,
} from "@/lib/content";
import {
  RELATIONSHIP_LIST,
  RELATIONSHIPS,
  checkRawEdge,
  formToRawEdge,
  quotationPrintsValue,
} from "@/lib/edge-contract";
import {
  catalogContextFrom,
  checkIntakeProposal,
  enqueueCheckedEdge,
  intakePersistAllowed,
} from "@/lib/edge-intake";
import { MAP_VIEWS } from "@/lib/geo-map";

const ROOT = process.cwd();

function rawEdges(): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "edges.json"), "utf8"),
  );
  if (!Array.isArray(parsed)) throw new Error("edges.json must be a list");
  return parsed as Record<string, unknown>[];
}

function ctx() {
  return catalogContextFrom(getCatalog(), getOffices());
}

describe("paste intake contract", () => {
  it("uses the same allowlist as the map views", () => {
    const mapped = new Set(
      MAP_VIEWS.flatMap((view) => [...view.relationships]),
    );
    expect([...RELATIONSHIPS].sort()).toEqual([...mapped].sort());
    expect(RELATIONSHIP_LIST).toHaveLength(RELATIONSHIPS.size);
  });

  it("accepts every stored edges.json row", () => {
    const catalog = ctx();
    for (const [index, row] of rawEdges().entries()) {
      const checked = checkRawEdge(row, {
        ...catalog,
        where: `data/edges.json edge ${index + 1}`,
      });
      expect(checked.ok, checked.ok ? "" : checked.errors.join("; ")).toBe(
        true,
      );
    }
  });

  it("still loads the catalog through the shared checker", () => {
    expect(readCatalogFromSource().edges.length).toBe(rawEdges().length);
  });

  it("refuses a row missing any of the six fields", () => {
    const base = {
      from: "althingi",
      to: "sedlabanki",
      type: "owns",
      asOf: "2026",
      source: "https://www.althingi.is/",
      quotation: "A sentence that names the two records.",
    };
    for (const key of ["from", "to", "type", "asOf", "source", "quotation"]) {
      const row = { ...base };
      delete row[key as keyof typeof row];
      const checked = checkIntakeProposal(row, ctx());
      expect(checked.ok).toBe(false);
      if (!checked.ok) {
        expect(checked.errors.some((error) => error.includes(key))).toBe(true);
      }
    }
  });

  it("refuses an unknown type, a missing slug, and a javascript source", () => {
    const catalog = ctx();
    expect(
      checkIntakeProposal(
        {
          from: "althingi",
          to: "sedlabanki",
          type: "linked-to",
          asOf: "2026",
          source: "https://www.althingi.is/",
          quotation: "linked somehow",
        },
        catalog,
      ).ok,
    ).toBe(false);
    expect(
      checkIntakeProposal(
        {
          from: "althingi",
          to: "not-a-real-slug",
          type: "regulates",
          asOf: "2026",
          source: "https://www.althingi.is/",
          quotation: "regulates a ghost",
        },
        catalog,
      ).ok,
    ).toBe(false);
    expect(
      checkIntakeProposal(
        {
          from: "althingi",
          to: "sedlabanki",
          type: "owns",
          asOf: "2026",
          source: "javascript:alert(1)",
          quotation: "owns on a script URL",
        },
        catalog,
      ).ok,
    ).toBe(false);
  });

  it("binds an amount to a quotation substring that prints the figure", () => {
    const catalog = ctx();
    const quotation =
      "Article 4 prints a 2026 total authorisation of 5.448,3 m.kr. for Forsætisráðuneyti.";
    expect(quotationPrintsValue(5448.3, quotation)).toBe(true);
    const ok = checkIntakeProposal(
      {
        from: "treasury-budget-2026",
        to: "prime-ministers-office",
        type: "funds",
        asOf: "2026",
        source:
          "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/fjarlog-fyrir-arid-2026/lagagreinar/",
        quotation,
        amount: {
          value: 5448.3,
          unit: "mkr",
          basis: "authorisation",
          quotation,
        },
      },
      catalog,
    );
    expect(ok.ok, ok.ok ? "" : ok.errors.join("; ")).toBe(true);

    const missingFigure = checkIntakeProposal(
      {
        from: "treasury-budget-2026",
        to: "prime-ministers-office",
        type: "funds",
        asOf: "2026",
        source:
          "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/fjarlog-fyrir-arid-2026/lagagreinar/",
        quotation,
        amount: {
          value: 999,
          unit: "mkr",
          basis: "authorisation",
          quotation,
        },
      },
      catalog,
    );
    expect(missingFigure.ok).toBe(false);

    const notSubstring = checkIntakeProposal(
      {
        from: "treasury-budget-2026",
        to: "prime-ministers-office",
        type: "funds",
        asOf: "2026",
        source:
          "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/fjarlog-fyrir-arid-2026/lagagreinar/",
        quotation,
        amount: {
          value: 5448.3,
          unit: "mkr",
          basis: "authorisation",
          quotation: "a caption this project wrote",
        },
      },
      catalog,
    );
    expect(notSubstring.ok).toBe(false);
  });

  it("requires career dates and a pays program join", () => {
    const catalog = ctx();
    const career = checkIntakeProposal(
      {
        from: "kristrun-frostadottir",
        to: "prime-minister",
        type: "holds-office",
        asOf: "2024-12-21",
        source: "https://www.althingi.is/altext/cv/is/?nfaerslunr=1417",
        quotation: "Forsætisráðherra síðan 21. desember 2024.",
      },
      catalog,
    );
    expect(career.ok).toBe(false);
    if (!career.ok) {
      expect(career.errors.some((error) => error.includes("start"))).toBe(true);
    }

    const pays = checkIntakeProposal(
      {
        from: "prime-ministers-office",
        to: "siminn",
        type: "pays",
        asOf: "2026-08-10",
        source: "https://opnirreikningar.is/",
        quotation:
          "Forsætisráðuneyti, aðalskrifstofa; 2026-08-10; Síminn hf.; 0615317321; 8994",
      },
      catalog,
    );
    expect(pays.ok).toBe(false);
    if (!pays.ok) {
      expect(pays.errors.some((error) => error.includes("year"))).toBe(true);
    }
  });

  it("queues a valid row without touching edges.json", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alltikerfi-intake-"));
    const queueFile = path.join(dir, "intake-queue.json");
    const edgesPath = path.join(ROOT, "data", "edges.json");
    const before = fs.readFileSync(edgesPath);
    const beforeStat = fs.statSync(edgesPath);
    const checked = checkIntakeProposal(
      formToRawEdge({
        from: "financial-supervisory-authority",
        to: "lsr",
        type: "regulates",
        asOf: "consolidated statute",
        source: "https://www.althingi.is/lagas/nuna/1997129.html",
        quotation:
          "Article 44 of the consolidated Act No. 129/1997 says Fjármálaeftirlitið supervises that pension funds, and custodians of pension savings, operate in line with the act.",
      }),
      ctx(),
    );
    expect(checked.ok, checked.ok ? "" : checked.errors.join("; ")).toBe(true);
    if (!checked.ok) return;
    const { item, created } = enqueueCheckedEdge(checked.fields, {
      file: queueFile,
      now: new Date("2026-09-29T12:00:00.000Z"),
    });
    expect(created).toBe(true);
    expect(item.status).toBe("queued");
    expect(item.row.type).toBe("regulates");
    const again = enqueueCheckedEdge(checked.fields, { file: queueFile });
    expect(again.created).toBe(false);
    const after = fs.readFileSync(edgesPath);
    expect(after.equals(before)).toBe(true);
    expect(fs.statSync(edgesPath).mtimeMs).toBe(beforeStat.mtimeMs);
    expect(fs.existsSync(path.join(dir, "edges.json"))).toBe(false);
  });

  it("does not scrape, fetch, or call a model from the intake modules", () => {
    const files = [
      "lib/edge-intake.ts",
      "lib/edge-contract.ts",
      "app/api/intake/route.ts",
      "components/paste-intake-form.tsx",
      "app/intake/page.tsx",
      "lib/opnir-feed.ts",
      "lib/opnir-review.ts",
      "app/api/intake/opnir/route.ts",
      "components/opnir-review-feed.tsx",
      "app/intake/opnir/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*input\.(source|url)/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
    const api = fs.readFileSync(path.join(ROOT, "app/api/intake/route.ts"), "utf8");
    expect(api).not.toMatch(/\bawait fetch\(/);
  });

  it("keeps intake off the primary nav and persist off in production", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/intake");
    expect(intakePersistAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(intakePersistAllowed({ NODE_ENV: "development" })).toBe(true);
  });
});
