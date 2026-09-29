import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { compareAsOf } from "@/lib/as-of";
import { parseAsOfFilter } from "@/lib/as-of-filter";
import {
  CONTRADICTION_STATE,
  matchesContradiction,
  variorumLeaves,
} from "@/lib/contradictions";
import { getAudits, getChanges, getContradictions, getEdges } from "@/lib/content";
import { navLeafCount } from "@/lib/nav";

const ROOT = process.cwd();

describe("sourced variorum", () => {
  const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
  const spread = fs.readFileSync(
    path.join(ROOT, "components", "provenance-contradiction.tsx"),
    "utf8",
  );

  it("does not add a nav leaf", () => {
    expect(navLeafCount()).toBe(10);
  });

  it("faces verso and recto with a hairline spine and equal columns", () => {
    expect(css).toContain("minmax(0, 1fr) 1px minmax(0, 1fr)");
    expect(css).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*\.variorum-spread-grid[\s\S]*minmax\(0, 1fr\) 1px minmax\(0, 1fr\)/,
    );
    expect(spread).toContain('data-variorum=""');
    expect(spread).toContain('data-variorum-leaf="verso"');
    expect(spread).toContain('data-variorum-leaf="recto"');
    expect(spread).toContain("data-variorum-spine");
    expect(spread).toContain("CitationGutter");
    expect(spread).not.toContain("ProvenanceCard");
    expect(spread).not.toMatch(/font-semibold|font-bold|opacity-50|line-through/);
  });

  it("prints the spread on one sheet without collapsing a column", () => {
    expect(css).toMatch(/\.variorum[\s\S]*break-inside:\s*avoid/);
    expect(css).toContain(".variorum-list > li");
    expect(css).toMatch(
      /@media print[\s\S]*variorum-spread-grid[\s\S]*minmax\(0, 1fr\) 1px minmax\(0, 1fr\)/,
    );
  });

  it("keeps every stored disagreement as two full quotations, unresolved", () => {
    const records = getContradictions();
    expect(records.map((row) => row.id)).toEqual([
      "eea-country-count",
      "landsvirkjun-form-and-holding",
      "services-import-growth",
      "landsbankinn-shareholder-count",
      "on-power-ledger-name",
      "bsrb-affiliate-count",
      "liv-rank-within-asi",
    ]);
    for (const record of records) {
      const [verso, recto] = variorumLeaves(record);
      expect(verso.quotation).toBe(record.sides[0]!.quotation);
      expect(recto.quotation).toBe(record.sides[1]!.quotation);
      expect(verso.quotation).not.toBe(recto.quotation);
      expect(verso.source.startsWith("http")).toBe(true);
      expect(recto.source.startsWith("http")).toBe(true);
    }
    expect(CONTRADICTION_STATE.id).toBe("unresolved");
    expect(spread).toContain("CONTRADICTION_STATE.explanation");
    expect(spread).not.toContain("winner");
  });

  it("does not grey out one leaf when the as-of filter matches the other", () => {
    const record = getContradictions().find(
      (row) => row.id === "landsbankinn-shareholder-count",
    )!;
    expect(matchesContradiction(record, parseAsOfFilter("2025"))).toBe(true);
    const [verso, recto] = variorumLeaves(record);
    expect(verso.asOf).toMatch(/undated/);
    expect(recto.asOf).toBe("2025-12-31");
    expect(compareAsOf(recto.asOf, verso.asOf)).toBeGreaterThan(0);
  });

  it("does not invent a second sentence for claims that still have only one quotation", () => {
    const paired = new Set(getContradictions().map((row) => row.id));
    expect(paired.size).toBe(7);

    for (const edge of getEdges()) {
      expect(edge.quotation.trim().length).toBeGreaterThan(0);
    }
    for (const audit of getAudits()) {
      expect(audit.quotation.trim().length).toBeGreaterThan(0);
    }
    for (const change of getChanges()) {
      expect(change.oldValue).not.toBe(change.newValue);
    }

    const bsrb = getContradictions().find((row) => row.id === "bsrb-affiliate-count")!;
    expect(bsrb.summary).toMatch(/three different counts/);
    expect(bsrb.sides).toHaveLength(2);
  });

  it("puts the same spread on the entry the disagreement lands on", () => {
    const entry = fs.readFileSync(
      path.join(ROOT, "components", "entry-detail.tsx"),
      "utf8",
    );
    expect(entry).toContain("ContradictionCard");
    expect(entry).not.toContain("Read both sides");
  });
});
