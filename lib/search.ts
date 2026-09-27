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

function foldedSpans(text: string): { folded: string; map: number[] } {
  const chars = Array.from(text);
  let folded = "";
  const map: number[] = [];
  for (let index = 0; index < chars.length; index += 1) {
    const piece = normalize(chars[index] ?? "");
    for (let offset = 0; offset < piece.length; offset += 1) {
      map.push(index);
      folded += piece[offset];
    }
  }
  return { folded, map };
}

export type TextPart = { text: string; match: boolean };

export function highlightParts(text: string, query: string): TextPart[] {
  const needle = normalize(query.trim());
  if (!needle) return [{ text, match: false }];
  const chars = Array.from(text);
  const { folded, map } = foldedSpans(text);
  const ranges: [number, number][] = [];
  let from = 0;
  while (from <= folded.length - needle.length) {
    const at = folded.indexOf(needle, from);
    if (at < 0) break;
    const start = map[at];
    const end = (map[at + needle.length - 1] ?? start) + 1;
    if (start !== undefined) ranges.push([start, end]);
    from = at + needle.length;
  }
  if (ranges.length === 0) return [{ text, match: false }];

  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }

  const parts: TextPart[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) {
      parts.push({ text: chars.slice(cursor, start).join(""), match: false });
    }
    parts.push({ text: chars.slice(start, end).join(""), match: true });
    cursor = end;
  }
  if (cursor < chars.length) {
    parts.push({ text: chars.slice(cursor).join(""), match: false });
  }
  return parts.filter((part) => part.text);
}

export function snippetText(doc: SearchDoc, query: string): string {
  const needle = normalize(query.trim());
  if (!needle) return doc.summary;
  if (foldedSpans(doc.summary).folded.includes(needle)) return doc.summary;
  const chars = Array.from(doc.body);
  const { folded, map } = foldedSpans(doc.body);
  const at = folded.indexOf(needle);
  if (at < 0) return doc.summary;
  const startChar = map[at] ?? 0;
  const endChar = (map[at + needle.length - 1] ?? startChar) + 1;
  const from = Math.max(0, startChar - 70);
  const to = Math.min(chars.length, endChar + 70);
  const prefix = from > 0 ? "…" : "";
  const suffix = to < chars.length ? "…" : "";
  return `${prefix}${chars.slice(from, to).join("")}${suffix}`;
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
