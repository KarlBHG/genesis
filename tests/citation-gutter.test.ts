import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { navLeafCount } from "@/lib/nav";

const ROOT = process.cwd();

describe("citation gutter", () => {
  const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
  const gutter = fs.readFileSync(
    path.join(ROOT, "components", "citation-gutter.tsx"),
    "utf8",
  );

  it("does not add a nav leaf", () => {
    expect(navLeafCount()).toBe(10);
  });

  it("typesets the stored quotation verbatim — italic, Icelandic, hyphenated", () => {
    expect(gutter).toContain('data-citation-gutter=""');
    expect(gutter).toContain("icelandicLang(quotation)");
    expect(gutter).not.toMatch(/slice\(|substring\(|line-clamp|truncate/);
    expect(css).toMatch(/\.hang-quote\[lang="is"\]/);
    expect(css).toMatch(/hyphens:\s*auto/);
    expect(css).toContain('quotes: "„" "“"');
    expect(css).toContain("font-variant-caps: small-caps");
  });

  it("aligns the gutter beside the claim on a wide measure, stacked below it on a narrow one", () => {
    expect(css).toContain("@container citation-claim");
    expect(css).toContain("minmax(0, 1fr) var(--container-gutter)");
    expect(css).toContain(".citation-plate");
  });

  it("keeps untyped related off the gutter", () => {
    const entry = fs.readFileSync(
      path.join(ROOT, "components", "entry-detail.tsx"),
      "utf8",
    );
    expect(entry).toContain("data-reading-suggestions");
    expect(entry).toContain("not citation");
    const relatedBlock = entry.slice(
      entry.indexOf("data-reading-suggestions"),
      entry.indexOf("Sources"),
    );
    expect(relatedBlock).not.toContain("CitationGutter");
  });
});
