import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { asOfMeta } from "@/lib/as-of";
import { entryAsOfValue, kindNoun } from "@/lib/entry-facts";
import { getCatalog } from "@/lib/content";
import { folioForPath, navLeafCount, padFolio } from "@/lib/nav";
import {
  METHODOLOGY_HREF,
  PRINT_COLOPHON,
  printFolio,
  printRunningHead,
} from "@/lib/print-plate";

describe("print plates match the nav folio", () => {
  it("keeps Map at 02 and Budget at 04", () => {
    expect(navLeafCount()).toBe(10);
    expect(printFolio("/map")).toBe("02");
    expect(printFolio("/map?focus=althingi")).toBe("02");
    expect(folioForPath("/map")?.index).toBe(2);
    expect(printFolio("/money")).toBe("04");
    expect(printFolio("/money/treasury-budget-2026")).toBe("04");
    expect(printFolio("/programs/something")).toBe("04");
    expect(printFolio("/institutions/sedlabanki")).toBe("03");
    expect(printFolio("/connections/abc")).toBe("09");
    expect(folioForPath("/map")?.label).toBe("Map");
    expect(folioForPath("/money")?.label).toBe("Budget");
    expect(padFolio(2)).toBe("02");
  });

  it("builds a running head from kind, slug, and stored as-of bucket", () => {
    const sedlabanki = getCatalog().find((entry) => entry.slug === "sedlabanki");
    expect(sedlabanki).toBeTruthy();
    expect(
      printRunningHead(
        kindNoun(sedlabanki!.kind),
        sedlabanki!.slug,
        entryAsOfValue(sedlabanki!),
      ),
    ).toBe("Institution · sedlabanki · undated");

    const althingi = getCatalog().find((entry) => entry.slug === "althingi");
    expect(althingi).toBeTruthy();
    // Founded "930" is stored as-is; the bucket classifier needs a four-digit year.
    expect(asOfMeta(entryAsOfValue(althingi!)).bucketLabel).toBe("undated");
    expect(
      printRunningHead("Map", "althingi", entryAsOfValue(althingi!)),
    ).toBe("Map · althingi · undated");

    const samband = getCatalog().find(
      (entry) => entry.slug === "samband-islenskra-sveitarfelaga",
    );
    expect(samband).toBeTruthy();
    expect(asOfMeta(entryAsOfValue(samband!)).bucketLabel).toBe("year");

    expect(printRunningHead("Connection", "edgeid", "2025-03-15")).toBe(
      "Connection · edgeid · ISO",
    );
  });

  it("prints a colophon that refuses totals and a live retrieval date", () => {
    expect(PRINT_COLOPHON).toMatch(/not added together/i);
    expect(PRINT_COLOPHON).not.toMatch(/retrieved/i);
    expect(PRINT_COLOPHON).not.toMatch(/total/i);
    expect(METHODOLOGY_HREF).toBe("/methodology");
  });
});

describe("print CSS keeps the plate honest", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

  it("hides chrome, glow, drop cap, and constellation", () => {
    expect(css).toContain(".home-constellation");
    expect(css).toContain(".page-hero-glow");
    expect(css).toContain(".atlas-page > .entry-prose > p:first-of-type::first-letter");
    expect(css).toMatch(/\.geo-print-ornament/);
    expect(css).toMatch(/hang-quote\[lang="is"\]/);
    expect(css).toContain(".citation-gutter");
    expect(css).toContain(".print-off-plate-kicker");
    expect(css).toContain("html:has(.geo-room)");
  });
});
