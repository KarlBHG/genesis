import { edgesFor, getBySlug, getCatalog, getEdges } from "@/lib/content";
import type { Edge, Entry } from "@/lib/types";

export type CatalogExport = {
  entries: Entry[];
  connections: Edge[];
};

export function catalogExport(): CatalogExport {
  return {
    entries: getCatalog(),
    connections: getEdges(),
  };
}

export function entryExport(slug: string): {
  entry: Entry;
  connectionsOut: Edge[];
  connectionsIn: Edge[];
} | null {
  const entry = getBySlug(slug);
  if (!entry) return null;
  const { out, inn } = edgesFor(slug);
  return { entry, connectionsOut: out, connectionsIn: inn };
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function connectionsCsv(): string {
  const header = ["from", "to", "type", "asOf", "source", "quotation"];
  const rows = getEdges().map((edge) =>
    [edge.from, edge.to, edge.relationship, edge.asOf, edge.source, edge.quotation]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
