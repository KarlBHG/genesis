import Fuse from "fuse.js";

import type { SearchDoc } from "@/lib/types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ð/g, "d")
    .replace(/þ/g, "th")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function haystack(doc: SearchDoc): string {
  return normalize(
    `${doc.title} ${doc.topics.join(" ")} ${doc.summary} ${doc.body}`,
  );
}

export function searchEntries(docs: SearchDoc[], query: string): SearchDoc[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = normalize(trimmed);
  const fuse = new Fuse(docs, {
    keys: [
      { name: "title", weight: 0.45 },
      { name: "summary", weight: 0.25 },
      { name: "topics", weight: 0.15 },
      { name: "body", weight: 0.15 },
    ],
    threshold: 0.5,
    ignoreLocation: true,
    ignoreDiacritics: true,
    includeScore: true,
    minMatchCharLength: 2,
  });
  const scores = new Map(
    fuse.search(trimmed).map((result) => [result.item.slug, result.score ?? 1]),
  );

  return docs
    .flatMap((doc) => {
      const titleHit = normalize(doc.title).includes(needle);
      const textHit = haystack(doc).includes(needle);
      const score = scores.get(doc.slug);
      const fuzzyHit = score !== undefined && score <= 0.5;
      if (!textHit && !fuzzyHit) return [];
      const rank = titleHit ? 0 : textHit ? 1 : 2;
      return [{ doc, rank, score: score ?? 1 }];
    })
    .sort((a, b) => a.rank - b.rank || a.score - b.score)
    .map((hit) => hit.doc);
}
