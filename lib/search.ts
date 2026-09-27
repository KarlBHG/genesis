import Fuse from "fuse.js";

import type { SearchDoc } from "@/lib/types";

export function searchEntries(docs: SearchDoc[], query: string): SearchDoc[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const fuse = new Fuse(docs, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "summary", weight: 0.25 },
      { name: "topics", weight: 0.2 },
      { name: "body", weight: 0.15 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return fuse.search(trimmed).map((result) => result.item);
}
