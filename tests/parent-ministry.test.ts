import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getEdges } from "@/lib/content";
import {
  PARENT_MINISTRY_CATEGORIES,
  getParentMinistryChecklist,
  incomingParentMinistry,
  isParentMinistryFrom,
  isParentMinistryScope,
  parentMinistryCaption,
  parentMinistryFor,
  parentMinistryHoles,
} from "@/lib/parent-ministry";

const ROOT = process.cwd();

describe("parent-ministry density", () => {
  it("keeps public entities off the primary nav", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/public-entities");
  });

  it("covers in-scope agencies, regulators, courts, universities, and public companies", () => {
    const rows = getParentMinistryChecklist();
    expect(rows.length).toBe(33);
    expect(PARENT_MINISTRY_CATEGORIES).toEqual([
      "agencies-regulators",
      "courts",
      "universities",
      "public-companies-funds",
    ]);
    expect(rows.every((row) => isParentMinistryScope(row.slug))).toBe(true);
    expect(parentMinistryFor("althingi")).toBeNull();
    expect(parentMinistryFor("reykjavikurborg")).toBeNull();
  });

  it("adds cited parent edges and leaves empty parents empty", () => {
    const rows = getParentMinistryChecklist();
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    expect(bySlug.get("competition-authority")?.status).toBe("sourced");
    expect(bySlug.get("personuvernd")?.status).toBe("sourced");
    expect(bySlug.get("umhverfis-og-orkustofnun")?.status).toBe("sourced");
    expect(bySlug.get("natturuverndarstofnun")?.status).toBe("sourced");
    expect(bySlug.get("haestirettur")?.status).toBe("sourced");
    expect(bySlug.get("landsrettur")?.status).toBe("sourced");
    expect(bySlug.get("fjarskiptastofa")?.status).toBe("sourced");
    expect(bySlug.get("hagstofa-islands")?.status).toBe("sourced");
    expect(bySlug.get("sedlabanki")?.status).toBe("sourced");
    expect(bySlug.get("financial-supervisory-authority")?.status).toBe("sourced");
    expect(
      parentMinistryHoles(rows)
        .map((row) => row.slug)
        .sort(),
    ).toEqual([
      "islandsbanki",
      "lsr",
      "on-power",
      "orka-natturunnar",
      "samband-islenskra-sveitarfelaga",
      "vinnumalastofnun",
    ]);
    expect(bySlug.get("sedlabanki")?.catalogParent).toBe("independent");
    expect(bySlug.get("samband-islenskra-sveitarfelaga")?.catalogParent).toBe("");
    expect(bySlug.get("vinnumalastofnun")?.catalogParent).toBeNull();
    const caption = parentMinistryCaption(rows);
    expect(caption).toMatch(/33 agencies, regulators, courts, universities/);
    expect(caption).toMatch(/6 have an empty parent/);
    expect(caption).toMatch(/Counts are rows, not totals/);
    expect(caption).not.toMatch(/\b(ISK|mkr|makr|USD)\b/);
  });

  it("does not treat MFA represents or union seats as a parent", () => {
    const edges = getEdges();
    expect(
      edges.some(
        (edge) =>
          edge.from === "samband-islenskra-sveitarfelaga" &&
          edge.to === "ministry-of-infrastructure" &&
          edge.relationship === "represents",
      ),
    ).toBe(true);
    expect(incomingParentMinistry("samband-islenskra-sveitarfelaga", edges)).toEqual(
      [],
    );
    expect(
      incomingParentMinistry("vinnumalastofnun", edges).some((edge) =>
        ["asi", "bhm", "bsrb", "sa-confederation"].includes(edge.from),
      ),
    ).toBe(false);
    expect(isParentMinistryFrom("ministry-for-foreign-affairs")).toBe(true);
    expect(
      incomingParentMinistry("eea-agreement").length,
    ).toBe(0);
    expect(parentMinistryFor("lsr")?.status).toBe("empty");
    expect(
      incomingParentMinistry("lsr", edges).some(
        (edge) => edge.from === "financial-supervisory-authority",
      ),
    ).toBe(false);
  });

  it("does not scrape, fetch, or call a model from the parent-ministry modules", () => {
    const files = [
      "lib/parent-ministry.ts",
      "components/parent-ministry-checklist.tsx",
      "app/public-entities/page.tsx",
      "components/entry-detail.tsx",
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
