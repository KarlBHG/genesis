import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { navLeafCount } from "@/lib/nav";
import {
  ARTICLE_FOUR_SOURCE,
  BUDGET_INTRO_SOURCE,
} from "@/components/budget-programs-section";

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

  it("puts leftover proving sentences in the gutter, not a card or glass panel", () => {
    const invoices = fs.readFileSync(
      path.join(ROOT, "components", "program-invoice-bridge.tsx"),
      "utf8",
    );
    expect(invoices).toContain("ProvenanceEdgeCard");
    expect(invoices).toContain("data-program-invoices");
    expect(invoices).not.toMatch(/from ["']@\/components\/ui\/card["']/);
    expect(invoices).not.toContain("<Card");
    expect(invoices).not.toContain("glass-panel");

    const moneySlug = fs.readFileSync(
      path.join(ROOT, "app", "money", "[slug]", "page.tsx"),
      "utf8",
    );
    expect(moneySlug).toContain("max-w-folio");

    const budget = fs.readFileSync(
      path.join(ROOT, "components", "budget-programs-section.tsx"),
      "utf8",
    );
    expect(budget).toContain("ProvenanceCard");
    expect(budget).toContain("BUDGET_INTRO_SOURCE");
    expect(budget).toContain("ARTICLE_FOUR_SOURCE");
    expect(budget).not.toContain("glass-panel");
    expect(budget).not.toContain("border-l-2");

    const pair = fs.readFileSync(
      path.join(ROOT, "components", "provenance-contradiction.tsx"),
      "utf8",
    );
    expect(pair).toContain("ProvenanceCard");
    expect(pair).toContain("CONTRADICTION_STATE");
    expect(pair).not.toContain("rounded-2xl");
    expect(pair).not.toContain("md:grid-cols-2");
  });

  it("cites the same budget pages the policy-area records already cite", () => {
    const area = fs.readFileSync(
      path.join(
        ROOT,
        "content",
        "money",
        "policy-area-01-althingi-og-eftirlitsstofnanir-thess.md",
      ),
      "utf8",
    );
    expect(area).toContain(BUDGET_INTRO_SOURCE);
    expect(area).toContain(ARTICLE_FOUR_SOURCE);
  });

  it("leaves the how-to-out surfaces off the gutter on purpose", () => {
    const stillOut = [
      "components/iceland-map.tsx",
      "components/quoted-name-ledger.tsx",
      "components/printed-heading-identities.tsx",
      "components/markdown-body.tsx",
      "app/system/page.tsx",
      "components/paste-intake-form.tsx",
      "components/opnir-review-feed.tsx",
    ];
    for (const file of stillOut) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(
        source.includes("CitationGutter") || source.includes("CitationClaim"),
        `${file} was left out of the gutter on purpose`,
      ).toBe(false);
    }
  });
});
