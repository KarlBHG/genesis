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
});
