import { describe, expect, it } from "vitest";

import { navLeafCount } from "@/components/site-header";
import { getCatalog, getEdges, getOffices } from "@/lib/content";
import {
  assertPrintedHeadingIdentities,
  identityForPaysEdge,
  identityKey,
  PRINTED_HEADING_IDENTITIES,
  uniqueMatchForHeading,
} from "@/lib/identities";
import {
  buildInvoiceCoverageLedger,
  coverageCaption,
  paysCoverageStatus,
} from "@/lib/invoice-coverage";
import { parseLedgerQuotation, programFromPrintedMalaflok } from "@/lib/opnir-feed";

function catalogNames() {
  return [
    ...getCatalog().map((entry) => ({ id: entry.slug, title: entry.title })),
    ...getOffices().map((office) => ({ id: office.id, title: office.title })),
  ];
}

describe("invoice coverage ledger", () => {
  it("classifies every pays row as joined, explicit-null, or unreviewed", () => {
    const edges = getEdges().filter((edge) => edge.relationship === "pays");
    const ledger = buildInvoiceCoverageLedger(getEdges());
    expect(ledger.total).toBe(edges.length);
    expect(ledger.total).toBe(100);
    expect(ledger.joined).toBe(36);
    expect(ledger.explicitNull).toBe(64);
    expect(ledger.unreviewed).toBe(0);
    expect(ledger.joined + ledger.explicitNull + ledger.unreviewed).toBe(
      ledger.total,
    );
    for (const edge of edges) {
      const status = paysCoverageStatus(edge);
      if (edge.program) expect(status).toBe("joined");
      else if (edge.programNullReason?.trim()) expect(status).toBe("explicit-null");
      else expect(status).toBe("unreviewed");
    }
  });

  it("groups every pays row by buyer and captions counts, never krónur", () => {
    const ledger = buildInvoiceCoverageLedger(getEdges());
    const fromGroups = ledger.groups.reduce(
      (sum, group) => sum + group.rows.length,
      0,
    );
    expect(fromGroups).toBe(ledger.total);
    expect(ledger.groups.length).toBeGreaterThanOrEqual(14);
    const courts = ledger.groups.find((group) => group.buyerSlug === "courts");
    expect(courts?.rows).toHaveLength(3);
    expect(courts?.joined).toBe(3);
    expect(courts?.printedBuyer).toBe("Hæstiréttur");

    const caption = coverageCaption(ledger);
    expect(caption).toContain("100 invoice rows");
    expect(caption).toContain("36 joined");
    expect(caption).toContain("64 with an explicit null reason");
    expect(caption).toContain("0 unreviewed");
    expect(caption).toContain("not krónur");
    expect(caption).not.toMatch(/\b(ISK|mkr|makr|USD)\b/);
    expect(caption).not.toMatch(/\d{4,}/);
  });

  it("does not map a printed málaflokkur onto a program", () => {
    expect(programFromPrintedMalaflok("02.10")).toBeNull();
    expect(programFromPrintedMalaflok("Dómstólar")).toBeNull();
  });
});

describe("printed heading identity", () => {
  it("keeps primary nav at ten leaves and does not add a coverage leaf", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
  });

  it("records Hæstiréttur sitting on courts, not a silent haestirettur invoice", () => {
    const names = catalogNames();
    assertPrintedHeadingIdentities(
      PRINTED_HEADING_IDENTITIES,
      getEdges(),
      names,
    );
    const statement = PRINTED_HEADING_IDENTITIES.find(
      (row) => row.id === "opnir-buyer-haestirettur-on-courts",
    );
    expect(statement).toBeDefined();
    expect(statement!.printedHeading).toBe("Hæstiréttur");
    expect(statement!.catalogSlug).toBe("courts");
    expect(statement!.status).toBe("sitting");
    expect(uniqueMatchForHeading("Hæstiréttur", names)).toBe("haestirettur");

    const pays = getEdges().filter((edge) => edge.relationship === "pays");
    const courtsPays = pays.filter((edge) => edge.from === "courts");
    expect(courtsPays).toHaveLength(3);
    expect(
      courtsPays.every((edge) => edge.quotation.startsWith("Hæstiréttur;")),
    ).toBe(true);
    expect(pays.some((edge) => edge.from === "haestirettur")).toBe(false);

    for (const edge of courtsPays) {
      const identity = identityForPaysEdge(edge);
      expect(identity?.id).toBe("opnir-buyer-haestirettur-on-courts");
      expect(parseLedgerQuotation(edge.quotation)?.buyer).toBe("Hæstiréttur");
    }
  });

  it("leaves unmatched headings unmatched and does not stub a player", () => {
    expect(
      PRINTED_HEADING_IDENTITIES.some((row) => row.status === "unmatched"),
    ).toBe(false);
    const unmatched = {
      id: "example-unmatched-vendor",
      printedHeading: "Nowhere ehf.",
      catalogSlug: "ghost-vendor" as string | null,
      role: "to" as const,
      status: "unmatched" as const,
      source: "https://opnirreikningar.is/",
      quotation: "Nowhere ehf. is printed as a vendor",
      asOf: "2026-01-30",
    };
    expect(() =>
      assertPrintedHeadingIdentities(
        [unmatched],
        [],
        catalogNames(),
      ),
    ).toThrow(/unmatched identity cannot sit on a catalog slug/);

    unmatched.catalogSlug = null;
    expect(() =>
      assertPrintedHeadingIdentities([unmatched], [], catalogNames()),
    ).not.toThrow();
  });

  it("refuses a pays row whose unique title match differs without a sitting statement", () => {
    const names = catalogNames();
    const courtsPays = getEdges().find(
      (edge) => edge.relationship === "pays" && edge.from === "courts",
    );
    expect(courtsPays).toBeDefined();
    expect(() =>
      assertPrintedHeadingIdentities([], [courtsPays!], names),
    ).toThrow(/unique catalog title match is haestirettur/);
    expect(
      identityKey({
        printedHeading: "Hæstiréttur",
        role: "from",
        catalogSlug: "courts",
      }),
    ).toBe(
      identityKey({
        printedHeading: "Hæstiréttur",
        role: "from",
        catalogSlug: "courts",
      }),
    );
  });
});
