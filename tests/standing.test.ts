import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getCatalog, getEdges } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import {
  ALTHINGI_SLUG,
  article4Caption,
  BUDGET_LAW_SLUG,
  DEFAULT_PROGRAM_SLUG,
  ELECTION_SLUG,
  emptyHops,
  invoiceRowCaption,
  NO_SOURCED_LINE,
  sourcedHops,
  standingFolioHref,
  standingMunicipalities,
  standingPrograms,
  standingQuestions,
  walkDepositor,
  walkTaxpayer,
  walkVoter,
} from "@/lib/standing";

const ROOT = process.cwd();

describe("resident standing", () => {
  it("keeps primary nav at ten leaves and standing off that bar", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/standing");
    expect(hrefs).toHaveLength(navLeafCount());
  });

  it("walks taxpayer Article 4 then joined invoices, or no sourced line", () => {
    const edges = getEdges();
    const hospital = walkTaxpayer(DEFAULT_PROGRAM_SLUG, edges);
    const law = sourcedHops(hospital).find(
      (hop) =>
        hop.from === ALTHINGI_SLUG &&
        hop.relationship === "funds" &&
        hop.to === BUDGET_LAW_SLUG,
    );
    expect(law).toBeDefined();
    expect(law!.href).toBe(
      edgeHref(
        edges.find(
          (edge) =>
            edge.from === ALTHINGI_SLUG &&
            edge.relationship === "funds" &&
            edge.to === BUDGET_LAW_SLUG,
        )!,
      ),
    );
    expect(
      sourcedHops(hospital).some(
        (hop) =>
          hop.from === BUDGET_LAW_SLUG &&
          hop.relationship === "funds" &&
          hop.to === DEFAULT_PROGRAM_SLUG,
      ),
    ).toBe(true);
    const invoices = sourcedHops(hospital).filter(
      (hop) => hop.relationship === "pays",
    );
    expect(invoices.length).toBeGreaterThan(0);
    expect(invoices.every((hop) => hop.href.startsWith("/connections/"))).toBe(
      true,
    );
    expect(emptyHops(hospital)).toHaveLength(0);

    const tax = walkTaxpayer(
      "policy-area-05-skatta-eigna-og-fjarmalaumsysla",
      edges,
    );
    expect(
      sourcedHops(tax).some(
        (hop) => hop.to === "policy-area-05-skatta-eigna-og-fjarmalaumsysla",
      ),
    ).toBe(true);
    expect(sourcedHops(tax).some((hop) => hop.relationship === "pays")).toBe(
      false,
    );
    expect(emptyHops(tax).some((hop) => hop.want.includes("invoice"))).toBe(
      true,
    );
  });

  it("walks depositor owns to banks and leaves a municipality bank hop empty", () => {
    const catalog = getCatalog();
    const edges = getEdges();
    const hops = walkDepositor("reykjavikurborg", edges, catalog);
    const owned = sourcedHops(hops);
    expect(owned.some((hop) => hop.to === "landsbankinn")).toBe(true);
    expect(owned.some((hop) => hop.to === "sedlabanki")).toBe(true);
    expect(owned.some((hop) => hop.to === "islandsbanki")).toBe(false);
    expect(
      owned.every(
        (hop) => hop.relationship === "owns" && hop.href.startsWith("/connections/"),
      ),
    ).toBe(true);
    expect(
      emptyHops(hops).some((hop) => hop.want.includes("Reykjavíkurborg")),
    ).toBe(true);
    expect(
      edges.some(
        (edge) =>
          edge.relationship === "owns" &&
          edge.from === "reykjavikurborg" &&
          /banki|bankinn/.test(edge.to),
      ),
    ).toBe(false);
  });

  it("walks the 2024 election to Alþingi and does not invent a constituency member", () => {
    const edges = getEdges();
    const hops = walkVoter("reykjavikurborg", edges);
    const election = sourcedHops(hops).find(
      (hop) =>
        hop.from === ELECTION_SLUG &&
        hop.relationship === "elects" &&
        hop.to === ALTHINGI_SLUG,
    );
    expect(election).toBeDefined();
    expect(election!.asOf).toBe("2024-11-30");
    expect(election!.href.startsWith("/connections/")).toBe(true);
    expect(sourcedHops(hops)).toHaveLength(1);
    expect(emptyHops(hops)).toHaveLength(1);
    expect(emptyHops(hops)[0]!.want).toMatch(/Reykjavíkurborg/);
    expect(emptyHops(hops)[0]!.want).toMatch(/member of Alþingi/);

    const municipalities = standingMunicipalities(getCatalog());
    expect(municipalities.length).toBeGreaterThanOrEqual(10);
    expect(
      municipalities.every((item) =>
        getCatalog().some((entry) => entry.slug === item.slug),
      ),
    ).toBe(true);
    expect(
      edges.some(
        (edge) =>
          edge.relationship === "elects" &&
          municipalities.some((item) => item.slug === edge.from),
      ),
    ).toBe(false);
    expect(
      edges.filter((edge) => edge.relationship === "elects").map((edge) => ({
        from: edge.from,
        to: edge.to,
      })),
    ).toEqual(
      expect.arrayContaining([
        { from: ELECTION_SLUG, to: ALTHINGI_SLUG },
        { from: ALTHINGI_SLUG, to: "sedlabanki" },
      ]),
    );
    expect(
      sourcedHops(hops).some(
        (hop) => hop.from === ALTHINGI_SLUG && hop.to === "sedlabanki",
      ),
    ).toBe(false);
  });

  it("captions invoice and Article 4 counts without krónur", () => {
    expect(invoiceRowCaption(12)).toBe(
      "12 sourced invoice rows. Counts are rows, not krónur.",
    );
    expect(article4Caption(1)).toBe(
      "1 Article 4 row. Amounts are not added together.",
    );
    expect(invoiceRowCaption(12)).not.toMatch(/\b(ISK|mkr|makr|USD)\b/);
    expect(NO_SOURCED_LINE).toBe("no sourced line");
  });

  it("keeps standing folio hops on the same municipality and program", () => {
    expect(standingFolioHref(DEFAULT_PROGRAM_SLUG, null, "taxpayer")).toBe(
      `/standing?program=${DEFAULT_PROGRAM_SLUG}#taxpayer`,
    );
    expect(
      standingFolioHref(DEFAULT_PROGRAM_SLUG, "reykjavikurborg", "taxpayer"),
    ).toBe(
      `/standing?program=${DEFAULT_PROGRAM_SLUG}&municipality=reykjavikurborg#taxpayer`,
    );
  });

  it("exposes three authored questions and catalog policy areas", () => {
    const questions = standingQuestions(
      DEFAULT_PROGRAM_SLUG,
      null,
      getEdges(),
      getCatalog(),
    );
    expect(questions.map((item) => item.id)).toEqual([
      "taxpayer",
      "depositor",
      "voter",
    ]);
    expect(questions.map((item) => item.title)).toEqual([
      "As a taxpayer",
      "As a depositor in a state-owned bank",
      "As a voter after 30 Nov 2024",
    ]);
    expect(standingPrograms(getCatalog()).length).toBeGreaterThanOrEqual(27);
    expect(
      emptyHops(questions[2]!.hops).some((hop) =>
        hop.want.includes("this municipality"),
      ),
    ).toBe(true);
  });

  it("does not scrape, fetch, or call a model from the standing modules", () => {
    const files = [
      "lib/standing.ts",
      "components/resident-standing.tsx",
      "components/standing-picks.tsx",
      "app/standing/page.tsx",
      "app/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
  });
});
