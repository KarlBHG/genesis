import { compareAsOf } from "@/lib/as-of";
import type { Edge } from "@/lib/types";

export function paysEdgesForProgram(programSlug: string, edges: Edge[]): Edge[] {
  return edges
    .filter(
      (edge) =>
        edge.relationship === "pays" && edge.program === programSlug,
    )
    .sort(
      (a, b) =>
        compareAsOf(b.asOf, a.asOf) ||
        a.fromTitle.localeCompare(b.fromTitle, "en") ||
        a.toTitle.localeCompare(b.toTitle, "en"),
    );
}

export function uniqueProgramNullReasons(edges: Edge[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const edge of edges) {
    if (edge.relationship !== "pays" || edge.program != null) continue;
    const reason = edge.programNullReason?.trim();
    if (!reason || seen.has(reason)) continue;
    seen.add(reason);
    out.push(reason);
  }
  return out;
}
