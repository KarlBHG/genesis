import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getCatalog, getEdges } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import {
  CURRENT_MEMBERSHIP_LABEL,
  ENDED_LABEL,
  NO_END_STORED,
  UNPRINTED_CAREER_ANCHOR,
  UNPRINTED_CAREER_HREF,
  connectionTenure,
  displayConnectionEnd,
  filterByTenure,
  isCareerStored,
  isCurrentConnection,
  isPrintedEnd,
  parseTenureFilter,
  tenureCounts,
  toggleTenureFilter,
  unlabeledCareerCaption,
  unlabeledCareerEnds,
  unprintedCareerRows,
  unprintedCareerTypeCounts,
} from "@/lib/connection-tenure";
import { isCurrentMembership, isUnprinted } from "@/lib/office-membership";

const ROOT = process.cwd();

describe("connections current/ended filter", () => {
  it("keeps connections on the existing nav leaf", () => {
    expect(navLeafCount()).toBe(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).toContain("/connections");
    expect(hrefs).not.toContain("/tenure");
    expect(hrefs).not.toContain("/unprinted-ends");
    expect(UNPRINTED_CAREER_HREF).toBe("/connections#unprinted-ends");
  });

  it("labels an empty end no end date stored, never current", () => {
    expect(displayConnectionEnd("not printed")).toBe(NO_END_STORED);
    expect(displayConnectionEnd("")).toBe(NO_END_STORED);
    expect(displayConnectionEnd(null)).toBe(NO_END_STORED);
    expect(displayConnectionEnd("2024")).toBe("2024");
    expect(displayConnectionEnd("2024-12-21")).toBe("21 December 2024");
    expect(NO_END_STORED).not.toMatch(/current/i);
    expect(connectionTenure({ relationship: "pays", end: null, asOf: "2024" })).toBe(
      "unlabeled",
    );
    expect(
      isCurrentConnection({
        relationship: "pays",
        end: null,
        asOf: "2024-12-21",
      }),
    ).toBe(false);
  });

  it("uses the office membership rule for current, and does not infer it from a missing end", () => {
    expect(
      isCurrentConnection({
        relationship: "holds-office",
        end: "not printed",
        asOf: "2024-12-21",
      }),
    ).toBe(true);
    expect(
      isCurrentMembership({ end: "not printed", asOf: "2024-12-21" }),
    ).toBe(true);
    expect(
      isCurrentConnection({
        relationship: "holds-office",
        end: "2024",
        asOf: "2018-2024",
      }),
    ).toBe(false);
    expect(
      isCurrentConnection({
        relationship: "holds-office",
        end: "not printed",
        asOf: "",
      }),
    ).toBe(false);
    expect(
      isCurrentConnection({
        relationship: "sits-on-board",
        end: "not printed",
        asOf: "2025",
      }),
    ).toBe(false);
    expect(
      isCurrentConnection({
        relationship: "invests-in",
        end: "not printed",
        asOf: "2021",
      }),
    ).toBe(false);
  });

  it("filters current membership and ended without inventing dates", () => {
    const edges = getEdges();
    const current = filterByTenure(edges, "current");
    const ended = filterByTenure(edges, "ended");
    expect(current.length).toBeGreaterThan(0);
    expect(ended.length).toBeGreaterThan(0);
    expect(current.every((edge) => edge.relationship === "holds-office")).toBe(
      true,
    );
    expect(current.every((edge) => isUnprinted(edge.end))).toBe(true);
    expect(current.every((edge) => edge.asOf.trim().length > 0)).toBe(true);
    expect(ended.every((edge) => isPrintedEnd(edge.end))).toBe(true);
    expect(ended.every((edge) => edge.end !== edge.asOf || isPrintedEnd(edge.end))).toBe(
      true,
    );
    const kristrun = current.find(
      (edge) =>
        edge.from === "kristrun-frostadottir" && edge.to === "prime-minister",
    );
    expect(kristrun).toBeDefined();
    expect(displayConnectionEnd(kristrun!.end)).toBe(NO_END_STORED);
    const alma = ended.find(
      (edge) => edge.from === "alma-d-moller" && edge.to === "director-of-health",
    );
    expect(alma).toBeDefined();
    expect(alma!.end).toBe("2024");
    expect(
      current.some(
        (edge) => edge.from === "alma-d-moller" && edge.to === "director-of-health",
      ),
    ).toBe(false);
    expect(parseTenureFilter("current")).toBe("current");
    expect(parseTenureFilter("ended")).toBe("ended");
    expect(parseTenureFilter("now")).toBeNull();
    expect(toggleTenureFilter("current", "current")).toBeNull();
    expect(toggleTenureFilter(null, "ended")).toBe("ended");
  });

  it("lists leftover unlabeled career ends and does not mint edges or fill dates", () => {
    const edges = getEdges();
    const leftover = unlabeledCareerEnds(edges);
    const rows = unprintedCareerRows(edges);
    const counts = tenureCounts(edges);
    const byType = unprintedCareerTypeCounts(leftover);
    const pairs = leftover
      .map((edge) => `${edge.from}\t${edge.relationship}\t${edge.to}`)
      .sort();

    expect(leftover).toHaveLength(23);
    expect(rows).toHaveLength(23);
    expect(byType).toEqual({ investsIn: 3, sitsOnBoard: 20, holdsOffice: 0 });
    expect(leftover.every(isCareerStored)).toBe(true);
    expect(leftover.every((edge) => isUnprinted(edge.end))).toBe(true);
    expect(leftover.every((edge) => edge.end === "not printed")).toBe(true);
    expect(leftover.every((edge) => !isCurrentConnection(edge))).toBe(true);
    expect(rows.every((row) => row.label === NO_END_STORED)).toBe(true);
    expect(rows.every((row) => !/current/i.test(row.label))).toBe(true);
    expect(pairs).toEqual(
      [
        ["alma-d-moller", "sits-on-board", "ssai"],
        ["brynja-baldursdottir", "sits-on-board", "landsvirkjun"],
        ["dadi-mar-kristofersson", "invests-in", "stadarholl-radgjof"],
        ["dadi-mar-kristofersson", "sits-on-board", "ferdifelagid-utivist"],
        ["eirikur-s-johannsson", "sits-on-board", "hagar"],
        ["eyjolfur-armannsson", "invests-in", "islandsbanki"],
        ["greta-maria-gretarsdottir", "sits-on-board", "isavia"],
        ["gylfi-magnusson", "sits-on-board", "orkuveita-reykjavikur"],
        ["hanna-katrin-fridriksson", "sits-on-board", "hlidarendi-ses"],
        ["hanna-katrin-fridriksson", "sits-on-board", "sjalfstaedir-evropumenn"],
        ["harpa-thuridur-bodvarsdottir", "sits-on-board", "landsnet"],
        ["heidar-gudjonsson", "sits-on-board", "islandsbanki"],
        ["helga-jonsdottir", "sits-on-board", "on-power"],
        ["helga-jonsdottir", "sits-on-board", "orka-natturunnar"],
        ["inga-saeland", "invests-in", "icelandair"],
        ["jon-thorvardur-sigurgeirsson", "sits-on-board", "landsbankinn"],
        ["paul-horner", "sits-on-board", "arion-banki"],
        ["ragnar-thor-ingolfsson", "sits-on-board", "bjarg-ibudafelag"],
        ["stefan-jon-hafstein", "sits-on-board", "ruv"],
        ["thorbjorg-sigurdur-gunnlaugsdottir", "sits-on-board", "bjarkarhlid"],
        ["thorgerdur-katrin-gunnarsdottir", "sits-on-board", "golfsamband-islands"],
        ["thorgerdur-katrin-gunnarsdottir", "sits-on-board", "leikfelag-reykjavikur"],
        ["thorgerdur-katrin-gunnarsdottir", "sits-on-board", "throskahjalp"],
      ]
        .map(([from, type, to]) => `${from}\t${type}\t${to}`)
        .sort(),
    );
    expect(counts.current + counts.ended + counts.unlabeled).toBe(edges.length);
    const caption = unlabeledCareerCaption(leftover);
    expect(caption).toContain("23 career lines");
    expect(caption).toContain("3 disclosed holdings");
    expect(caption).toContain("20 board seats");
    expect(caption).toContain(NO_END_STORED);
    expect(caption).toContain("Counts are rows, not totals");
    expect(caption).toContain("Listed, not filled");
    expect(caption).toContain("never “current.”");
    for (const edge of leftover) {
      expect(edge.end).not.toBe(edge.asOf);
    }
    const connections = fs.readFileSync(
      path.join(ROOT, "app", "connections", "page.tsx"),
      "utf8",
    );
    expect(connections).toContain("UnprintedCareerEndsChecklist");
    expect(UNPRINTED_CAREER_ANCHOR).toBe("unprinted-ends");
    expect(
      fs.readFileSync(
        path.join(ROOT, "components", "unprinted-career-ends-checklist.tsx"),
        "utf8",
      ),
    ).toContain("id={UNPRINTED_CAREER_ANCHOR}");
  });

  it("does not draw related as a connection or tenure row", () => {
    const catalog = getCatalog();
    const related = new Set(catalog.flatMap((entry) => entry.related));
    expect(related.size).toBeGreaterThan(0);
    const endpoints = new Set(getEdges().flatMap((edge) => [edge.from, edge.to]));
    const mentions = [...related];
    expect(mentions.some((slug) => !endpoints.has(slug))).toBe(true);
    const connections = fs.readFileSync(
      path.join(ROOT, "app", "connections", "page.tsx"),
      "utf8",
    );
    expect(connections).toContain("stays a mention");
    expect(connections).toContain('className="text-sm">related</code>');
    expect(connections).not.toMatch(/entry\.related/);
    expect(CURRENT_MEMBERSHIP_LABEL).toBe("current membership");
    expect(ENDED_LABEL).toBe("ended");
  });

  it("does not scrape, fetch, or call a model from the tenure modules", () => {
    const files = [
      "lib/connection-tenure.ts",
      "components/connection-tenure-filter.tsx",
      "components/unprinted-career-ends-checklist.tsx",
      "components/viz/edge-row.tsx",
      "app/connections/page.tsx",
      "app/connections/[id]/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
    expect(fs.readFileSync(path.join(ROOT, "data", "edges.json"), "utf8")).toContain(
      '"end": "not printed"',
    );
  });

  it("keeps current-membership permalinks on holds-office rows", () => {
    const kristrun = getEdges().find(
      (edge) =>
        edge.from === "kristrun-frostadottir" &&
        edge.to === "prime-minister" &&
        edge.relationship === "holds-office",
    );
    expect(kristrun).toBeDefined();
    expect(isCurrentConnection(kristrun!)).toBe(true);
    expect(edgeHref(kristrun!)).toMatch(/^\/connections\//);
    expect(displayConnectionEnd(kristrun!.end)).toBe(NO_END_STORED);
  });
});
