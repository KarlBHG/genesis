import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { edgeKey } from "@/components/connection-graph";
import { navLeafCount } from "@/components/site-header";
import {
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
  resolveSlug,
  getTreaties,
  toSearchDocs,
} from "@/lib/content";
import { MAP_ENTRIES, MAP_VIEWS, viewOf } from "@/lib/geo-map";
import { mapSlugHasTypedLinkage } from "@/lib/map-graph";
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
  INVOICE_PROGRAM_PILOT_BUYERS,
  paysEdgesForProgram,
} from "@/lib/invoice-budget";
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

  it("keeps dashboard treaty and obligation indexes populated", () => {
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

  it("gives every map pin a typed edge or an explicit pin-only flag", () => {
    const edges = getEdges();
    const offices = getOffices();
    for (const ref of MAP_ENTRIES) {
      const linked = mapSlugHasTypedLinkage(ref.slug, edges, offices);
      expect(
        linked || ref.pinOnly === true,
        `map pin "${ref.slug}" has no typed linkage and is not marked pinOnly`,
      ).toBe(true);
    }
  });

  it("ratchets edge endpoints missing from the map (baseline 70)", () => {
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
    expect(unmapped.length).toBeLessThanOrEqual(70);
  });
});

describe("invoice program bridge", () => {
  it("tags every pilot pays row with year and program or null reason", () => {
    const edges = getEdges().filter((edge) => edge.relationship === "pays");
    const pilot = edges.filter((edge) =>
      INVOICE_PROGRAM_PILOT_BUYERS.has(edge.from),
    );
    expect(pilot.length).toBeGreaterThanOrEqual(10);
    for (const edge of pilot) {
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

  it("joins Landspítali invoices to hospital services policy area 23", () => {
    const joined = paysEdgesForProgram(
      "policy-area-23-sjukrahusthjonusta",
      getEdges(),
    );
    expect(joined.length).toBeGreaterThanOrEqual(8);
    expect(joined.every((edge) => edge.from === "landspitali")).toBe(true);
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
  it("keeps eleven Hagstofa 2024 goods edges with value or explicit none", () => {
    const edges = getEdges().filter(
      (edge) =>
        TRADE_VALUE_RELATIONSHIPS.has(edge.relationship) &&
        edge.source === HAGSTOFA_GOODS_2024,
    );
    expect(edges).toHaveLength(11);
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
    const views = ["ownership", "investments", "money", "careers", "spending", "authority", "trade"];
    for (const view of views) {
      expect(["from", "relationship", "none"]).toContain(GROUP_BY_VIEW[view]);
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
