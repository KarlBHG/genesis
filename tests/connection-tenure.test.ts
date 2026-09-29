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
    const counts = tenureCounts(edges);
    expect(leftover.length).toBeGreaterThan(0);
    expect(leftover.every(isCareerStored)).toBe(true);
    expect(leftover.every((edge) => isUnprinted(edge.end))).toBe(true);
    expect(leftover.every((edge) => !isCurrentConnection(edge))).toBe(true);
    expect(leftover.some((edge) => edge.relationship === "sits-on-board")).toBe(
      true,
    );
    expect(
      leftover.some(
        (edge) =>
          edge.from === "brynja-baldursdottir" && edge.to === "landsvirkjun",
      ),
    ).toBe(true);
    expect(counts.current + counts.ended + counts.unlabeled).toBe(edges.length);
    expect(unlabeledCareerCaption(leftover)).toContain(String(leftover.length));
    expect(unlabeledCareerCaption(leftover)).toContain(NO_END_STORED);
    for (const edge of leftover) {
      expect(edge.end).not.toBe(edge.asOf);
    }
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
