import type { Edge, OfficeRecord } from "@/lib/types";

/** True when a map slug appears on a typed edge or on an office tied to that organization. */
export function mapSlugHasTypedLinkage(
  slug: string,
  edges: Pick<Edge, "from" | "to">[],
  offices: Pick<OfficeRecord, "id" | "organization">[],
): boolean {
  for (const edge of edges) {
    if (edge.from === slug || edge.to === slug) return true;
  }
  const officeIds = offices
    .filter((office) => office.organization === slug)
    .map((office) => office.id);
  if (officeIds.length === 0) return false;
  for (const edge of edges) {
    if (officeIds.includes(edge.from) || officeIds.includes(edge.to)) return true;
  }
  return false;
}
