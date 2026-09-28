import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  buildContentIndex,
  getCatalog,
  getEdges,
  getOffices,
  readCatalogFromSource,
  sourceDigest,
  toSearchDocs,
} from "@/lib/content";

const INDEX_FILE = path.join(process.cwd(), "data", "generated", "content-index.json");

describe("build-time content index", () => {
  it("hashes the sources the same way twice", () => {
    expect(sourceDigest()).toBe(sourceDigest());
  });

  it("serves exactly what a validating source read produces", () => {
    const fromIndex = buildContentIndex().snapshot;
    const fromSource = readCatalogFromSource();
    expect(JSON.parse(JSON.stringify(fromIndex))).toEqual(
      JSON.parse(JSON.stringify(fromSource)),
    );
  });

  it("records the digest of the sources it was built from", () => {
    const { digest } = buildContentIndex();
    const stored = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8")) as {
      digest: string;
    };
    expect(stored.digest).toBe(digest);
    expect(digest).toBe(sourceDigest());
  });

  it("reaches the catalog through the public readers", () => {
    expect(getCatalog().length).toBeGreaterThan(0);
    expect(getEdges().length).toBeGreaterThan(0);
    expect(getOffices().length).toBeGreaterThan(0);
  });
});

describe("search documents", () => {
  it("keeps edge quotations off entry bodies", () => {
    const docs = toSearchDocs(getCatalog());
    const edge = getEdges().find((row) => row.quotation.length > 60);
    expect(edge).toBeDefined();
    const entryDoc = docs.find((doc) => doc.slug === edge!.from);
    expect(entryDoc).toBeDefined();
    const needle = edge!.quotation.slice(20, 60);
    expect(entryDoc!.body).not.toContain(needle);
  });

  it("still finds that quotation through its edge document", () => {
    const docs = toSearchDocs(getCatalog());
    const edge = getEdges().find((row) => row.quotation.length > 60);
    const hit = docs.find(
      (doc) => doc.kind === "edge" && doc.body.includes(edge!.quotation.slice(20, 60)),
    );
    expect(hit).toBeDefined();
  });

  it("names the counterpart of every edge in the entry body", () => {
    const docs = toSearchDocs(getCatalog());
    const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
    const edge = getEdges()[0]!;
    expect(bySlug.get(edge.from)?.body).toContain(edge.toTitle);
  });

  it("gives every document a unique slug", () => {
    const docs = toSearchDocs(getCatalog());
    expect(new Set(docs.map((doc) => doc.slug)).size).toBe(docs.length);
  });
});
