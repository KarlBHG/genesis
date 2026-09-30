import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { navLeafCount } from "@/lib/nav";

const ROOT = process.cwd();

const OWNED = [
  "components/entry-index-browser.tsx",
  "components/treaty-browser.tsx",
  "components/institution-browser.tsx",
  "components/event-timeline.tsx",
  "components/search-panel.tsx",
  "app/overview/page.tsx",
  "app/public-entities/page.tsx",
];

describe("folio catalog browsers", () => {
  it("does not add a nav leaf", () => {
    expect(navLeafCount()).toBe(10);
  });

  it("drops leftover Card soup on treaty, institution, player, event, overview, and public-entity catalogs", () => {
    for (const file of OWNED) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/from ["']@\/components\/ui\/card["']/);
      expect(source, file).not.toContain("<Card");
      expect(source, file).not.toContain("glass-panel");
      expect(source, file).not.toContain("ink-card");
    }

    const index = fs.readFileSync(
      path.join(ROOT, "components/entry-index-browser.tsx"),
      "utf8",
    );
    expect(index).toContain("folio-index");
    expect(index).toContain("folio-facet");
    expect(index).not.toContain("line-clamp-3");

    const treaties = fs.readFileSync(
      path.join(ROOT, "components/treaty-browser.tsx"),
      "utf8",
    );
    expect(treaties).toContain("folio-index");

    const institutions = fs.readFileSync(
      path.join(ROOT, "components/institution-browser.tsx"),
      "utf8",
    );
    expect(institutions).toContain("folio-index");

    const events = fs.readFileSync(
      path.join(ROOT, "components/event-timeline.tsx"),
      "utf8",
    );
    expect(events).toContain("folio-index");
    expect(events).toContain("type-rail");
    expect(events).toContain("data/edges.json");

    const search = fs.readFileSync(
      path.join(ROOT, "components/search-panel.tsx"),
      "utf8",
    );
    expect(search).toContain("folio-index");
    expect(search).toContain("folio-facet");
    expect(search).not.toContain("rounded-lg border");

    const overview = fs.readFileSync(path.join(ROOT, "app/overview/page.tsx"), "utf8");
    expect(overview).toContain("catalog-index");
    expect(overview).toContain("SearchPanel");

    const publicEntities = fs.readFileSync(
      path.join(ROOT, "app/public-entities/page.tsx"),
      "utf8",
    );
    expect(publicEntities).toContain("govdirectory-summary");
    expect(publicEntities).toContain("catalog-index");
  });

  it("does not scrape or invent edges from the catalog modules", () => {
    for (const file of OWNED) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
  });
});
