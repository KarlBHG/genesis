import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { edgeKey } from "@/components/connection-graph";
import { NAV, navLeafCount } from "@/components/site-header";
import { getCatalog, getEdges, getOffices } from "@/lib/content";
import {
  RELATIONSHIP_LIST,
  checkRawEdge,
} from "@/lib/edge-contract";
import { catalogContextFrom, checkIntakeProposal } from "@/lib/edge-intake";
import {
  PAIR_KIND_LIST,
  PAIR_TYPE_EXCEPTIONS,
  PAIR_TYPE_LAW,
  leftoverPairTypeKeys,
  pairAllowed,
  pairKindOf,
  pairTypeEdgeKey,
} from "@/lib/pair-type";
import { incomingParentMinistry, parentMinistryHoles } from "@/lib/parent-ministry";

const ROOT = process.cwd();

const PARENT_MINISTRY_REGULATES = [
  ["ministry-of-industries", "competition-authority"],
  ["ministry-of-justice", "personuvernd"],
  ["ministry-of-the-environment-energy-and-climate", "umhverfis-og-orkustofnun"],
  ["ministry-of-the-environment-energy-and-climate", "natturuverndarstofnun"],
  ["ministry-of-justice", "haestirettur"],
  ["ministry-of-justice", "landsrettur"],
] as const;

function ctx() {
  return catalogContextFrom(getCatalog(), getOffices());
}

describe("pair-type law", () => {
  it("covers every allowlisted verb and every pair kind", () => {
    expect(Object.keys(PAIR_TYPE_LAW).sort()).toEqual(
      [...RELATIONSHIP_LIST].sort(),
    );
    for (const relationship of RELATIONSHIP_LIST) {
      expect(PAIR_TYPE_LAW[relationship].length).toBeGreaterThan(0);
      for (const [from, to] of PAIR_TYPE_LAW[relationship]) {
        expect(PAIR_KIND_LIST).toContain(from);
        expect(PAIR_KIND_LIST).toContain(to);
      }
    }
  });

  it("classifies people, organisations, institutions, and offices", () => {
    const catalog = ctx();
    expect(pairKindOf("kristrun-frostadottir", catalog)).toBe("person");
    expect(pairKindOf("landsvirkjun", catalog)).toBe("organization");
    expect(pairKindOf("ministry-of-industries", catalog)).toBe("organization");
    expect(pairKindOf("ministry-of-justice", catalog)).toBe("institution");
    expect(pairKindOf("prime-minister", catalog)).toBe("office");
    expect(pairKindOf("treasury-budget-2026", catalog)).toBe("flow");
    expect(pairKindOf("not-a-real-slug", catalog)).toBeNull();
  });

  it("accepts every stored row, including listed leftovers", () => {
    const catalog = ctx();
    for (const [index, row] of (
      JSON.parse(
        fs.readFileSync(path.join(ROOT, "data", "edges.json"), "utf8"),
      ) as Record<string, unknown>[]
    ).entries()) {
      const checked = checkRawEdge(row, {
        ...catalog,
        where: `data/edges.json edge ${index + 1}`,
      });
      expect(checked.ok, checked.ok ? "" : checked.errors.join("; ")).toBe(
        true,
      );
    }
  });

  it("ratchets leftover exceptions by edgeKey and does not invent more", () => {
    const catalog = ctx();
    const leftover = leftoverPairTypeKeys(getEdges(), catalog);
    expect(leftover).toEqual([...PAIR_TYPE_EXCEPTIONS].sort());
    expect(PAIR_TYPE_EXCEPTIONS).toHaveLength(2);

    const byKey = new Map(getEdges().map((edge) => [edgeKey(edge), edge]));
    for (const key of PAIR_TYPE_EXCEPTIONS) {
      const edge = byKey.get(key);
      expect(edge, `listed exception is missing: ${key}`).toBeDefined();
      expect(pairTypeEdgeKey(edge!)).toBe(edgeKey(edge!));
      const fromKind = pairKindOf(edge!.from, catalog);
      const toKind = pairKindOf(edge!.to, catalog);
      expect(fromKind && toKind && pairAllowed(edge!.relationship, fromKind, toKind)).toBe(
        false,
      );
    }

    expect(
      leftoverPairTypeKeys(
        getEdges().filter((edge) => edge.relationship === "owns"),
        catalog,
      ),
    ).toEqual([]);
  });

  it("does not treat parent-ministry regulates, appoints, or owns as exceptions", () => {
    const catalog = ctx();
    const edges = getEdges();
    for (const [from, to] of PARENT_MINISTRY_REGULATES) {
      const edge = edges.find(
        (item) =>
          item.from === from &&
          item.to === to &&
          item.relationship === "regulates",
      );
      expect(edge, `${from} → ${to}`).toBeDefined();
      expect(PAIR_TYPE_EXCEPTIONS).not.toContain(edgeKey(edge!));
      const fromKind = pairKindOf(from, catalog)!;
      const toKind = pairKindOf(to, catalog)!;
      expect(pairAllowed("regulates", fromKind, toKind), `${from} → ${to}`).toBe(
        true,
      );
    }
    for (const slug of [
      "competition-authority",
      "personuvernd",
      "umhverfis-og-orkustofnun",
      "natturuverndarstofnun",
      "haestirettur",
      "landsrettur",
    ]) {
      for (const edge of incomingParentMinistry(slug, edges)) {
        expect(PAIR_TYPE_EXCEPTIONS).not.toContain(edgeKey(edge));
      }
    }
    expect(
      parentMinistryHoles()
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
  });

  it("fails fast on an illegal pair and does not rewrite it", () => {
    const catalog = ctx();
    const personRegulates = checkIntakeProposal(
      {
        from: "kristrun-frostadottir",
        to: "landsbankinn",
        type: "regulates",
        asOf: "2026",
        source: "https://www.althingi.is/",
        quotation: "A person does not regulate a bank on this graph.",
      },
      catalog,
    );
    expect(personRegulates.ok).toBe(false);
    if (!personRegulates.ok) {
      expect(personRegulates.errors.join("; ")).toContain(
        "regulates cannot run from person to organization",
      );
    }

    const officeOnBoard = checkIntakeProposal(
      {
        from: "kristrun-frostadottir",
        to: "prime-minister",
        type: "sits-on-board",
        asOf: "2024-12-21",
        source: "https://www.althingi.is/altext/cv/is/?nfaerslunr=1417",
        quotation: "Forsætisráðherra síðan 21. desember 2024.",
        start: "2024-12-21",
        end: "not printed",
        channel: "political",
      },
      catalog,
    );
    expect(officeOnBoard.ok).toBe(false);
    if (!officeOnBoard.ok) {
      expect(officeOnBoard.errors.join("; ")).toContain(
        "sits-on-board cannot run from person to office",
      );
    }

    const personOwns = checkIntakeProposal(
      {
        from: "eyjolfur-armannsson",
        to: "islandsbanki",
        type: "owns",
        asOf: "2021",
        source: "https://www.althingi.is/",
        quotation: "A personal holding stays invests-in, not owns.",
        start: "2021",
        end: "not printed",
        channel: "business",
      },
      catalog,
    );
    expect(personOwns.ok).toBe(false);
    if (!personOwns.ok) {
      expect(personOwns.errors.join("; ")).toContain(
        "owns cannot run from person to organization",
      );
    }

    const cloneCeo = checkIntakeProposal(
      {
        from: "landsvirkjun",
        to: "hordur-arnarson",
        type: "appoints",
        asOf: "2026-04-21",
        source: "https://www.landsvirkjun.com/governance/executive-board",
        quotation:
          "A different sentence appointing the same CEO is not the listed leftover.",
      },
      catalog,
    );
    expect(cloneCeo.ok).toBe(false);
    if (!cloneCeo.ok) {
      expect(cloneCeo.errors.join("; ")).toContain(
        "appoints cannot run from organization to person",
      );
    }
  });

  it("keeps pair-type off the primary nav and does not scrape", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/pair-type");
    const files = ["lib/pair-type.ts", "lib/edge-contract.ts"];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
      expect(source, file).not.toMatch(/P749/);
    }
  });
});
