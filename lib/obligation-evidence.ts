import { compareAsOf } from "@/lib/as-of";
import { OBLIGATION_SECTIONS, type ObligationSection } from "@/lib/obligations";
import type { Edge } from "@/lib/types";

/**
 * The sourced lines behind a curated obligation theme.
 *
 * The theme index itself is authored copy: a list of commitments with a note
 * each. That copy is not a connection, so the evidence strip under each theme
 * shows the typed edges that touch the records the theme links to. A theme with
 * no typed edges shows none rather than borrowing another theme's.
 */

/** How many lines a theme shows before deferring to the entry pages. */
export const OBLIGATION_EVIDENCE_LIMIT = 8;

/** Entry slugs a theme's items point at. Anchors and section links resolve to none. */
export function obligationSlugs(section: ObligationSection): string[] {
  const slugs = new Set<string>();
  for (const item of section.items) {
    const [pathname] = item.href.split("#");
    const segments = (pathname ?? "").split("/").filter(Boolean);
    if (segments.length === 2) slugs.add(segments[1]!);
  }
  return [...slugs];
}

export function obligationEvidence(
  section: ObligationSection,
  edges: readonly Edge[],
): Edge[] {
  const slugs = new Set(obligationSlugs(section));
  if (slugs.size === 0) return [];
  return edges
    .filter((edge) => slugs.has(edge.from) || slugs.has(edge.to))
    .sort(
      (a, b) =>
        compareAsOf(b.asOf, a.asOf) ||
        a.fromTitle.localeCompare(b.fromTitle, "en") ||
        a.toTitle.localeCompare(b.toTitle, "en"),
    );
}

export function obligationEvidenceBySection(
  edges: readonly Edge[],
): Map<string, Edge[]> {
  return new Map(
    OBLIGATION_SECTIONS.map((section) => [
      section.id,
      obligationEvidence(section, edges),
    ]),
  );
}
