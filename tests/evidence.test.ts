import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { classifyAsOfBucket, compareAsOf } from "@/lib/as-of";
import {
  AS_OF_BUCKETS,
  asOfBucketCounts,
  asOfWindows,
  comparableYear,
  emptyAsOfFilter,
  filterByAsOf,
  isAsOfFilterEmpty,
  matchesAsOfFilter,
  parseAsOfFilter,
  serializeAsOfFilter,
  toggleAsOfBucket,
  toggleAsOfWindow,
} from "@/lib/as-of-filter";
import {
  CONTRADICTION_STATE,
  contradictionDateNote,
  latestSideAsOf,
  matchesContradiction,
  sortContradictions,
  variorumLeaves,
} from "@/lib/contradictions";
import { getContradictions, getEdges } from "@/lib/content";
import { EVIDENCE_FACETS, parseEvidenceFacet } from "@/lib/evidence";
import { REQUIRED_EDGE_FIELDS, methodologyStats } from "@/lib/methodology";
import {
  OBLIGATION_EVIDENCE_LIMIT,
  obligationEvidence,
  obligationEvidenceBySection,
  obligationSlugs,
} from "@/lib/obligation-evidence";
import { OBLIGATION_SECTIONS } from "@/lib/obligations";
import { retrievalCaveat, sourceLabel } from "@/lib/provenance";

const ROOT = process.cwd();

function rawEdgeRows(): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "edges.json"), "utf8"),
  );
  if (!Array.isArray(parsed)) throw new Error("edges.json must be a list");
  return parsed as Record<string, unknown>[];
}

describe("as-of filter", () => {
  it("passes everything when nothing is selected", () => {
    const filter = emptyAsOfFilter();
    expect(isAsOfFilterEmpty(filter)).toBe(true);
    expect(matchesAsOfFilter("2026-01-13", filter)).toBe(true);
    expect(matchesAsOfFilter("undated on the registry page", filter)).toBe(true);
    expect(serializeAsOfFilter(filter)).toBe("");
  });

  it("round-trips buckets and year windows through the parameter", () => {
    const filter = parseAsOfFilter("year,2026,2000-2009,iso,bogus,");
    expect(filter.buckets).toEqual(["year", "iso"]);
    expect(filter.windows).toEqual([
      { from: 2026, to: 2026 },
      { from: 2000, to: 2009 },
    ]);
    expect(serializeAsOfFilter(filter)).toBe("iso,year,2026,2000-2009");
    expect(parseAsOfFilter(serializeAsOfFilter(filter))).toEqual({
      buckets: ["iso", "year"],
      windows: filter.windows,
    });
  });

  it("serializes buckets in a stable order so links are comparable", () => {
    expect(serializeAsOfFilter(parseAsOfFilter("undated,iso"))).toBe(
      "iso,undated",
    );
  });

  it("never reads a phrase date or a statute as a comparable year", () => {
    expect(comparableYear("2026-01-13")).toBe(2026);
    expect(comparableYear("2024")).toBe(2024);
    expect(comparableYear("2021-2024")).toBe(2021);
    expect(comparableYear("consolidated statute, lagasafn 157c, 1 September 2026")).toBe(
      null,
    );
    expect(comparableYear("undated on the registry page")).toBe(null);
  });

  it("keeps statute and undated rows out of a year window", () => {
    const window2026 = parseAsOfFilter("2026");
    expect(matchesAsOfFilter("2026-01-13", window2026)).toBe(true);
    expect(matchesAsOfFilter("2026", window2026)).toBe(true);
    expect(matchesAsOfFilter("2025-12-31", window2026)).toBe(false);
    expect(
      matchesAsOfFilter("consolidated statute, lagasafn 157c, 1 September 2026", window2026),
    ).toBe(false);
    expect(matchesAsOfFilter("undated on the cited page", window2026)).toBe(false);
  });

  it("brings undated rows back when their bucket is selected", () => {
    const filter = parseAsOfFilter("2026,undated");
    expect(matchesAsOfFilter("undated on the cited page", filter)).toBe(true);
    expect(matchesAsOfFilter("1994-01-01", filter)).toBe(false);
  });

  it("toggles buckets and windows off again", () => {
    const withIso = toggleAsOfBucket(emptyAsOfFilter(), "iso");
    expect(withIso.buckets).toEqual(["iso"]);
    expect(toggleAsOfBucket(withIso, "iso").buckets).toEqual([]);
    const withYear = toggleAsOfWindow(emptyAsOfFilter(), { from: 2026, to: 2026 });
    expect(serializeAsOfFilter(withYear)).toBe("2026");
    expect(
      toggleAsOfWindow(withYear, { from: 2026, to: 2026 }).windows,
    ).toEqual([]);
  });

  it("counts every stored edge date into exactly one bucket", () => {
    const edges = getEdges();
    const counts = asOfBucketCounts(edges.map((edge) => edge.asOf));
    const total = AS_OF_BUCKETS.reduce((sum, bucket) => sum + counts[bucket], 0);
    expect(total).toBe(edges.length);
  });

  it("builds year windows only from rows that carry a comparable year", () => {
    const windows = asOfWindows([
      "2026-01-13",
      "2025-12-31",
      "2024",
      "2021",
      "1994-01-01",
      "1949-04-04",
      "consolidated statute",
      "undated on the cited page",
    ]);
    expect(windows.slice(0, 4)).toEqual([
      { from: 2026, to: 2026 },
      { from: 2025, to: 2025 },
      { from: 2024, to: 2024 },
      { from: 2021, to: 2021 },
    ]);
    expect(windows.slice(4)).toEqual([
      { from: 1990, to: 1999 },
      { from: 1940, to: 1949 },
    ]);
  });

  it("narrows a real edge list without reordering it", () => {
    const edges = getEdges();
    const filter = parseAsOfFilter("iso");
    const narrowed = filterByAsOf(edges, (edge) => edge.asOf, filter);
    expect(narrowed.length).toBeGreaterThan(0);
    expect(narrowed.length).toBeLessThan(edges.length);
    expect(
      narrowed.every((edge) => classifyAsOfBucket(edge.asOf) === "iso"),
    ).toBe(true);
  });
});

describe("contradictions are the first-class evidence unit", () => {
  it("gives every side its own stored as-of value", () => {
    const records = getContradictions();
    expect(records.length).toBeGreaterThan(0);
    for (const record of records) {
      expect(record.sides).toHaveLength(2);
      for (const side of record.sides) {
        expect(side.asOf.trim().length).toBeGreaterThan(0);
        expect(side.quotation.trim().length).toBeGreaterThan(0);
        expect(side.source.startsWith("http")).toBe(true);
      }
    }
  });

  it("stays unresolved and says so", () => {
    expect(CONTRADICTION_STATE.id).toBe("unresolved");
    expect(CONTRADICTION_STATE.explanation).toMatch(/Both sentences stay/);
  });

  it("orders by the later side without sorting phrases as ISO", () => {
    const sorted = sortContradictions(getContradictions());
    for (let index = 1; index < sorted.length; index += 1) {
      expect(
        compareAsOf(latestSideAsOf(sorted[index - 1]!), latestSideAsOf(sorted[index]!)),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("names which kind of date disagreement each row is", () => {
    const bySlug = new Map(getContradictions().map((row) => [row.id, row]));
    expect(contradictionDateNote(bySlug.get("eea-country-count")!)).toMatch(
      /Neither page prints a date/,
    );
    expect(
      contradictionDateNote(bySlug.get("landsbankinn-shareholder-count")!),
    ).toMatch(/Only one side carries a date/);
    expect(contradictionDateNote(bySlug.get("services-import-growth")!)).toMatch(
      /one source disagreeing with itself/,
    );
    expect(
      contradictionDateNote(bySlug.get("landsvirkjun-form-and-holding")!),
    ).toMatch(/consolidated statute/);
  });

  it("keeps verso and recto in stored order, not later-as-of first", () => {
    const landsbankinn = getContradictions().find(
      (row) => row.id === "landsbankinn-shareholder-count",
    )!;
    const [verso, recto] = variorumLeaves(landsbankinn);
    expect(verso.quotation).toMatch(/around 800/);
    expect(recto.quotation).toMatch(/approximately 819/);
    expect(verso).toBe(landsbankinn.sides[0]);
    expect(recto).toBe(landsbankinn.sides[1]);
    expect(compareAsOf(verso.asOf, recto.asOf)).not.toBe(0);
  });

  it("does not invent a third BSRB sentence the file does not store", () => {
    const bsrb = getContradictions().find((row) => row.id === "bsrb-affiliate-count")!;
    expect(bsrb.summary).toMatch(/three different counts/);
    expect(bsrb.sides).toHaveLength(2);
    expect(variorumLeaves(bsrb)).toHaveLength(2);
  });

  it("stays in scope when either side matches the filter", () => {
    const record = getContradictions().find(
      (row) => row.id === "landsbankinn-shareholder-count",
    )!;
    expect(matchesContradiction(record, parseAsOfFilter("2025"))).toBe(true);
    expect(matchesContradiction(record, parseAsOfFilter("undated"))).toBe(true);
    expect(matchesContradiction(record, parseAsOfFilter("2019"))).toBe(false);
  });
});

describe("evidence facets", () => {
  it("falls back to all for unknown values", () => {
    expect(parseEvidenceFacet("contradictions")).toBe("contradictions");
    expect(parseEvidenceFacet("nonsense")).toBe("all");
    expect(parseEvidenceFacet(null)).toBe("all");
  });

  it("gives every facet an anchor on the page", () => {
    expect(EVIDENCE_FACETS.length).toBe(5);
    for (const facet of EVIDENCE_FACETS) {
      expect(facet.anchor.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("provenance", () => {
  it("flags PDF, script-shell, and bot-check sources", () => {
    expect(
      retrievalCaveat(
        "https://www.landsbankinn.is/uploads/documents/arsskyrsluroguppgjor/fact-book-2025-en.pdf",
      )?.kind,
    ).toBe("pdf");
    expect(retrievalCaveat("https://opnirreikningar.is/")?.kind).toBe(
      "script-shell",
    );
    expect(
      retrievalCaveat("https://english.sedlabanki.is/um-sedlabankann/")?.kind,
    ).toBe("script-shell");
    expect(
      retrievalCaveat("https://www.efta.int/about-efta/legal-documents/eea-legal-texts")
        ?.kind,
    ).toBe("bot-check");
    expect(
      retrievalCaveat("https://www.althingi.is/lagas/nuna/1983042.html"),
    ).toBe(null);
  });

  it("does not crash on a value that is not a URL", () => {
    expect(retrievalCaveat("not a url")).toBe(null);
    expect(sourceLabel("not a url")).toBe("not a url");
  });

  it("shortens a source to host and first segment", () => {
    expect(sourceLabel("https://www.althingi.is/lagas/nuna/1983042.html")).toBe(
      "althingi.is/lagas/…",
    );
    expect(sourceLabel("https://opnirreikningar.is/")).toBe("opnirreikningar.is");
  });

  it("counts caveats and buckets over the live edge set", () => {
    const edges = getEdges();
    const stats = methodologyStats(edges);
    expect(stats.edges).toBe(edges.length);
    expect(stats.relationshipTypes).toBeGreaterThan(5);
    expect(stats.caveatTotal).toBeGreaterThan(0);
    expect(stats.caveatTotal).toBe(
      stats.caveats.pdf + stats.caveats["script-shell"] + stats.caveats["bot-check"],
    );
  });
});

describe("methodology matches the loader contract", () => {
  it("lists exactly the six fields every stored edge carries", () => {
    const names = REQUIRED_EDGE_FIELDS.map((field) => field.name);
    expect(names).toEqual(["from", "to", "type", "asOf", "source", "quotation"]);
    for (const row of rawEdgeRows()) {
      for (const name of names) {
        expect(typeof row[name]).toBe("string");
        expect((row[name] as string).trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("obligation theme evidence", () => {
  it("reads entry slugs from theme links and skips section anchors", () => {
    const budget = OBLIGATION_SECTIONS.find((section) => section.id === "budget")!;
    const slugs = obligationSlugs(budget);
    expect(slugs).toContain("treasury-budget-2026");
    expect(slugs).toContain("treasury-debt");
    expect(slugs.some((slug) => slug.includes("#"))).toBe(false);
  });

  it("only borrows edges that touch the theme's own records", () => {
    const edges = getEdges();
    for (const section of OBLIGATION_SECTIONS) {
      const slugs = new Set(obligationSlugs(section));
      for (const edge of obligationEvidence(section, edges)) {
        expect(slugs.has(edge.from) || slugs.has(edge.to)).toBe(true);
      }
    }
  });

  it("finds sourced lines for the themes that have them", () => {
    const bySection = obligationEvidenceBySection(getEdges());
    expect(bySection.size).toBe(OBLIGATION_SECTIONS.length);
    expect((bySection.get("europe") ?? []).length).toBeGreaterThan(0);
    expect((bySection.get("budget") ?? []).length).toBeGreaterThan(
      OBLIGATION_EVIDENCE_LIMIT,
    );
  });
});
