import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { edgeKey } from "@/components/connection-graph";
import {
  getAudits,
  getCatalog,
  getChanges,
  getContradictions,
  getEdges,
  getFlows,
  getOfficeById,
  getOffices,
  resolveSlug,
  toSearchDocs,
} from "@/lib/content";
import { MAP_ENTRIES, MAP_VIEWS, viewOf } from "@/lib/geo-map";
import { highlightParts, searchEntries } from "@/lib/search";
import { LANDING_CHAINS, resolveChain } from "@/lib/landing";

const ROOT = process.cwd();

function rawEdges(): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "edges.json"), "utf8"),
  );
  if (!Array.isArray(parsed)) throw new Error("edges.json must be a list");
  return parsed as Record<string, unknown>[];
}

function rawOffices(): { id: string }[] {
  const parsed: unknown = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "offices.json"), "utf8"),
  );
  if (!Array.isArray(parsed)) throw new Error("offices.json must be a list");
  return parsed as { id: string }[];
}

describe("catalog loads", () => {
  it("parses every entry and edge without throwing", () => {
    expect(getCatalog().length).toBeGreaterThan(0);
    expect(getEdges().length).toBeGreaterThan(0);
  });

  it("keeps contradictions, changes, and audits loadable", () => {
    expect(getContradictions().length).toBeGreaterThan(0);
    expect(Array.isArray(getChanges())).toBe(true);
    expect(getAudits().length).toBeGreaterThan(0);
  });
});

describe("edge fields", () => {
  it("prints all six required fields on every raw edge", () => {
    for (const [index, row] of rawEdges().entries()) {
      for (const key of ["from", "to", "type", "asOf", "source", "quotation"]) {
        expect(
          typeof row[key] === "string" && (row[key] as string).trim() !== "",
          `edge ${index + 1} is missing ${key}`,
        ).toBe(true);
      }
    }
  });

  it("uses only allowlisted relationship types", () => {
    const allowed = new Set(
      MAP_VIEWS.flatMap((view) => [
        ...(view.relationships as readonly string[]),
      ]),
    );
    for (const [index, row] of rawEdges().entries()) {
      expect(
        allowed.has(row["type"] as string),
        `edge ${index + 1} has unknown type "${row["type"]}"`,
      ).toBe(true);
    }
  });

  it("dates every career edge with start, end, and channel", () => {
    const catalog = getCatalog();
    const people = new Set(
      catalog
        .filter((e) => e.kind === "player" && e.playerType === "person")
        .map((e) => e.slug),
    );
    for (const [index, row] of rawEdges().entries()) {
      const career =
        row["type"] === "holds-office" ||
        row["type"] === "sits-on-board" ||
        (row["type"] === "invests-in" && people.has(row["from"] as string));
      if (!career) continue;
      for (const key of ["start", "end", "channel"]) {
        expect(
          typeof row[key] === "string" && (row[key] as string).trim() !== "",
          `career edge ${index + 1} is missing ${key}`,
        ).toBe(true);
      }
      expect(["political", "business"]).toContain(row["channel"]);
    }
  });

  it("gives every edge a unique key", () => {
    const keys = getEdges().map(edgeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("views cover the graph", () => {
  it("leaves zero edges outside the seven views", () => {
    const leftover = getEdges().filter(
      (edge) => viewOf(edge.relationship) == null,
    );
    expect(
      leftover.map((e) => `${e.from} ${e.relationship} ${e.to}`),
    ).toEqual([]);
  });
});

describe("map membership", () => {
  it("points every map pin at a real catalog entry", () => {
    const slugs = new Set(getCatalog().map((entry) => entry.slug));
    for (const ref of MAP_ENTRIES) {
      expect(slugs.has(ref.slug), `map pin "${ref.slug}" is missing`).toBe(
        true,
      );
    }
  });

  it("ratchets edge endpoints missing from the map (baseline 108)", () => {
    // New edges should bring their endpoints onto the map, or bump this
    // baseline deliberately with map entries added in the same change.
    const mapSlugs = new Set(MAP_ENTRIES.map((ref) => ref.slug));
    const officeIds = new Set(rawOffices().map((o) => o.id));
    const endpoints = new Set<string>();
    for (const edge of getEdges()) {
      endpoints.add(edge.from);
      endpoints.add(edge.to);
    }
    const unmapped = [...endpoints].filter(
      (slug) => !mapSlugs.has(slug) && !officeIds.has(slug),
    );
    expect(unmapped.length).toBeLessThanOrEqual(108);
  });
});

describe("budget programs", () => {
  it("funds all 35 policy areas through Article 4 rows", () => {
    const areas = getFlows().filter((flow) =>
      flow.slug.startsWith("policy-area-"),
    );
    expect(areas).toHaveLength(35);
    const funded = new Set(
      getEdges()
        .filter((edge) => edge.relationship === "funds")
        .map((edge) => edge.to),
    );
    for (const area of areas) {
      expect(funded.has(area.slug), `${area.slug} has no funds edge`).toBe(
        true,
      );
    }
  });
});

describe("offices are routable", () => {
  it("resolves every office id to an /offices page", () => {
    expect(getOffices().length).toBeGreaterThan(0);
    for (const office of getOffices()) {
      const resolved = resolveSlug(office.id);
      expect(resolved, `office "${office.id}" does not resolve`).not.toBeNull();
      expect(resolved?.href).toBe(`/offices/${office.id}`);
      expect(getOfficeById(office.id)?.title).toBe(office.title);
    }
  });

  it("points every office holder and organization at real entries", () => {
    const slugs = new Set(getCatalog().map((entry) => entry.slug));
    for (const office of getOffices()) {
      expect(slugs.has(office.holder)).toBe(true);
      expect(slugs.has(office.organization)).toBe(true);
    }
  });
});

describe("landing chains", () => {
  it("resolves every chain step to a stored edge and a page", () => {
    const edges = getEdges();
    for (const chain of LANDING_CHAINS) {
      expect(chain.steps.length).toBeGreaterThan(0);
      for (const step of resolveChain(chain)) {
        const edge = edges.find(
          (item) =>
            item.fromTitle === step.fromTitle &&
            item.toTitle === step.toTitle,
        );
        expect(edge, `${step.fromTitle} → ${step.toTitle}`).toBeDefined();
        expect(step.fromHref, step.fromTitle).not.toBeNull();
        expect(step.toHref, step.toTitle).not.toBeNull();
      }
    }
  });
});

describe("search", () => {
  it("folds Icelandic characters when highlighting", () => {
    const parts = highlightParts("Alþingi", "althingi");
    expect(parts.some((part) => part.match)).toBe(true);
    const eth = highlightParts("Seðlabanki", "sedlabanki");
    expect(eth.some((part) => part.match)).toBe(true);
  });

  it("finds entries across the ð/þ fold", () => {
    const docs = toSearchDocs(getCatalog());
    const hits = searchEntries(docs, "althingi");
    expect(hits.some((doc) => doc.slug === "althingi")).toBe(true);
  });
});
