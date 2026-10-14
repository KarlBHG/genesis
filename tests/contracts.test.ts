import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { edgeKey } from "@/components/connection-graph";
import { navLeafCount } from "@/components/site-header";
import {
  MONEY_BASES,
  MONEY_UNITS,
  getAudits,
  getCatalog,
  getChanges,
  getContradictions,
  getEdges,
  getFlows,
  getOfficeById,
  getOffices,
  getOtherFlows,
  getPolicyAreas,
  quotationPrintsValue,
  resolveSlug,
  getTreaties,
  toSearchDocs,
} from "@/lib/content";
import { MAP_ENTRIES, MAP_VIEWS, placePinKind, viewOf } from "@/lib/geo-map";
import { mapSlugHasTypedLinkage } from "@/lib/map-graph";
import { icelandicLang } from "@/lib/lang";
import { highlightParts, searchEntries } from "@/lib/search";
import { LANDING_CHAINS, resolveChain } from "@/lib/landing";
import { OBLIGATION_SECTIONS } from "@/lib/obligations";
import {
  DEFAULT_LAYER,
  DEFAULT_LAYERS,
  DEFAULT_VIEWS,
  defaultQuery,
  parseMapQuery,
  serializeMapQuery,
} from "@/lib/map-query";
import { GROUP_BY_VIEW, groupEdges } from "@/lib/connection-groups";
import { asOfMeta, classifyAsOfBucket, compareAsOf } from "@/lib/as-of";
import {
  droppedCompareTouches,
  sharedTouches,
  touchesOf,
} from "@/lib/compare";
import { edgeHref, edgeId, findEdgeById } from "@/lib/edge-id";
import { partitionOtherFlows } from "@/lib/fiscal-phases";
import {
  KENNITALA_RECORDS,
  assertKennitalaRecord,
} from "@/lib/identifiers";
import { kennitalaChecksumOk } from "@/lib/kennitala";
import { paysEdgesForProgram } from "@/lib/invoice-budget";
import {
  GOVDIRECTORY_ICELAND,
  getGovdirectoryLedger,
} from "@/lib/govdirectory";
import {
  PUBLIC_ENTITY_CATEGORIES,
  getPublicEntityCoverage,
  summarizePublicEntityCoverage,
} from "@/lib/public-entities";
import type { Edge } from "@/lib/types";

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

  it("keeps treaty and obligation indexes populated", () => {
    expect(getTreaties().length).toBeGreaterThanOrEqual(14);
    expect(OBLIGATION_SECTIONS.length).toBeGreaterThanOrEqual(9);
    expect(LANDING_CHAINS.length).toBe(6);
  });

  it("keeps contradictions, changes, and audits loadable", () => {
    expect(getContradictions().length).toBeGreaterThan(0);
    expect(Array.isArray(getChanges())).toBe(true);
    expect(getAudits().length).toBeGreaterThan(0);
  });

  it("keeps primary nav at ten leaf destinations or fewer", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
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

  it("gives every compare touch a unique key", () => {
    const edges = getEdges();
    const slugs = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
    const leftover: string[] = [];
    for (const slug of slugs) {
      const keys = touchesOf(slug, edges).map((touch) => touch.key);
      if (new Set(keys).size !== keys.length) leftover.push(slug);
    }
    expect(leftover).toEqual([]);
  });

  it("does not drop a cited compare row when a pair-key repeats", () => {
    const edges = getEdges();
    const bySlug = new Map<string, ReturnType<typeof touchesOf>>();
    for (const edge of edges) {
      if (!bySlug.has(edge.from)) bySlug.set(edge.from, touchesOf(edge.from, edges));
      if (!bySlug.has(edge.to)) bySlug.set(edge.to, touchesOf(edge.to, edges));
    }
    const leftover: string[] = [];
    const slugs = [...bySlug.keys()];
    for (let i = 0; i < slugs.length; i++) {
      const leftSlug = slugs[i]!;
      const left = bySlug.get(leftSlug)!;
      for (let j = i + 1; j < slugs.length; j++) {
        const rightSlug = slugs[j]!;
        const right = bySlug.get(rightSlug)!;
        if (sharedTouches(left, right).length === 0) continue;
        if (droppedCompareTouches(left, right).length > 0) {
          leftover.push(`${leftSlug}|${rightSlug}`);
        }
        if (droppedCompareTouches(right, left).length > 0) {
          leftover.push(`${rightSlug}|${leftSlug}`);
        }
      }
    }
    expect(leftover).toEqual([]);
  });

  it("gives every edge a unique permalink id", () => {
    const ids = getEdges().map(edgeId);
    expect(new Set(ids).size).toBe(ids.length);
    const first = getEdges()[0];
    expect(first).toBeDefined();
    expect(findEdgeById(edgeId(first!), getEdges())).toEqual(first);
    expect(edgeHref(first!).startsWith("/connections/")).toBe(true);
  });
});

describe("views cover the graph", () => {
  it("leaves zero edges outside the map views", () => {
    const leftover = getEdges().filter(
      (edge) => viewOf(edge.relationship) == null,
    );
    expect(
      leftover.map((e) => `${e.from} ${e.relationship} ${e.to}`),
    ).toEqual([]);
  });

  it("keeps authorisations, invoices, and contracts in separate views", () => {
    expect(viewOf("funds")).toBe("authorisations");
    expect(viewOf("pays")).toBe("spending");
    expect(viewOf("sells-power-to")).toBe("contracts");
    expect(viewOf("export-of")).toBe("contracts");
    expect(viewOf("import-line-of")).toBe("contracts");
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

  it("does not scale pins by typed-edge degree and keeps off-map as text", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "components", "iceland-map.tsx"),
      "utf8",
    );
    expect(source).toContain("const radius = selected ? 10 : cluster ? 8 : 5.5");
    expect(source).not.toMatch(/radius[^\n]*(lit|shown|edges)\.length/);
    expect(source).not.toMatch(/maplibre|MapLibre/i);
    expect(source).not.toMatch(/ollama/i);
    expect(source).toContain("On the drawing, no typed line");
    expect(source).toContain("geo-caption-legend");
    expect(source).toContain("edgeHref");
    expect(source).toContain("Off-map endpoints");
    expect(source).toContain("data-pin-kind");
    expect(source).toContain("geo-engrave");
    expect(source).toContain("Copy this plate");
    expect(source).toContain("geo-share-copy");
    expect(source).toContain('variant="ghost"');
    expect(source).not.toContain('variant="outline"');
    expect(source).toContain("geo-chip");
    expect(source).toContain("geo-figure");
    expect(source).toContain('data-pan={panPoint ? "focus" : undefined}');
    expect(source).toContain("geo-plate-key");
    expect(source).not.toContain("geo-pulse-ring");
    expect(source).not.toMatch(/Mapbox|Google Maps|cesium/i);
  });

  it("stamps vacant, typed, and mixed pins without splitting a Nominatim cluster", () => {
    expect(placePinKind([{ pinOnly: true }])).toBe("vacant");
    expect(placePinKind([{ pinOnly: false }])).toBe("typed");
    expect(placePinKind([{ pinOnly: true }, { pinOnly: false }])).toBe("mixed");
    expect(placePinKind([{ pinOnly: false }, { pinOnly: false }])).toBe("typed");
  });

  it("ratchets edge endpoints missing from the map (baseline 39)", () => {
    // Pin only when a cited page names an Icelandic seat. Treaties without
    // that seat, career-CV orgs, and trade-partner countries stay off-map.
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
    expect(unmapped.sort()).toEqual(
      [
        "2010-icesave-referendum",
        "2011-icesave-referendum",
        "2013-icesave-judgment",
        "air-services-agreements",
        "arkitektafelag-islands",
        "bjarkarhlid",
        "brim",
        "china",
        "eea-joint-committee",
        "efta",
        "efta-third-country-ftas",
        "eu-fish-protocol-1972",
        "ferdifelagid-utivist",
        "germany",
        "golfsamband-islands",
        "handknattleiksdeild-vikings",
        "hlidarendi-ses",
        "hoyvik-agreement",
        "iceland-china-fta",
        "iceland-eu-agriculture-2018",
        "iceland-greenland-trade",
        "investment-protection-agreements",
        "kvennaathvarfid",
        "lanasjodur-islenskra-namsmanna",
        "leikfelag-reykjavikur",
        "mp-banki",
        "multilateral-trade-system",
        "netherlands",
        "norway",
        "schengen",
        "sjalfstaedir-evropumenn",
        "ssai",
        "stadarholl-radgjof",
        "thorsmork",
        "throskahjalp",
        "un-2030-agenda",
        "unifem-island",
        "united-kingdom",
        "united-states",
      ].sort(),
    );
  });

  it("marks every untyped catalog island as prose-only", () => {
    const edges = getEdges();
    const offices = getOffices();
    const islands = getCatalog().filter(
      (entry) => !mapSlugHasTypedLinkage(entry.slug, edges, offices),
    );
    expect(islands.map((entry) => entry.slug).sort()).toEqual(
      [
        "1874-constitution",
        "1944-republic",
        "930-althingi",
        "banking-after-2008",
        "frimurarareglan",
        "landsbankinn-state-holding",
        "landsvirkjun-power-sales",
        "lsr-net-assets-2024",
        "oddfellowreglan",
        "pension-savings-2025",
        "retail",
        "torg",
      ].sort(),
    );
    for (const entry of islands) {
      expect(entry.proseOnly, entry.slug).toBe(true);
    }
    for (const entry of getCatalog()) {
      if (!entry.proseOnly) continue;
      expect(
        mapSlugHasTypedLinkage(entry.slug, edges, offices),
        `${entry.slug} is prose-only but linked`,
      ).toBe(false);
    }
  });
});

describe("public-entity inventory (phase 1)", () => {
  it("keeps the canonical list in the catalog with unique slugs", () => {
    const rows = getPublicEntityCoverage();
    expect(rows.length).toBeGreaterThanOrEqual(63);
    const slugs = rows.map((row) => row.slug);
    expect(new Set(slugs).size).toBe(rows.length);
    for (const row of rows) {
      expect(row.inCatalog, `${row.slug} missing from catalog`).toBe(true);
    }
  });

  it("keeps map and typed linkage coverage complete", () => {
    const rows = getPublicEntityCoverage();
    for (const row of rows) {
      if (row.mapMode === "office-only") continue;
      expect(row.mapped, `${row.slug} missing map pin`).toBe(true);
      expect(
        row.typedLinkage,
        `${row.slug} has no direct or office typed linkage`,
      ).toBe(true);
    }
  });

  it("ratchets category floors for breadth", () => {
    const summary = summarizePublicEntityCoverage();
    expect(summary.map((row) => row.category)).toEqual(PUBLIC_ENTITY_CATEGORIES);
    const floorByCategory = {
      state: 15,
      "agencies-regulators": 14,
      courts: 5,
      universities: 3,
      municipalities: 12,
      "public-companies-funds": 11,
      "political-parties": 3,
    } as const;
    for (const row of summary) {
      const floor = floorByCategory[row.category];
      expect(row.total, `${row.category} total`).toBeGreaterThanOrEqual(floor);
      expect(row.mapped, `${row.category} mapped`).toBeGreaterThanOrEqual(floor);
      expect(
        row.typedLinked,
        `${row.category} typed-linked`,
      ).toBeGreaterThanOrEqual(floor);
    }
  });

  it("keeps the Govdirectory checklist as a snapshot, not as typed edges", () => {
    expect(GOVDIRECTORY_ICELAND.source).toBe("https://www.govdirectory.org/iceland/");
    expect(GOVDIRECTORY_ICELAND.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const byId = new Map(getGovdirectoryLedger().map((group) => [group.id, group]));
    const ministries = byId.get("ministries");
    const courts = byId.get("courts");
    const municipalities = byId.get("municipalities");
    expect(ministries?.total).toBe(12);
    expect(courts?.total).toBe(10);
    expect(municipalities?.total).toBeGreaterThanOrEqual(62);
    expect(municipalities?.matched).toBe(12);
    expect(courts?.grouped).toBe(8);

    const unmatchedMinistryNames = new Set(
      ministries?.rows
        .filter((row) => row.matchKind === "unmatched")
        .map((row) => row.name),
    );
    for (const name of [
      "Ministry of Culture and Business Affairs",
      "Ministry of Higher Education, Science and Innovation",
      "Ministry of Food, Agriculture and Fisheries",
      "Ministry of Social Affairs and Labour",
    ]) {
      expect(unmatchedMinistryNames.has(name), name).toBe(true);
    }
    for (const row of ministries?.rows ?? []) {
      if (!row.slug) continue;
      expect(row.inInventory, row.slug).toBe(true);
    }
  });

  it("ratchets office-linked depth and high-impact edge density", () => {
    const rows = getPublicEntityCoverage();
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    expect(rows.filter((row) => row.officeLinked).length).toBeGreaterThanOrEqual(
      20,
    );
    const floors = {
      althingi: 10,
      "ministry-of-finance": 16,
      "prime-ministers-office": 11,
      "ministry-of-industries": 5,
      landsvirkjun: 8,
    } as const;
    for (const [slug, floor] of Object.entries(floors)) {
      const row = bySlug.get(slug);
      expect(row, `${slug} missing from public-entity inventory`).toBeDefined();
      expect(
        row!.directTypedLinks,
        `${slug} direct typed links`,
      ).toBeGreaterThanOrEqual(floor);
    }
  });

  it("does not treat Wikidata or Govdirectory as an owns or parent-ministry source", () => {
    const parentTypes = new Set(["owns", "regulates", "appoints"]);
    const edges = getEdges().filter((edge) => parentTypes.has(edge.relationship));
    for (const edge of edges) {
      expect(edge.source, `${edge.from} → ${edge.to}`).not.toMatch(/wikidata/i);
      expect(edge.source, `${edge.from} → ${edge.to}`).not.toMatch(
        /govdirectory/i,
      );
      expect(edge.quotation, `${edge.from} → ${edge.to}`).not.toMatch(/P749/);
    }
  });
});

describe("invoice program bridge", () => {
  it("tags every pays row with year and program or null reason", () => {
    const edges = getEdges().filter((edge) => edge.relationship === "pays");
    expect(edges).toHaveLength(100);
    for (const edge of edges) {
      expect(edge.year, `${edge.from} → ${edge.to}`).toBe("2026");
      if (edge.program) {
        expect(edge.program.startsWith("policy-area-")).toBe(true);
        expect(edge.programNullReason).toBeNull();
        expect(edge.programSource?.trim()).toBeTruthy();
        expect(edge.programQuotation?.trim()).toBeTruthy();
      } else {
        expect(edge.programNullReason?.trim()).toBeTruthy();
      }
    }
  });

  it("joins exclusive-operator invoices from ministry reports", () => {
    const edges = getEdges();
    const hospital = paysEdgesForProgram(
      "policy-area-23-sjukrahusthjonusta",
      edges,
    );
    expect(hospital.length).toBeGreaterThanOrEqual(8);
    expect(hospital.every((edge) => edge.from === "landspitali")).toBe(true);

    const environment = paysEdgesForProgram(
      "policy-area-17-umhverfismal",
      edges,
    );
    expect(environment.length).toBeGreaterThanOrEqual(8);
    expect(
      environment.every((edge) => edge.from === "natturuverndarstofnun"),
    ).toBe(true);

    const rights = paysEdgesForProgram(
      "policy-area-10-rettindi-einstaklinga-trumal-og-stjornsysla-domsmala",
      edges,
    );
    expect(rights.length).toBeGreaterThanOrEqual(5);
    expect(rights.every((edge) => edge.from === "personuvernd")).toBe(true);

    const telecoms = paysEdgesForProgram(
      "policy-area-11-samgongu-og-fjarskiptamal",
      edges,
    );
    expect(telecoms.length).toBeGreaterThanOrEqual(8);
    expect(telecoms.every((edge) => edge.from === "fjarskiptastofa")).toBe(
      true,
    );

    const supreme = paysEdgesForProgram("policy-area-02-domstolar", edges);
    expect(supreme.length).toBeGreaterThanOrEqual(3);
    expect(supreme.every((edge) => edge.from === "courts")).toBe(true);
    expect(
      supreme.every((edge) => edge.quotation.startsWith("Hæstiréttur;")),
    ).toBe(true);
  });

  it("rejects unknown program slugs at load time", () => {
    const edges = getEdges();
    for (const edge of edges) {
      if (!edge.program) continue;
      expect(
        getFlows().some((flow) => flow.slug === edge.program),
        edge.program,
      ).toBe(true);
    }
  });
});

describe("edge amounts are source-bound", () => {
  it("prints exactly the four amount fields with the right types", () => {
    for (const [index, row] of rawEdges().entries()) {
      if (row.amount == null) continue;
      const money = row.amount as Record<string, unknown>;
      expect(Object.keys(money).sort(), `edge ${index + 1}`).toEqual([
        "basis",
        "quotation",
        "unit",
        "value",
      ]);
      expect(typeof money.value, `edge ${index + 1} value`).toBe("number");
      expect(Number.isFinite(money.value), `edge ${index + 1} value`).toBe(true);
      expect(typeof money.quotation).toBe("string");
      expect((money.quotation as string).trim()).not.toBe("");
    }
  });

  it("allows only the four documented units and four bases", () => {
    expect([...MONEY_UNITS].sort()).toEqual(["ISK", "USD", "makr", "mkr"]);
    for (const edge of getEdges()) {
      if (!edge.amount) continue;
      const where = `${edge.from} ${edge.relationship} ${edge.to}`;
      expect(MONEY_UNITS.has(edge.amount.unit), `${where} unit`).toBe(true);
      expect(MONEY_BASES.has(edge.amount.basis), `${where} basis`).toBe(true);
    }
  });

  it("cites the amount out of the edge quotation, never beside it", () => {
    for (const edge of getEdges()) {
      if (!edge.amount) continue;
      const where = `${edge.from} ${edge.relationship} ${edge.to}`;
      expect(edge.quotation.includes(edge.amount.quotation), where).toBe(true);
      expect(edge.amount.quotation.trim().length, where).toBeGreaterThan(0);
    }
  });

  it("finds every value printed verbatim in its own citation", () => {
    for (const edge of getEdges()) {
      if (!edge.amount) continue;
      expect(
        quotationPrintsValue(edge.amount.value, edge.amount.quotation),
        `${edge.from} ${edge.relationship} ${edge.to} prints ${edge.amount.value}`,
      ).toBe(true);
    }
  });

  it("reads Icelandic and plain separators without reformatting either", () => {
    expect(quotationPrintsValue(192293.9, "of 192.293,9 m.kr. for hospital")).toBe(
      true,
    );
    expect(quotationPrintsValue(77252, "of 77.252,0 m.kr. for Dómsmálaráðuneyti")).toBe(
      true,
    );
    expect(quotationPrintsValue(-227728, "20251402752; -227728")).toBe(true);
    expect(quotationPrintsValue(192293.9, "of 192.294 m.kr.")).toBe(false);
    expect(quotationPrintsValue(437690, "no figure on this line")).toBe(false);
  });

  it("covers Article 4 rows and every tagged invoice", () => {
    const rows = rawEdges();
    const article4 = rows.filter(
      (row) => row.type === "funds" && /Article 4/.test(row.quotation as string),
    );
    expect(article4).toHaveLength(10);
    for (const row of article4) {
      expect(row.amount, `${row.from} -> ${row.to}`).toBeDefined();
      expect((row.amount as { unit: string }).unit).toBe("mkr");
      expect((row.amount as { basis: string }).basis).toBe("authorisation");
    }
    const tagged = rows.filter(
      (row) => row.type === "pays" && ("year" in row || "program" in row),
    );
    expect(tagged).toHaveLength(100);
    for (const row of tagged) {
      expect(row.amount, `${row.from} -> ${row.to}`).toBeDefined();
      expect((row.amount as { unit: string }).unit).toBe("ISK");
      expect((row.amount as { basis: string }).basis).toBe("invoice");
    }
    expect(getEdges().filter((edge) => edge.amount)).toHaveLength(169);
  });

  it("leaves amount off every row whose quotation prints no figure", () => {
    for (const edge of getEdges()) {
      if (!edge.amount) continue;
      expect(
        quotationPrintsValue(edge.amount.value, edge.quotation),
        `${edge.from} ${edge.relationship} ${edge.to}`,
      ).toBe(true);
    }
  });

  it("never adds two amounts together anywhere in the app", () => {
    const dirs = ["app", "components", "lib", "scripts"];
    const files: string[] = [];
    const walk = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx|mts|mjs)$/.test(name)) files.push(full);
      }
    };
    for (const dir of dirs) walk(path.join(ROOT, dir));
    expect(files.length).toBeGreaterThan(0);

    // Reading a printed figure is fine. Folding several into one is not: a
    // total that no cited page prints has no source to stand on.
    const banned: [RegExp, string][] = [
      [/\bamount\b[^\n]*\.reduce\s*\(/, "reduces over amounts"],
      [/\.reduce\s*\([^\n]*\bamount\b/, "reduces over amounts"],
      [/\+=[^\n]*\bamount\b/, "accumulates an amount"],
      [/\bamount\b[^\n]*\+=/, "accumulates an amount"],
      [/amount(\?)?\.value[^\n]*\+[^\n]*amount(\?)?\.value/, "adds two amounts"],
      [/\b(sum|total)(Amounts?|Values?|Isk)\s*[(=]/i, "builds a derived total"],
    ];
    const offences: string[] = [];
    for (const file of files) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      for (const [index, line] of lines.entries()) {
        if (line.trimStart().startsWith("*")) continue;
        for (const [pattern, why] of banned) {
          if (pattern.test(line)) {
            offences.push(`${path.relative(ROOT, file)}:${index + 1} ${why}`);
          }
        }
      }
    }
    expect(offences).toEqual([]);
  });
});

describe("visualisation primitives", () => {
  it("ships the visualisation primitives and no generic chart library", () => {
    for (const file of [
      "bar.tsx",
      "magnitude.tsx",
      "ego-network.tsx",
      "ego-layout.ts",
      "edge-row.tsx",
      "policy-treemap.tsx",
      "index.ts",
      "money.ts",
    ]) {
      expect(
        fs.existsSync(path.join(ROOT, "components", "viz", file)),
        `components/viz/${file}`,
      ).toBe(true);
    }
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
    ) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
    const installed = Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    });
    for (const banned of [
      "recharts",
      "chart.js",
      "react-chartjs-2",
      "victory",
      "nivo",
      "@nivo/core",
      "apexcharts",
      "echarts",
      "visx",
      "@visx/visx",
      "plotly.js",
    ]) {
      expect(installed, `${banned} would replace the bespoke look`).not.toContain(
        banned,
      );
    }
    for (const needed of ["d3-scale", "d3-shape", "d3-force"]) {
      expect(installed).toContain(needed);
      expect(installed).toContain(`@types/${needed}`);
    }
  });

  it("keeps everything but the interactive network server-renderable", () => {
    const dir = path.join(ROOT, "components", "viz");
    const client = fs
      .readdirSync(dir)
      .filter((name) =>
        fs.readFileSync(path.join(dir, name), "utf8").startsWith('"use client"'),
      );
    expect(client).toEqual(["ego-network.tsx"]);
  });

  it("lays out an ego network from typed edges, the same way every time", async () => {
    const { egoLayout } = await import("@/components/viz/ego-layout");
    const edges = getEdges().filter(
      (edge) => edge.from === "treasury-budget-2026" && edge.relationship === "funds",
    );
    expect(edges.length).toBeGreaterThan(0);
    const layout = egoLayout("treasury-budget-2026", edges);
    expect(layout.links).toHaveLength(edges.length);
    expect(layout.nodes.length).toBe(
      new Set(edges.flatMap((edge) => [edge.from, edge.to])).size,
    );
    const centre = layout.nodes.find((node) => node.isCentre);
    expect(centre?.slug).toBe("treasury-budget-2026");
    for (const node of layout.nodes) {
      expect(Number.isFinite(node.x) && Number.isFinite(node.y), node.slug).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(layout.width);
      expect(node.y).toBeLessThanOrEqual(layout.height);
    }
    const again = egoLayout("treasury-budget-2026", edges);
    expect(again.nodes).toEqual(layout.nodes);
  });

  it("prints a figure the way its own source printed it", async () => {
    const { comparable, printedFigure, widestFigure } = await import(
      "@/components/viz/money"
    );
    const authorisation = getEdges().find(
      (edge) => edge.to === "prime-ministers-office" && edge.amount,
    );
    expect(printedFigure(authorisation!.amount!)).toBe("5.448,3 m.kr.");
    const justice = getEdges().find(
      (edge) => edge.to === "ministry-of-justice" && edge.amount,
    );
    expect(printedFigure(justice!.amount!)).toBe("77.252 m.kr.");

    const authorisations = getEdges()
      .filter((edge) => edge.amount?.basis === "authorisation")
      .map((edge) => edge.amount!);
    expect(comparable(authorisations)).toBe(true);
    // The widest printed figure, not their total.
    expect(widestFigure(authorisations)).toBe(393868.7);
    const mixed = getEdges()
      .filter((edge) => edge.amount)
      .map((edge) => edge.amount!);
    expect(comparable(mixed)).toBe(false);
  });

  it("keeps EdgeRow the only place an edge row is spelled out", () => {
    const row = fs.readFileSync(
      path.join(ROOT, "components", "viz", "edge-row.tsx"),
      "utf8",
    );
    // The four surfaces named in the plan adopt this renderer, so it has to
    // cover every part they draw today.
    for (const part of [
      "AsOfChip",
      "labelize(edge.relationship)",
      "CitationGutter",
      "edge.quotation",
      "edge.organizationTitle",
      "edge.programQuotation",
      "edge.source",
      "edge.year",
      "printedFigure",
      "edgeHref",
      "Open this connection",
    ]) {
      expect(row, `EdgeRow is missing ${part}`).toContain(part);
    }
  });
});

describe("one design system", () => {
  const sourceFiles = (): string[] => {
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(name)) files.push(full);
      }
    };
    for (const dir of ["app", "components", "lib"]) walk(path.join(ROOT, dir));
    return files;
  };

  it("keeps every colour in the token sheet, not hand-written in a component", () => {
    // Satori renders the OG cards without a CSS engine, so it can resolve
    // neither a custom property nor oklch. That file restates the palette as
    // hex and says so; it is the only place allowed to.
    const satori = path.join(ROOT, "lib", "og-entry-image.tsx");
    const offences: string[] = [];
    for (const file of sourceFiles()) {
      if (file === satori) continue;
      for (const [index, line] of fs
        .readFileSync(file, "utf8")
        .split("\n")
        .entries()) {
        if (/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/.test(line.replace(/#[a-z][\w-]*/g, ""))) {
          offences.push(`${path.relative(ROOT, file)}:${index + 1} hex colour`);
        }
        if (/\boklch\(/.test(line) || /\brgba?\(/.test(line)) {
          offences.push(`${path.relative(ROOT, file)}:${index + 1} colour function`);
        }
      }
    }
    expect(offences).toEqual([]);
  });

  it("has exactly two rooms and no third palette", () => {
    const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
    // The light paper surface is `:root`; the dark geographic room is scoped.
    expect(css).toContain(".geo-room {");
    expect(css).not.toMatch(/^\.dark \{/m);
    const rooms = fs
      .readFileSync(path.join(ROOT, "app", "map", "page.tsx"), "utf8")
      .match(/geo-room/g);
    expect(rooms).toHaveLength(1);
    for (const dir of ["app", "components"]) {
      const usingGeoTokens = sourceFiles()
        .filter((file) => file.startsWith(path.join(ROOT, dir)))
        .filter((file) => /var\(--geo-|-\(--geo-/.test(fs.readFileSync(file, "utf8")))
        .map((file) => path.relative(ROOT, file));
      for (const file of usingGeoTokens) {
        expect(
          ["app/map/page.tsx", "components/iceland-map.tsx"],
          `${file} reaches for the dark room outside it`,
        ).toContain(file);
      }
    }
  });

  it("frames every page at one width", () => {
    const offences: string[] = [];
    for (const file of sourceFiles()) {
      const source = fs.readFileSync(file, "utf8");
      for (const stale of source.match(/\bmax-w-[2-6]xl\b/g) ?? []) {
        offences.push(`${path.relative(ROOT, file)} still uses ${stale}`);
      }
    }
    expect(offences).toEqual([]);
    const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
    expect(css).toContain("--container-shell:");
    expect(css).toContain("--container-reading:");
    expect(css).toContain("--container-gutter:");
    expect(css).toContain("--container-folio:");
    for (const shell of ["components/site-header.tsx", "components/site-footer.tsx"]) {
      expect(fs.readFileSync(path.join(ROOT, shell), "utf8")).toContain(
        "max-w-shell",
      );
    }
  });
});

describe("Icelandic quotations are marked up as Icelandic", () => {
  it("tags Icelandic prose and leaves English prose alone", () => {
    const icelandic = getEdges().filter((edge) => icelandicLang(edge.quotation));
    expect(icelandic.length).toBeGreaterThanOrEqual(15);
    for (const edge of icelandic) {
      expect(/[þðæöáíúýéó]/i.test(edge.quotation), edge.quotation.slice(0, 60)).toBe(
        true,
      );
    }
    // English sentences that merely name Icelandic bodies stay English.
    expect(
      icelandicLang(
        "Article 4 prints a 2026 total authorisation of 73.572,4 m.kr. for Mennta- og barnamálaráðuneyti.",
      ),
    ).toBeUndefined();
    expect(
      icelandicLang(
        "The page lists the six as Samtök orku- og veitufyrirtækja and Samtök verslunar og þjónustu.",
      ),
    ).toBeUndefined();
    expect(
      icelandicLang(
        "í fjárlögum fyrir árið 2024 sem hafa verið samþykkt á Alþingi og nema um 379,4 ma.kr.",
      ),
    ).toBe("is");
    // A bare ledger row is names and figures, not prose in either language.
    expect(
      icelandicLang("Landspítali; 2026-08-28; Sýn hf.; SB0629049; 3592"),
    ).toBeUndefined();
  });

  it("marks up every surface that prints a quotation", () => {
    /** A surface may mark up its own quotation or hand it to one of these. */
    const DELEGATES = [
      "ProvenanceCard",
      "ProvenanceEdgeCard",
      "EdgeRow",
      "CitationGutter",
      "CitationClaim",
    ];
    for (const file of [
      "app/connections/page.tsx",
      "app/connections/[id]/page.tsx",
      "app/system/page.tsx",
      "components/entry-detail.tsx",
      "components/evidence-room.tsx",
      "components/iceland-map.tsx",
      "components/program-invoice-bridge.tsx",
      "components/markdown-body.tsx",
      "components/budget-programs-section.tsx",
      "components/obligations-index.tsx",
      "components/paste-intake-form.tsx",
      "components/opnir-review-feed.tsx",
      "components/provenance-card.tsx",
      "components/citation-gutter.tsx",
      "components/viz/edge-row.tsx",
    ]) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(
        source.includes("icelandicLang") ||
          DELEGATES.some((name) => source.includes(`<${name}`)),
        `${file} prints a quotation without marking its language`,
      ).toBe(true);
    }
  });
});

const HAGSTOFA_GOODS_2024 =
  "https://statice.is/publications/news-archive/external-trade/trade-in-goods-2024-final-data/";

const TRADE_VALUE_RELATIONSHIPS = new Set([
  "export-of",
  "import-line-of",
  "imported-from",
  "exported-to",
]);

function tradeEdgeHasValueOrExplicitNone(quotation: string): boolean {
  const hasBillionIsk = /\d[\d,.]*\s*billion\s*ISK/i.test(quotation);
  const hasShare = /\d+\.?\d*\s*%/.test(quotation);
  const explicitNone =
    /prints no separate (import|export) value|does not break aluminium out in billion ISK|records the printed share only/i.test(
      quotation,
    );
  return hasBillionIsk || (hasShare && !explicitNone) || explicitNone;
}

describe("Hagstofa goods trade edges (P1.3)", () => {
  it("keeps Hagstofa 2024 goods edges with value or explicit none", () => {
    const edges = getEdges().filter(
      (edge) =>
        TRADE_VALUE_RELATIONSHIPS.has(edge.relationship) &&
        edge.source === HAGSTOFA_GOODS_2024,
    );
    expect(edges).toHaveLength(13);
    for (const edge of edges) {
      expect(
        tradeEdgeHasValueOrExplicitNone(edge.quotation),
        `${edge.from} ${edge.relationship} ${edge.to}`,
      ).toBe(true);
    }
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

describe("search api", () => {
  it("serves every record with a title, kind, and link", async () => {
    const { GET } = await import("@/app/api/search/route");
    const response = GET();
    const docs = (await response.json()) as {
      title: string;
      slug: string;
      kind: string;
      href: string;
      summary: string;
    }[];
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      expect(doc.title.trim() !== "").toBe(true);
      expect(doc.href.startsWith("/")).toBe(true);
    }
    expect(docs.some((doc) => doc.slug === "althingi")).toBe(true);
  });
});

describe("map query", () => {
  const slugs = new Set(["althingi", "landsvirkjun"]);

  it("starts from the documented defaults", () => {
    const query = parseMapQuery(
      () => null,
      slugs,
    );
    expect(query.layers).toEqual([...DEFAULT_LAYERS]);
    expect(query.views).toEqual([...DEFAULT_VIEWS]);
    expect(query.layer).toBe(DEFAULT_LAYER);
    expect(query.place).toBeNull();
    expect(query.focus).toBeNull();
    expect(serializeMapQuery(query)).toBe("");
  });

  it("ignores unknown layers, views, places, and slugs", () => {
    const params = new URLSearchParams(
      "layers=state,bogus&views=careers,nope&layer=bogus&place=moon&focus=ghost",
    );
    const query = parseMapQuery(params.get.bind(params), slugs);
    expect(query.layers).toEqual(["state"]);
    expect(query.views).toEqual(["careers"]);
    expect(query.layer).toBe(DEFAULT_LAYER);
    expect(query.place).toBeNull();
    expect(query.focus).toBeNull();
  });

  it("round-trips a focused share link", () => {
    const params = new URLSearchParams(
      "views=careers,authority&place=reykjavik&focus=althingi",
    );
    const query = parseMapQuery(params.get.bind(params), slugs);
    expect(query.place).toBe("reykjavik");
    expect(query.focus).toBe("althingi");
    const again = parseMapQuery(
      new URLSearchParams(serializeMapQuery(query)).get.bind(
        new URLSearchParams(serializeMapQuery(query)),
      ),
      slugs,
    );
    expect(again).toEqual(query);
  });

  it("drops a focus slug that leaves the catalog", () => {
    const params = new URLSearchParams("focus=althingi");
    expect(
      parseMapQuery(params.get.bind(params), new Set()).focus,
    ).toBeNull();
  });

  it("maps the old mixed money view onto authorisations", () => {
    const params = new URLSearchParams("views=money,spending");
    const query = parseMapQuery(params.get.bind(params), slugs);
    expect(query.views).toEqual(["authorisations", "spending"]);
  });
});

describe("connection groups", () => {
  function edge(from: string, relationship: string, to: string): Edge {
    return {
      from,
      fromTitle: from,
      to,
      toTitle: to,
      relationship: relationship as Edge["relationship"],
      source: "https://example.is/",
      quotation: `${from} ${relationship} ${to}`,
      asOf: "2026",
      start: null,
      end: null,
      channel: null,
      organization: null,
      organizationTitle: null,
      year: null,
      program: null,
      programTitle: null,
      programNullReason: null,
      programSource: null,
      programQuotation: null,
    };
  }

  it("covers every view with a grouping rule", () => {
    for (const view of MAP_VIEWS) {
      expect(["from", "relationship", "none"]).toContain(GROUP_BY_VIEW[view.id]);
    }
  });

  it("groups money and spending lines by their source", () => {
    const edges = [
      edge("treasury-budget-2026", "funds", "a"),
      edge("landsvirkjun", "sells-power-to", "b"),
      edge("treasury-budget-2026", "funds", "c"),
    ];
    const groups = groupEdges(edges, "from");
    expect(groups.map((group) => group.key)).toEqual([
      "treasury-budget-2026",
      "landsvirkjun",
    ]);
    expect(groups[0]?.edges).toHaveLength(2);
  });

  it("groups authority lines by relationship", () => {
    const edges = [
      edge("a", "regulates", "b"),
      edge("c", "appoints", "d"),
      edge("e", "regulates", "f"),
    ];
    const groups = groupEdges(edges, "relationship");
    expect(groups.map((group) => group.key)).toEqual([
      "regulates",
      "appoints",
    ]);
  });

  it("keeps every edge of the live graph inside a group", () => {
    const edges = getEdges();
    for (const [view, by] of Object.entries(GROUP_BY_VIEW)) {
      void view;
      const groups = groupEdges(edges, by);
      expect(groups.flatMap((group) => group.edges)).toHaveLength(edges.length);
    }
  });
});

describe("summaries", () => {
  it("resolves arrow slugs to entry titles", () => {
    const titles = new Map(getCatalog().map((entry) => [entry.slug, entry.title]));
    for (const entry of getCatalog()) {
      const dangling = [...entry.summary.matchAll(/→\s*([a-z0-9][a-z0-9-]*)/g)]
        .map((match) => match[1])
        .filter((slug) => titles.has(slug as string));
      expect(
        dangling,
        `${entry.slug} summary points at a bare slug`,
      ).toEqual([]);
    }
    const bank = getCatalog().find((entry) => entry.slug === "landsbankinn");
    expect(bank?.summary).toContain("→ Lilja Björk Einarsdóttir");
  });
});

describe("money partition", () => {
  it("covers every flow exactly once across programs and money", () => {
    const areas = getPolicyAreas();
    const others = getOtherFlows();
    expect(areas).toHaveLength(35);
    const slugs = [...areas, ...others].map((flow) => flow.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBe(getFlows().length);
    expect(others.length).toBeGreaterThan(0);
  });
});

describe("asOf buckets", () => {
  it("classifies ISO, year, undated, and statute edge dates", () => {
    expect(classifyAsOfBucket("2026-08-28")).toBe("iso");
    expect(classifyAsOfBucket("2026-08")).toBe("iso");
    expect(classifyAsOfBucket("2026")).toBe("year");
    expect(classifyAsOfBucket("2021-2024")).toBe("year");
    expect(classifyAsOfBucket("undated on the CV")).toBe("undated");
    expect(classifyAsOfBucket("consolidated statute")).toBe("statute");
    expect(classifyAsOfBucket("consolidated statute, lagasafn 157c, 1 September 2026")).toBe(
      "statute",
    );
    expect(classifyAsOfBucket("institutions list")).toBe("undated");
  });

  it("does not store a source URL in asOf — that field is the date, the URL is source", () => {
    for (const edge of getEdges()) {
      expect(edge.asOf, `${edge.from} ${edge.relationship} ${edge.to}`).not.toMatch(
        /https?:\/\//i,
      );
    }
    const offices = JSON.parse(
      fs.readFileSync(path.join(ROOT, "data", "offices.json"), "utf8"),
    ) as { id: string; asOf: string }[];
    for (const office of offices) {
      expect(office.asOf, office.id).not.toMatch(/https?:\/\//i);
    }
  });

  it("sorts phrase and year dates without treating them as ISO", () => {
    expect(compareAsOf("2026-08-28", "2026")).toBeGreaterThan(0);
    expect(compareAsOf("consolidated statute", "2026-08-01")).toBeGreaterThan(0);
    expect(asOfMeta("2026").bucketLabel).toBe("year");
    expect(asOfMeta("2026-08-28").bucketLabel).toBe("ISO");
  });

  it("gives the top thirty graph hubs an authored lede", () => {
    const edges = getEdges();
    const degree = new Map<string, number>();
    for (const edge of edges) {
      degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
      degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
    }
    const top = [...degree.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([slug]) => slug);
    const bySlug = new Map(getCatalog().map((entry) => [entry.slug, entry]));
    for (const slug of top) {
      const entry = bySlug.get(slug);
      expect(entry, `${slug} missing from catalog`).toBeDefined();
      expect(entry!.lede.trim().length, `${slug} lede`).toBeGreaterThan(0);
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

describe("fiscal phases", () => {
  it("puts commodity and power-sale flows with contracts, not invoices", () => {
    const { contracts, other } = partitionOtherFlows(getOtherFlows());
    const slugs = new Set(contracts.map((flow) => flow.slug));
    expect(slugs.has("aluminium-exports-2024")).toBe(true);
    expect(slugs.has("landsvirkjun-power-sales")).toBe(true);
    expect(other.some((flow) => flow.slug === "treasury-budget-2026")).toBe(true);
    expect(other.some((flow) => flow.slug === "aluminium-exports-2024")).toBe(
      false,
    );
  });
});

describe("sourced kennitala", () => {
  it("stores only checksum-true ids that a cited page prints", () => {
    expect(KENNITALA_RECORDS.length).toBeGreaterThan(0);
    const slugs = new Set(getCatalog().map((entry) => entry.slug));
    const seen = new Set<string>();
    for (const row of KENNITALA_RECORDS) {
      expect(slugs.has(row.slug), `${row.slug} is not in the catalog`).toBe(true);
      expect(seen.has(row.slug), `duplicate kennitala for ${row.slug}`).toBe(
        false,
      );
      seen.add(row.slug);
      assertKennitalaRecord(row);
      expect(kennitalaChecksumOk(row.kennitala)).toBe(true);
    }
  });

  it("rejects a mistyped check digit", () => {
    expect(kennitalaChecksumOk("5402696449")).toBe(false);
  });
});
