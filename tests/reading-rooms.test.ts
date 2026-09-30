import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { navLeafCount } from "@/lib/nav";

const ROOT = process.cwd();

const OWNED = [
  "components/fiscal-phases.tsx",
  "components/entry-index.tsx",
  "components/entry-detail.tsx",
  "components/resident-standing.tsx",
  "components/evidence-room.tsx",
  "components/office-membership-table.tsx",
  "components/office-posts-index.tsx",
  "app/money/page.tsx",
  "app/connections/page.tsx",
  "app/anomalies/page.tsx",
  "app/offices/page.tsx",
  "app/standing/page.tsx",
];

describe("folio reading rooms", () => {
  it("does not add a nav leaf", () => {
    expect(navLeafCount()).toBe(10);
  });

  it("drops leftover Card soup on money, connections, offices, standing, evidence, and entries", () => {
    for (const file of OWNED) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/from ["']@\/components\/ui\/card["']/);
      expect(source, file).not.toContain("<Card");
    }
    const money = fs.readFileSync(path.join(ROOT, "app/money/page.tsx"), "utf8");
    expect(money).not.toContain("glass-panel");

    const standing = fs.readFileSync(
      path.join(ROOT, "components/resident-standing.tsx"),
      "utf8",
    );
    expect(standing).toContain("folio-question");
    expect(standing).not.toContain("glass-panel");
    expect(standing).not.toContain("ink-card");

    const phases = fs.readFileSync(
      path.join(ROOT, "components/fiscal-phases.tsx"),
      "utf8",
    );
    expect(phases).toContain("folio-phase");
    expect(phases).toContain("lg:grid-cols-3");
    expect(phases).not.toContain("md:grid-cols-3");

    const index = fs.readFileSync(
      path.join(ROOT, "components/entry-index.tsx"),
      "utf8",
    );
    expect(index).toContain("folio-index");
    expect(index).not.toContain("Badge");
  });

  it("keeps citation gutter, tenure, variorum, Post+Membership, and standing hops", () => {
    const entry = fs.readFileSync(
      path.join(ROOT, "components/entry-detail.tsx"),
      "utf8",
    );
    expect(entry).toContain("CitationGutter");
    expect(entry).toContain("ContradictionCard");
    expect(entry).toContain("data-reading-suggestions");
    expect(entry).toContain("folio-gutter");

    const evidence = fs.readFileSync(
      path.join(ROOT, "components/evidence-room.tsx"),
      "utf8",
    );
    expect(evidence).toContain("ContradictionCard");
    expect(evidence).toContain("variorum-list");
    expect(evidence).toContain("AsOfFilterBar");
    expect(evidence).not.toContain("rounded-2xl");

    const tenure = fs.readFileSync(
      path.join(ROOT, "components/connection-tenure-filter.tsx"),
      "utf8",
    );
    expect(tenure).toContain("CURRENT_MEMBERSHIP_LABEL");
    expect(tenure).toContain("ENDED_LABEL");
    expect(tenure).not.toContain("rounded-2xl");
    expect(tenure).not.toContain("rounded-full");

    const offices = fs.readFileSync(
      path.join(ROOT, "components/office-membership-table.tsx"),
      "utf8",
    );
    expect(offices).toContain("pocket-ledger");
    expect(offices).toContain("folio-register");
    expect(offices).toContain('data-label="Person"');
    expect(offices).toContain("current");
    expect(offices).toContain("ended");

    const posts = fs.readFileSync(
      path.join(ROOT, "components/office-posts-index.tsx"),
      "utf8",
    );
    expect(posts).toContain("vacant");
    expect(posts).toContain("folio-register");

    const standing = fs.readFileSync(
      path.join(ROOT, "components/resident-standing.tsx"),
      "utf8",
    );
    expect(standing).toContain("NO_SOURCED_LINE");
    expect(standing).toContain("permalink");
  });

  it("does not scrape or invent edges from the reading-room modules", () => {
    for (const file of OWNED) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
  });
});

const LEDGERS = [
  "app/compare/page.tsx",
  "components/paste-intake-form.tsx",
  "components/opnir-review-feed.tsx",
  "components/quoted-name-ledger.tsx",
  "components/connection-tenure-filter.tsx",
  "components/provenance-as-of-filter.tsx",
];

describe("folio compare, intake, quoted names, and tenure", () => {
  it("does not add a nav leaf", () => {
    expect(navLeafCount()).toBe(10);
  });

  it("drops leftover Card soup on compare, intake, quoted names, and tenure", () => {
    for (const file of LEDGERS) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/from ["']@\/components\/ui\/card["']/);
      expect(source, file).not.toContain("<Card");
      expect(source, file).not.toContain("rounded-xl");
      expect(source, file).not.toContain("rounded-full");
      expect(source, file).not.toContain("bg-amber");
      expect(source, file).not.toContain("glass-panel");
    }

    const compare = fs.readFileSync(path.join(ROOT, "app/compare/page.tsx"), "utf8");
    expect(compare).toContain("compare-spread");
    expect(compare).toContain("folio-phase");
    expect(compare).toContain("folio-pair");
    expect(compare).toContain("data-compare-column");
    expect(compare).toContain("touch.key");
    expect(compare).toContain("other.key");

    const quoted = fs.readFileSync(
      path.join(ROOT, "components/quoted-name-ledger.tsx"),
      "utf8",
    );
    expect(quoted).toContain("folio-register");
    expect(quoted).toContain("pocket-ledger");
    expect(quoted).not.toContain("Empty");

    const intake = fs.readFileSync(
      path.join(ROOT, "components/paste-intake-form.tsx"),
      "utf8",
    );
    expect(intake).toContain("intake-folio");
    expect(intake).toContain("folio-stamp");
    expect(intake).toContain("folio-note");
    expect(intake).not.toContain("Empty");

    const opnir = fs.readFileSync(
      path.join(ROOT, "components/opnir-review-feed.tsx"),
      "utf8",
    );
    expect(opnir).toContain("opnir-index");
    expect(opnir).toContain("folio-note");
    expect(opnir).not.toContain("Empty");

    const tenure = fs.readFileSync(
      path.join(ROOT, "components/connection-tenure-filter.tsx"),
      "utf8",
    );
    expect(tenure).toContain("as-of-chip");
    expect(tenure).toContain("as-of-rail");
  });

  it("does not scrape or write edges.json from these ledgers", () => {
    for (const file of LEDGERS) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
      expect(source, file).not.toMatch(/writeFile.*edges\.json/);
    }
  });
});
