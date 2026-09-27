import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";

import { kindPath } from "@/lib/format";
import type {
  Entry,
  Institution,
  Kind,
  MapEvent,
  SearchDoc,
  Treaty,
} from "@/lib/types";

const ROOT = path.join(process.cwd(), "content");

const FOLDERS: { folder: string; kind: Kind }[] = [
  { folder: "treaties", kind: "treaty" },
  { folder: "institutions", kind: "institution" },
  { folder: "events", kind: "event" },
];

function requireString(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${file} is missing frontmatter "${key}"`);
  }
  return value.trim();
}

function optionalString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new Error(`Frontmatter "${key}" must be a string`);
  }
  return value.trim();
}

function stringArray(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string[] {
  const value = data[key];
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${file} frontmatter "${key}" must be a list of strings`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function stripTitle(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, "").trim();
}

function splitSources(markdown: string): { body: string; sources: string } {
  const match = markdown.match(/\n(?:## Sources|\*\*Sources:\*\*)\s*\n/);
  if (!match || match.index == null) {
    return { body: markdown.trim(), sources: "" };
  }
  return {
    body: markdown.slice(0, match.index).trim(),
    sources: markdown.slice(match.index + match[0].length).trim(),
  };
}

function summaryFrom(body: string): string {
  const marked = body.match(/## Summary\s+([\s\S]*?)(?=\n## |\s*$)/);
  const source = (marked?.[1] ?? body).replace(/^#{1,6}\s+.+$/gm, "").trim();
  const paragraph = source
    .split(/\n\n+/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("-") && !part.startsWith("*"));
  return (paragraph ?? "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function plainBody(markdown: string): string {
  return markdown
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readEntry(filePath: string, kind: Kind): Entry {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const file = path.relative(ROOT, filePath);
  const slug = requireString(data, "slug", file);
  const filename = path.basename(filePath, ".md");
  if (slug !== filename) {
    throw new Error(`${file} slug "${slug}" does not match the filename`);
  }

  const split = splitSources(stripTitle(parsed.content.trim()));
  const summary = summaryFrom(split.body);
  const title = requireString(data, "title", file);
  const related = stringArray(data, "related", file);

  if (kind === "treaty") {
    const treaty: Treaty = {
      kind,
      title,
      slug,
      type: requireString(data, "type", file),
      signed: requireString(data, "signed", file),
      effective: optionalString(data, "effective"),
      parties: stringArray(data, "parties", file),
      status: requireString(data, "status", file),
      topics: stringArray(data, "topics", file),
      related,
      source: requireString(data, "source", file),
      body: split.body,
      sources: split.sources,
      summary,
    };
    return treaty;
  }

  if (kind === "institution") {
    const institution: Institution = {
      kind,
      title,
      slug,
      type: requireString(data, "type", file),
      founded: optionalString(data, "founded"),
      role: requireString(data, "role", file),
      parent: optionalString(data, "parent"),
      related,
      website: optionalString(data, "website"),
      body: split.body,
      sources: split.sources,
      summary,
    };
    return institution;
  }

  const event: MapEvent = {
    kind,
    title,
    slug,
    date: requireString(data, "date", file),
    type: requireString(data, "type", file),
    related,
    body: split.body,
    sources: split.sources,
    summary,
  };
  return event;
}

export const getCatalog = cache((): Entry[] => {
  const entries: Entry[] = [];
  for (const { folder, kind } of FOLDERS) {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      entries.push(readEntry(path.join(dir, name), kind));
    }
  }
  return entries;
});

export function getBySlug(slug: string): Entry | undefined {
  return getCatalog().find((entry) => entry.slug === slug);
}

export function getTreaties(): Treaty[] {
  return getCatalog().filter((entry): entry is Treaty => entry.kind === "treaty");
}

export function getInstitutions(): Institution[] {
  return getCatalog().filter(
    (entry): entry is Institution => entry.kind === "institution",
  );
}

export function getEvents(): MapEvent[] {
  return getCatalog().filter((entry): entry is MapEvent => entry.kind === "event");
}

export function hrefFor(entry: Entry): string {
  return `${kindPath(entry.kind)}/${entry.slug}`;
}

export function resolveSlug(slug: string): { title: string; href: string } | null {
  const entry = getBySlug(slug);
  if (!entry) return null;
  return { title: entry.title, href: hrefFor(entry) };
}

export function toSearchDocs(entries: Entry[] = getCatalog()): SearchDoc[] {
  return entries.map((entry) => ({
    title: entry.title,
    slug: entry.slug,
    kind: entry.kind,
    href: hrefFor(entry),
    summary: entry.summary,
    topics:
      entry.kind === "treaty"
        ? entry.topics
        : entry.kind === "institution"
          ? [entry.role]
          : [entry.type],
    body: plainBody(`${entry.body}\n${entry.sources}`),
  }));
}
