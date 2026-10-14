/** Facets of the evidence room, kept in `?evidence=` so a view can be shared. */

export const EVIDENCE_PARAM = "evidence";

export type EvidenceFacet =
  | "all"
  | "contradictions"
  | "changes"
  | "audits"
  | "repeated";

export type EvidenceFacetDef = {
  id: EvidenceFacet;
  label: string;
  /** Section anchor the chip scrolls to. */
  anchor: string;
};

export const EVIDENCE_FACETS: readonly EvidenceFacetDef[] = [
  { id: "all", label: "All", anchor: "evidence" },
  { id: "contradictions", label: "Contradictions", anchor: "contradictions" },
  { id: "changes", label: "Changes", anchor: "changes" },
  { id: "audits", label: "Audits", anchor: "audits" },
  { id: "repeated", label: "Repeated invoices", anchor: "repeated-payments" },
] as const;

const FACET_IDS = new Set<string>(EVIDENCE_FACETS.map((facet) => facet.id));

export function parseEvidenceFacet(
  raw: string | null | undefined,
): EvidenceFacet {
  const value = raw?.trim() ?? "";
  return FACET_IDS.has(value) ? (value as EvidenceFacet) : "all";
}

export function evidenceFacetActive(
  facet: Exclude<EvidenceFacet, "all">,
  selected: EvidenceFacet,
): boolean {
  return selected === "all" || selected === facet;
}
