import { compareAsOf } from "@/lib/as-of";
import { parseLedgerQuotation } from "@/lib/opnir-feed";
import type { Edge } from "@/lib/types";

export const COVERAGE_STATUSES = [
  "joined",
  "explicit-null",
  "unreviewed",
] as const;

export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  joined: "Joined",
  "explicit-null": "Explicit null",
  unreviewed: "Unreviewed",
};

export function paysCoverageStatus(edge: Pick<Edge, "relationship" | "program" | "programNullReason">): CoverageStatus {
  if (edge.relationship !== "pays") {
    throw new Error("coverage is only defined for pays rows");
  }
  if (edge.program) return "joined";
  if (edge.programNullReason?.trim()) return "explicit-null";
  return "unreviewed";
}

export type InvoiceCoverageRow = {
  edge: Edge;
  buyerSlug: string;
  buyerTitle: string;
  printedBuyer: string;
  vendorSlug: string;
  vendorTitle: string;
  printedVendor: string;
  status: CoverageStatus;
  programSlug: string | null;
  programTitle: string | null;
  programNullReason: string | null;
};

export type InvoiceCoverageBuyerGroup = {
  buyerSlug: string;
  buyerTitle: string;
  printedBuyer: string;
  rows: InvoiceCoverageRow[];
  joined: number;
  explicitNull: number;
  unreviewed: number;
};

export type InvoiceCoverageLedger = {
  groups: InvoiceCoverageBuyerGroup[];
  total: number;
  joined: number;
  explicitNull: number;
  unreviewed: number;
};

function countStatus(rows: readonly InvoiceCoverageRow[], status: CoverageStatus): number {
  return rows.filter((row) => row.status === status).length;
}

function coverageRow(edge: Edge): InvoiceCoverageRow {
  const parsed = parseLedgerQuotation(edge.quotation);
  return {
    edge,
    buyerSlug: edge.from,
    buyerTitle: edge.fromTitle,
    printedBuyer: parsed?.buyer ?? "",
    vendorSlug: edge.to,
    vendorTitle: edge.toTitle,
    printedVendor: parsed?.vendor ?? "",
    status: paysCoverageStatus(edge),
    programSlug: edge.program,
    programTitle: edge.programTitle,
    programNullReason: edge.programNullReason,
  };
}

export function buildInvoiceCoverageLedger(
  edges: readonly Edge[],
): InvoiceCoverageLedger {
  const pays = edges.filter((edge) => edge.relationship === "pays");
  const byBuyer = new Map<string, InvoiceCoverageRow[]>();
  for (const edge of pays) {
    const row = coverageRow(edge);
    const list = byBuyer.get(row.buyerSlug) ?? [];
    list.push(row);
    byBuyer.set(row.buyerSlug, list);
  }

  const groups: InvoiceCoverageBuyerGroup[] = [...byBuyer.entries()]
    .map(([buyerSlug, rows]) => {
      const sorted = [...rows].sort(
        (a, b) =>
          compareAsOf(b.edge.asOf, a.edge.asOf) ||
          a.vendorTitle.localeCompare(b.vendorTitle, "en") ||
          a.edge.quotation.localeCompare(b.edge.quotation, "en"),
      );
      const first = sorted[0]!;
      return {
        buyerSlug,
        buyerTitle: first.buyerTitle,
        printedBuyer: first.printedBuyer,
        rows: sorted,
        joined: countStatus(sorted, "joined"),
        explicitNull: countStatus(sorted, "explicit-null"),
        unreviewed: countStatus(sorted, "unreviewed"),
      };
    })
    .sort((a, b) => a.buyerTitle.localeCompare(b.buyerTitle, "en"));

  const all = groups.flatMap((group) => group.rows);
  return {
    groups,
    total: all.length,
    joined: countStatus(all, "joined"),
    explicitNull: countStatus(all, "explicit-null"),
    unreviewed: countStatus(all, "unreviewed"),
  };
}

function rowWord(count: number): string {
  return count === 1 ? "row" : "rows";
}

/** Caption for the coverage table: row counts only, never a money total. */
export function coverageCaption(ledger: InvoiceCoverageLedger): string {
  return [
    `${ledger.total} invoice ${rowWord(ledger.total)}`,
    `${ledger.joined} joined to a program`,
    `${ledger.explicitNull} with an explicit null reason`,
    `${ledger.unreviewed} unreviewed`,
  ].join(" · ") + ". Counts are rows, not krónur.";
}

export function buyerGroupCaption(group: InvoiceCoverageBuyerGroup): string {
  return [
    `${group.rows.length} ${rowWord(group.rows.length)}`,
    `${group.joined} joined`,
    `${group.explicitNull} explicit null`,
    `${group.unreviewed} unreviewed`,
  ].join(" · ");
}
