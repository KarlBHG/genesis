import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount, navLeaves, padFolio, PLATE_STANDFIRSTS } from "@/lib/nav";

describe("pocket folio keeps the ten plates", () => {
  it("does not add a nav leaf", () => {
    expect(navLeafCount()).toBe(10);
    expect(navLeaves()).toHaveLength(10);
    expect(NAV.some((entry) => "href" in entry && entry.href === "/offices")).toBe(
      false,
    );
  });

  it("numbers the same plates as the masthead", () => {
    const leaves = navLeaves();
    expect(padFolio(leaves[0]!.index)).toBe("01");
    expect(leaves[0]!.label).toBe("System");
    expect(leaves[1]!.href).toBe("/map");
    expect(padFolio(leaves[9]!.index)).toBe("10");
  });

  it("quotes each plate's own standfirst on the home contents", () => {
    for (const leaf of navLeaves()) {
      expect(PLATE_STANDFIRSTS[leaf.href]).toBeTruthy();
    }
  });
});

describe("pocket folio CSS", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

  it("docks the map caption as a bottom sheet below lg", () => {
    expect(css).toContain("data-sheet-height");
    expect(css).toContain("--geo-sheet-peek");
    expect(css).toContain("--geo-sheet-half");
    expect(css).toContain("--geo-sheet-full");
    expect(css).toContain(".geo-plate-strip");
    expect(css).toContain(".geo-sheet-handle");
    expect(css).toContain(".thumb-cut-num");
    expect(css).toContain(".geo-share-copy");
    expect(css).toContain(".geo-figure");
    expect(css).toMatch(/\.geo-plate-row \{[^}]*overflow: visible/);
    expect(css).not.toMatch(/\.geo-plate-row \{[^}]*overflow-x:\s*auto/);
    expect(css).toContain("padding-bottom: var(--geo-sheet-peek)");
    expect(css).toContain('[data-pan="focus"]');
  });

  it("stacks the fact strip as a folio gutter on a phone", () => {
    expect(css).toMatch(/\.entry-fact-strip[\s\S]*grid-template-columns: 7\.25rem/);
    expect(css).toContain(".folio-gutter");
  });

  it("turns leftover stacked-desktop surfaces into pocket grammar", () => {
    expect(css).toContain(".folio-rail");
    expect(css).toContain(".policy-treemap");
    expect(css).toContain(".as-of-rail");
    expect(css).toContain(".type-rail");
    expect(css).toContain(".pocket-ledger");
    expect(css).toContain(".folio-tabs");
    expect(css).toContain(".variorum-spread");
    expect(css).toContain(".command-folio");
    expect(css).toContain(".intake-folio");
    expect(css).toContain(".compare-spread");
    expect(css).toContain(".opnir-index");
    expect(css).toContain("Tenure / as-of index at every width");
    expect(css).toContain("anchor(--geo-caption top)");
    expect(css).toContain(".strip-drawing");
  });
});

describe("pocket folio leftover surfaces", () => {
  it("prints quoted names and office membership as pocket ledger rows", () => {
    const quoted = fs.readFileSync(
      path.join(process.cwd(), "components", "quoted-name-ledger.tsx"),
      "utf8",
    );
    expect(quoted).toMatch(/className="pocket-ledger[^"]*"/);
    expect(quoted).toContain("folio-register");
    expect(quoted).toContain("pocket-ledger-row");
    expect(quoted).toContain('data-label="Printed name"');
    expect(quoted).toContain('data-label="Quoted on"');

    const membership = fs.readFileSync(
      path.join(process.cwd(), "components", "office-membership-table.tsx"),
      "utf8",
    );
    expect(membership).toMatch(/className="pocket-ledger[^"]*"/);
    expect(membership).toContain("folio-register");
    expect(membership).toContain('data-label="Person"');
    expect(membership).toContain('data-label="Permalink"');

    const unprinted = fs.readFileSync(
      path.join(process.cwd(), "components", "unprinted-career-ends-checklist.tsx"),
      "utf8",
    );
    expect(unprinted).toMatch(/className="pocket-ledger[^"]*"/);
    expect(unprinted).toContain("pocket-ledger-row");
    expect(unprinted).toContain('data-label="End"');
    expect(unprinted).toContain("NO_END_STORED");
    expect(unprinted).not.toContain('"current"');
  });

  it("keeps the variorum spread stacked until lg", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
    const pair = fs.readFileSync(
      path.join(process.cwd(), "components", "provenance-contradiction.tsx"),
      "utf8",
    );
    expect(pair).toContain("variorum-spread");
    expect(pair).not.toContain("md:grid-cols-2");
    expect(pair).not.toContain("lg:grid-cols-2");
    expect(css).toContain(".variorum-spread-grid");
    expect(css).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*\.variorum-spread-grid[\s\S]*minmax\(0, 1fr\) 1px minmax\(0, 1fr\)/,
    );
  });

  it("stacks the public-entity tab strip instead of sideways scroll", () => {
    const tabs = fs.readFileSync(
      path.join(process.cwd(), "components", "public-entity-tabs.tsx"),
      "utf8",
    );
    expect(tabs).toContain("folio-tabs");
    expect(tabs).not.toContain("overflow-x-auto");
  });

  it("stacks the remaining named leftover plates until lg", () => {
    const moneyTabs = fs.readFileSync(
      path.join(process.cwd(), "components", "money-room-tabs.tsx"),
      "utf8",
    );
    expect(moneyTabs).toContain("folio-tabs");
    expect(moneyTabs).not.toContain("overflow-x-auto");

    const home = fs.readFileSync(
      path.join(process.cwd(), "components", "home-dashboard.tsx"),
      "utf8",
    );
    expect(home).toContain("landing-chains");
    expect(home).toContain("lg:grid-cols-2");
    expect(home).not.toContain("md:grid-cols-2");
    expect(home).toContain("plate-index");
    expect(home).not.toContain("lg:grid-cols-3");

    const institutions = fs.readFileSync(
      path.join(process.cwd(), "components", "institution-browser.tsx"),
      "utf8",
    );
    expect(institutions).toContain("folio-index");
    expect(institutions).not.toContain("lg:grid-cols-2");
    expect(institutions).not.toContain("md:grid-cols-2");

    const treaties = fs.readFileSync(
      path.join(process.cwd(), "components", "treaty-browser.tsx"),
      "utf8",
    );
    expect(treaties).toContain("folio-index");
    expect(treaties).not.toContain("lg:grid-cols-2");
    expect(treaties).not.toContain("md:grid-cols-2");

    const index = fs.readFileSync(
      path.join(process.cwd(), "components", "entry-index-browser.tsx"),
      "utf8",
    );
    expect(index).toContain("folio-index");
    expect(index).not.toContain("lg:grid-cols-2");
    expect(index).not.toContain("md:grid-cols-2");

    const standing = fs.readFileSync(
      path.join(process.cwd(), "components", "standing-picks.tsx"),
      "utf8",
    );
    expect(standing).toContain("lg:grid-cols-2");
    expect(standing).not.toContain("sm:grid-cols-2");

    const events = fs.readFileSync(
      path.join(process.cwd(), "components", "event-timeline.tsx"),
      "utf8",
    );
    expect(events).toContain("type-rail");
    expect(events).toContain("type-chip");
    expect(events).not.toContain("overflow-x-auto");

    const strips = fs.readFileSync(
      path.join(process.cwd(), "components", "connections", "connection-strips.tsx"),
      "utf8",
    );
    expect(strips).toContain("strip-drawing");
    expect(strips).not.toContain("overflow-x-auto");
    expect(strips).toContain("lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(strips).not.toContain("sm:grid-cols-[");

    const publicEntities = fs.readFileSync(
      path.join(process.cwd(), "app", "public-entities", "page.tsx"),
      "utf8",
    );
    expect(publicEntities).toContain("govdirectory-summary");
    expect(publicEntities).toContain("catalog-index");
    expect(publicEntities).not.toContain("lg:grid-cols-3");
    expect(publicEntities).not.toContain("md:grid-cols-3");

    const fiscal = fs.readFileSync(
      path.join(process.cwd(), "components", "fiscal-phases.tsx"),
      "utf8",
    );
    expect(fiscal).toContain("fiscal-phases");
    expect(fiscal).toContain("lg:grid-cols-3");
    expect(fiscal).not.toContain("md:grid-cols-3");

    const overview = fs.readFileSync(
      path.join(process.cwd(), "app", "overview", "page.tsx"),
      "utf8",
    );
    expect(overview).toContain("overview-sections");
    expect(overview).toContain("catalog-index");
    expect(overview).not.toContain("glass-panel");
    expect(overview).not.toContain("lg:grid-cols-4");
    expect(overview).not.toContain("grid-cols-2");
    expect(overview).not.toContain("sm:grid-cols-3");

    const methodology = fs.readFileSync(
      path.join(process.cwd(), "app", "methodology", "page.tsx"),
      "utf8",
    );
    expect(methodology).toContain("methodology-toc");
    expect(methodology).toContain("lg:grid-cols-2");
    expect(methodology).not.toContain("sm:grid-cols-2");
    expect(methodology).toContain("methodology-money");
    expect(methodology).toContain("lg:grid-cols-3");
    expect(methodology).not.toContain("md:grid-cols-3");

    const headings = fs.readFileSync(
      path.join(process.cwd(), "components", "printed-heading-identities.tsx"),
      "utf8",
    );
    expect(headings).toMatch(/className="pocket-ledger[^"]*"/);
    expect(headings).toContain("folio-register");
    expect(headings).toContain("pocket-ledger-row");
    expect(headings).toContain('data-label="Printed heading"');
    expect(headings).toContain('data-label="Sits on"');
    expect(headings).toContain('data-label="Unique catalog match"');

    const table = fs.readFileSync(
      path.join(process.cwd(), "components", "ui", "table.tsx"),
      "utf8",
    );
    expect(table).toContain("overflow-x-auto");

    const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*\.strip-drawing[\s\S]*display: none/);
  });
});
