import type { Metadata } from "next";

import { clampSentence, kindNoun, ledeOrSummary } from "@/lib/entry-facts";
import type { Entry } from "@/lib/types";

/** Search engines truncate past roughly this; social cards clip sooner. */
const DESCRIPTION_LIMIT = 200;

export function entryDescription(entry: Entry): string {
  const lead = clampSentence(ledeOrSummary(entry), DESCRIPTION_LIMIT);
  if (lead) return lead;
  return `${kindNoun(entry.kind)} record in the Iceland system map, with the sources it was built from.`;
}

/**
 * One metadata shape for every entry route. The Open Graph image comes from
 * the colocated `opengraph-image` route, so it is not set here.
 */
export function entryMetadata(entry: Entry): Metadata {
  const description = entryDescription(entry);
  return {
    title: entry.title,
    description,
    openGraph: {
      title: entry.title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
    },
  };
}

export const notFoundMetadata: Metadata = {
  title: "Not found",
  description: "No record with this slug is in the catalog.",
};
