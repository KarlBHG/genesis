import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import {
  DEFAULT_LEFT,
  DEFAULT_RIGHT,
  onlyTouches,
  sharedTouches,
  touchKey,
  touchPairKey,
  touchesOf,
} from "@/lib/compare";
import { getEdges } from "@/lib/content";

const LANDSPITALI_ISLANDSBANKI = [
  "Landspítali; 2026-01-26; Íslandsbanki hf.; 1775476; 96424",
  "Landspítali; 2026-08-25; Íslandsbanki hf.; 3546720; 245",
] as const;

describe("compare touch keys", () => {
  it("does not add a compare nav leaf", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/compare");
  });

  it("keeps two Landspítali invoices to Íslandsbanki as two cited rows", () => {
    const rows = getEdges().filter(
      (edge) =>
        edge.from === "landspitali" &&
        edge.relationship === "pays" &&
        edge.to === "islandsbanki",
    );
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
    const touches = touchesOf("islandsbanki", edges).filter(
      (touch) => touch.pairKey === pair,
    );
    expect(touches).toHaveLength(2);
    expect(new Set(touches.map((touch) => touch.key)).size).toBe(2);
    expect(touches.every((touch) => touch.key !== pair)).toBe(true);
    expect(touches.map((touch) => touch.note).sort()).toEqual([
      ...LANDSPITALI_ISLANDSBANKI,
    ]);

    const [first, second] = edges.filter(
      (edge) =>
        edge.from === "landspitali" &&
        edge.relationship === "pays" &&
        edge.to === "islandsbanki",
    );
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
    expect(sharedTouches(left, right).some((row) => row.left.pairKey === "in:pays:landspitali")).toBe(
      false,
    );
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
    ).toHaveLength(1);
    expect(onlyTouches(syn, nova).some((touch) => touch.pairKey === "in:pays:landspitali")).toBe(
      false,
    );
  });
});
