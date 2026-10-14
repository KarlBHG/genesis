import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import {
  DEFAULT_LEFT,
  DEFAULT_RIGHT,
  droppedCompareTouches,
  onlyTouches,
  sharedTouches,
  touchKey,
  touchPairKey,
  touchesOf,
} from "@/lib/compare";
import { getEdges } from "@/lib/content";
import type { Edge } from "@/lib/types";

const LANDSPITALI_ISLANDSBANKI = [
  "Landspítali; 2026-01-26; Íslandsbanki hf.; 1775476; 96424",
  "Landspítali; 2026-08-25; Íslandsbanki hf.; 3546720; 245",
] as const;

const LANDSPITALI_PAYS = {
  syn: [
    "Landspítali; 2026-01-30; Sýn hf.; PB14458005; 734562",
    "Landspítali; 2026-08-28; Sýn hf.; SB0629049; 3592",
  ],
  nova: [
    "Landspítali; 2026-01-30; Nova hf.; BR2512-6968644; 1249060",
    "Landspítali; 2026-08-28; Nova hf.; BR2607-6741095; 1249060",
  ],
  trackwell: [
    "Landspítali; 2026-08-31; Trackwell hf.; SR26-11815; 4955",
    "Landspítali; 2026-08-31; Trackwell hf.; SR26-11816; 4886",
  ],
  "verifone-a-islandi": [
    "Landspítali; 2026-07-31; Verifone á Íslandi ehf.; R633054; 15214",
    "Landspítali; 2026-07-31; Verifone á Íslandi ehf.; R633055; 15214",
  ],
} as const;

const VENDOR_SLUGS = [
  "syn",
  "nova",
  "trackwell",
  "verifone-a-islandi",
] as const;

function paysRows(from: string, to: string): Edge[] {
  return getEdges().filter(
    (edge) =>
      edge.from === from && edge.relationship === "pays" && edge.to === to,
  );
}

function incomingPays(slug: string, pair = "in:pays:landspitali") {
  return touchesOf(slug, getEdges()).filter((touch) => touch.pairKey === pair);
}

describe("compare touch keys", () => {
  it("does not add a compare nav leaf", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/compare");
  });

  it("keeps two Landspítali invoices to Íslandsbanki as two cited rows", () => {
    const rows = paysRows("landspitali", "islandsbanki");
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.quotation).sort()).toEqual([
      ...LANDSPITALI_ISLANDSBANKI,
    ]);
    expect(rows[0]?.quotation).not.toBe(rows[1]?.quotation);
    expect(new Set(rows.map((row) => row.asOf)).size).toBe(2);
    expect(rows.every((row) => row.amount?.basis === "invoice")).toBe(true);
  });

  it("gives those invoices distinct keys and the same pair key", () => {
    const edges = getEdges();
    const pair = touchPairKey("in", "pays", "landspitali");
    expect(pair).toBe("in:pays:landspitali");
    const touches = incomingPays("islandsbanki", pair);
    expect(touches).toHaveLength(2);
    expect(new Set(touches.map((touch) => touch.key)).size).toBe(2);
    expect(touches.every((touch) => touch.key !== pair)).toBe(true);
    expect(touches.map((touch) => touch.note).sort()).toEqual([
      ...LANDSPITALI_ISLANDSBANKI,
    ]);

    const [first, second] = paysRows("landspitali", "islandsbanki");
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(touchKey("in", first!)).not.toBe(touchKey("in", second!));
    expect(touchKey("in", first!)).toContain(first!.asOf);
    expect(touchKey("in", first!)).toContain(first!.quotation);
    expect(touchKey("in", first!)).toContain(first!.amount?.basis ?? "");
  });

  it("lists both invoices on the default compare page, not as a silent collision", () => {
    expect(DEFAULT_LEFT).toBe("arion-banki");
    expect(DEFAULT_RIGHT).toBe("islandsbanki");
    const edges = getEdges();
    const left = touchesOf(DEFAULT_LEFT, edges);
    const right = touchesOf(DEFAULT_RIGHT, edges);
    const onlyRight = onlyTouches(right, left);
    const landspitaliPays = onlyRight.filter(
      (touch) => touch.pairKey === "in:pays:landspitali",
    );
    expect(landspitaliPays).toHaveLength(2);
    expect(new Set(landspitaliPays.map((touch) => touch.key)).size).toBe(2);
    expect(droppedCompareTouches(right, left)).toEqual([]);
    expect(sharedTouches(left, right).some((row) => row.left.pairKey === "in:pays:landspitali")).toBe(
      false,
    );
  });

  it.each(VENDOR_SLUGS)(
    "keeps two cited Landspítali invoices to %s, distinguished by asOf/start/basis/quotation",
    (slug) => {
      const expected = LANDSPITALI_PAYS[slug];
      const rows = paysRows("landspitali", slug);
      expect(rows).toHaveLength(2);
      expect(rows.map((row) => row.quotation).sort()).toEqual([...expected]);
      expect(rows[0]?.quotation).not.toBe(rows[1]?.quotation);
      expect(rows.every((row) => row.amount?.basis === "invoice")).toBe(true);

      const pair = touchPairKey("in", "pays", "landspitali");
      const touches = incomingPays(slug, pair);
      expect(touches).toHaveLength(2);
      expect(new Set(touches.map((touch) => touch.key)).size).toBe(2);
      expect(touches.every((touch) => touch.key !== pair)).toBe(true);
      expect(touches.map((touch) => touch.note).sort()).toEqual([...expected]);

      const [first, second] = rows;
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(touchKey("in", first!)).not.toBe(touchKey("in", second!));
      expect(touchKey("in", first!)).toContain(first!.asOf);
      expect(touchKey("in", first!)).toContain(first!.start ?? "");
      expect(touchKey("in", first!)).toContain(first!.amount?.basis ?? "");
      expect(touchKey("in", first!)).toContain(first!.quotation);
      expect(touchKey("in", second!)).toContain(second!.quotation);
    },
  );

  it("still lists both Trackwell invoices when asOf and amount basis match", () => {
    const rows = paysRows("landspitali", "trackwell");
    expect(rows[0]?.asOf).toBe(rows[1]?.asOf);
    expect(rows[0]?.amount?.basis).toBe(rows[1]?.amount?.basis);
    expect(touchKey("in", rows[0]!)).not.toBe(touchKey("in", rows[1]!));
  });

  it("still lists both Verifone invoices when asOf, basis, and amount value match", () => {
    const rows = paysRows("landspitali", "verifone-a-islandi");
    expect(rows[0]?.asOf).toBe(rows[1]?.asOf);
    expect(rows[0]?.amount?.basis).toBe(rows[1]?.amount?.basis);
    expect(rows[0]?.amount?.value).toBe(rows[1]?.amount?.value);
    expect(touchKey("in", rows[0]!)).not.toBe(touchKey("in", rows[1]!));
  });

  it("does not drop a cited Landspítali invoice when two vendors share the pair", () => {
    const edges = getEdges();
    const syn = touchesOf("syn", edges);
    const nova = touchesOf("nova", edges);
    const shared = sharedTouches(syn, nova);
    const landspitali = shared.filter(
      (row) => row.left.pairKey === "in:pays:landspitali",
    );
    expect(landspitali).toHaveLength(2);
    expect(new Set(landspitali.map((row) => row.left.key)).size).toBe(2);
    expect(new Set(landspitali.map((row) => row.right.key)).size).toBe(2);
    expect(landspitali.map((row) => row.left.note).sort()).toEqual([
      ...LANDSPITALI_PAYS.syn,
    ]);
    expect(landspitali.map((row) => row.right.note).sort()).toEqual([
      ...LANDSPITALI_PAYS.nova,
    ]);
    expect(
      onlyTouches(syn, nova).some((touch) => touch.pairKey === "in:pays:landspitali"),
    ).toBe(false);
    expect(droppedCompareTouches(syn, nova)).toEqual([]);
    expect(droppedCompareTouches(nova, syn)).toEqual([]);

    const trackwell = touchesOf("trackwell", edges);
    const verifone = touchesOf("verifone-a-islandi", edges);
    const vendorShared = sharedTouches(trackwell, verifone).filter(
      (row) => row.left.pairKey === "in:pays:landspitali",
    );
    expect(vendorShared).toHaveLength(2);
    expect(vendorShared.map((row) => row.left.note).sort()).toEqual([
      ...LANDSPITALI_PAYS.trackwell,
    ]);
    expect(vendorShared.map((row) => row.right.note).sort()).toEqual([
      ...LANDSPITALI_PAYS["verifone-a-islandi"],
    ]);
    expect(droppedCompareTouches(trackwell, verifone)).toEqual([]);
  });

  it("still treats the same relationship to the same other entry as shared", () => {
    const edges = getEdges();
    const syn = touchesOf("syn", edges);
    const nova = touchesOf("nova", edges);
    const shared = sharedTouches(syn, nova);
    expect(shared.some((row) => row.left.pairKey === "in:pays:landspitali")).toBe(
      true,
    );
    expect(
      shared.filter((row) => row.left.pairKey === "in:pays:landspitali"),
    ).toHaveLength(2);
    expect(
      onlyTouches(syn, nova).some((touch) => touch.pairKey === "in:pays:landspitali"),
    ).toBe(false);
  });
});

describe("compare folio register", () => {
  it("does not wrap columns in Cards or amber plates", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "app/compare/page.tsx"),
      "utf8",
    );
    expect(page).not.toMatch(/from ["']@\/components\/ui\/card["']/);
    expect(page).not.toContain("<Card");
    expect(page).not.toContain("bg-amber");
    expect(page).toContain("compare-spread");
    expect(page).toContain("touch.key");
    expect(page).toContain("data-compare-column");
  });
});
