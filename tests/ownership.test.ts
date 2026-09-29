import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getContradictions, getEdges } from "@/lib/content";
import {
  OWNERSHIP_CONTRADICTION_IDS,
  getSoeOwnershipChecklist,
  incomingOwns,
  isOwnsEdge,
  ownershipStatement,
  soeHoleRows,
  soeOwnershipCaption,
  soeOwnershipFor,
} from "@/lib/ownership";

const ROOT = process.cwd();

describe("ownership statements", () => {
  it("keeps public entities off the primary nav", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/public-entities");
  });

  it("labels an owns edge as subject and interested party", () => {
    const edge = getEdges().find(
      (item) =>
        item.relationship === "owns" &&
        item.from === "rikissjodur" &&
        item.to === "landsvirkjun",
    );
    expect(edge).toBeDefined();
    const statement = ownershipStatement(edge!);
    expect(statement.subjectSlug).toBe("landsvirkjun");
    expect(statement.interestedPartySlug).toBe("rikissjodur");
    expect(statement.quotation).toContain("99,9%");
    expect(statement.source).toMatch(/^https:\/\//);
    expect(statement.href).toMatch(/^\/connections\//);
  });

  it("does not treat appoints or regulates as owns", () => {
    const edges = getEdges();
    expect(
      edges.some(
        (edge) =>
          edge.from === "ministry-of-finance" &&
          edge.to === "landsvirkjun" &&
          edge.relationship === "appoints",
      ),
    ).toBe(true);
    expect(
      incomingOwns("landsvirkjun", edges).every((edge) => isOwnsEdge(edge)),
    ).toBe(true);
    expect(
      incomingOwns("landsvirkjun", edges).some(
        (edge) => edge.relationship === "appoints",
      ),
    ).toBe(false);
    expect(
      incomingOwns("il-sjodur", edges).length,
    ).toBe(0);
    expect(
      edges.some(
        (edge) => edge.to === "il-sjodur" && edge.relationship === "regulates",
      ),
    ).toBe(true);
  });

  it("lists inventory public companies and funds without inventing a total", () => {
    const rows = getSoeOwnershipChecklist();
    expect(rows.length).toBe(11);
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    expect(bySlug.get("landsvirkjun")?.status).toBe("sourced");
    expect(bySlug.get("landsbankinn")?.status).toBe("sourced");
    expect(bySlug.get("isavia")?.status).toBe("sourced");
    expect(bySlug.get("ruv")?.status).toBe("sourced");
    expect(bySlug.get("landsnet")?.status).toBe("sourced");
    expect(bySlug.get("orkuveita-reykjavikur")?.status).toBe("sourced");
    expect(bySlug.get("islandsbanki")?.status).toBe("none");
    expect(bySlug.get("il-sjodur")?.status).toBe("none");
    expect(bySlug.get("lsr")?.status).toBe("none");
    expect(bySlug.get("on-power")?.status).toBe("none");
    expect(bySlug.get("orka-natturunnar")?.status).toBe("none");
    expect(soeHoleRows(rows).map((row) => row.slug).sort()).toEqual([
      "il-sjodur",
      "islandsbanki",
      "lsr",
      "on-power",
      "orka-natturunnar",
    ]);
    const caption = soeOwnershipCaption(rows);
    expect(caption).toMatch(/11 inventory public companies and funds/);
    expect(caption).toMatch(/5 have none/);
    expect(caption).toMatch(/Counts are rows, not share totals/);
    expect(caption).not.toMatch(/\b(ISK|mkr|makr|USD)\b/);
    expect(soeOwnershipFor("islandsbanki", rows)?.statements).toHaveLength(0);
    expect(soeOwnershipFor("althingi", rows)).toBeNull();
  });

  it("keeps Landsbankinn’s shareholder-count sides as a contradiction, not a replacement owns row", () => {
    const row = soeOwnershipFor("landsbankinn");
    expect(row?.status).toBe("sourced");
    expect(row?.contradictions.map((item) => item.id)).toContain(
      "landsbankinn-shareholder-count",
    );
    expect(OWNERSHIP_CONTRADICTION_IDS).toContain("landsbankinn-shareholder-count");
    expect(
      getContradictions().some((item) => item.id === "landsbankinn-shareholder-count"),
    ).toBe(true);
  });

  it("does not scrape, fetch, or call a model from the ownership modules", () => {
    const files = [
      "lib/ownership.ts",
      "components/soe-ownership-checklist.tsx",
      "app/public-entities/page.tsx",
      "app/connections/[id]/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
      expect(source, file).not.toMatch(/P749/);
    }
  });
});
