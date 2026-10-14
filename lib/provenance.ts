/**
 * Retrieval caveats and quotation language for the citation gutter.
 *
 * A caveat records how the quotation came off the page, not what it says. Every
 * rule here matches a note already written into an entry's Sources list: PDF
 * text extraction, a page that only renders after its scripts run, or an
 * address that answered with a bot check instead of article text.
 */

export type RetrievalCaveatKind = "pdf" | "script-shell" | "bot-check";

export type RetrievalCaveat = {
  kind: RetrievalCaveatKind;
  label: string;
  note: string;
};

const PDF_CAVEAT: RetrievalCaveat = {
  kind: "pdf",
  label: "PDF text extraction",
  note:
    "The quotation is text pulled out of a PDF. Column order, table rules, and footnote placement around the sentence are not preserved here, so check the figure against the page it sits on.",
};

const LEDGER_CAVEAT: RetrievalCaveat = {
  kind: "script-shell",
  label: "Script shell",
  note:
    "opnirreikningar.is serves a script shell; the invoice rows arrive from the site’s own lookup after it runs. The stored address is the ledger root because no per-invoice address is printed.",
};

const CENTRAL_BANK_CAVEAT: RetrievalCaveat = {
  kind: "script-shell",
  label: "Script page",
  note:
    "The central bank’s about pages render their article text only after scripts run. The sentence was read from the rendered page, and the act is quoted separately where the two do not agree.",
};

const EFTA_CAVEAT: RetrievalCaveat = {
  kind: "bot-check",
  label: "Bot check",
  note:
    "On the pass that built this record efta.int answered with a bot check and no article text. Nothing is quoted from it; the figures come from the government pages instead.",
};

function hostOf(source: string): string | null {
  try {
    return new URL(source).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pathOf(source: string): string {
  try {
    return new URL(source).pathname.toLowerCase();
  } catch {
    return source.toLowerCase();
  }
}

/** How this source had to be read, when reading it needed a caveat. */
export function retrievalCaveat(source: string): RetrievalCaveat | null {
  const host = hostOf(source);
  if (!host) return null;
  if (host === "efta.int" || host.endsWith(".efta.int")) return EFTA_CAVEAT;
  if (host === "opnirreikningar.is" || host.endsWith(".opnirreikningar.is")) {
    return LEDGER_CAVEAT;
  }
  if (pathOf(source).endsWith(".pdf")) return PDF_CAVEAT;
  if (host === "sedlabanki.is" || host.endsWith(".sedlabanki.is")) {
    return CENTRAL_BANK_CAVEAT;
  }
  return null;
}

/** Host plus first path segment — enough to recognise a source at a glance. */
export function sourceLabel(source: string): string {
  const host = hostOf(source);
  if (!host) return source;
  const bare = host.replace(/^www\d?\./, "");
  const segments = pathOf(source).split("/").filter(Boolean);
  if (segments.length === 0) return bare;
  return `${bare}/${segments[0]}${segments.length > 1 ? "/…" : ""}`;
}
