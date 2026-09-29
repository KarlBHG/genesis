import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount, navLeaves, padFolio } from "@/lib/nav";

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
    expect(css).toContain("[data-compare-column]");
    expect(css).toContain("anchor(--geo-caption top)");
  });
});

describe("pocket folio leftover surfaces", () => {
  it("prints quoted names and office membership as pocket ledger rows", () => {
    const quoted = fs.readFileSync(
      path.join(process.cwd(), "components", "quoted-name-ledger.tsx"),
      "utf8",
    );
    expect(quoted).toContain('className="pocket-ledger"');
    expect(quoted).toContain("pocket-ledger-row");
    expect(quoted).toContain('data-label="Printed name"');
    expect(quoted).toContain('data-label="Quoted on"');

    const membership = fs.readFileSync(
      path.join(process.cwd(), "components", "office-membership-table.tsx"),
      "utf8",
    );
    expect(membership).toContain('className="pocket-ledger"');
    expect(membership).toContain('data-label="Person"');
    expect(membership).toContain('data-label="Permalink"');
  });

  it("keeps the variorum spread stacked until lg", () => {
    const pair = fs.readFileSync(
      path.join(process.cwd(), "components", "provenance-contradiction.tsx"),
      "utf8",
    );
    expect(pair).toContain("variorum-spread");
    expect(pair).toContain("lg:grid-cols-2");
    expect(pair).not.toContain("md:grid-cols-2");
  });

  it("stacks the public-entity tab strip instead of sideways scroll", () => {
    const tabs = fs.readFileSync(
      path.join(process.cwd(), "components", "public-entity-tabs.tsx"),
      "utf8",
    );
    expect(tabs).toContain("folio-tabs");
    expect(tabs).not.toContain("overflow-x-auto");
  });
});
