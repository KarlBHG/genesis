import { describe, expect, it } from "vitest";

import {
  getAudits,
  getCatalog,
  getChanges,
  getContradictions,
  getEdges,
} from "@/lib/content";
import { csvCell } from "@/lib/export";
import { GOVDIRECTORY_ICELAND } from "@/lib/govdirectory";
import { KENNITALA_RECORDS } from "@/lib/identifiers";
import {
  attachmentDisposition,
  classifyHref,
  isHttpUrl,
} from "@/lib/safe-href";

describe("classifyHref", () => {
  it("keeps catalog paths internal", () => {
    expect(classifyHref("/institutions/althingi")).toEqual({
      kind: "internal",
      href: "/institutions/althingi",
    });
    expect(classifyHref("/map?focus=althingi#pin")).toEqual({
      kind: "internal",
      href: "/map?focus=althingi#pin",
    });
  });

  it("does not treat protocol-relative URLs as internal", () => {
    expect(classifyHref("//evil.example/phish")).toEqual({ kind: "blocked" });
  });

  it("blocks javascript, data, and credentialed URLs", () => {
    expect(classifyHref("javascript:alert(1)")).toEqual({ kind: "blocked" });
    expect(classifyHref("data:text/html,hi")).toEqual({ kind: "blocked" });
    expect(classifyHref("https://user:pass@example.is/")).toEqual({
      kind: "blocked",
    });
  });

  it("keeps http(s) citations as external without rewriting them", () => {
    const source =
      "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/";
    expect(classifyHref(source)).toEqual({ kind: "external", href: source });
    expect(isHttpUrl(source)).toBe(true);
  });

  it("passes wiki unresolved markers through as a bounded slug", () => {
    expect(classifyHref("unresolved:not-a-page")).toEqual({
      kind: "unresolved",
      slug: "not-a-page",
    });
    expect(classifyHref("unresolved:../etc/passwd")).toEqual({
      kind: "blocked",
    });
  });
});

describe("stored citation addresses", () => {
  it("keeps every edge, audit, change, contradiction, website, and kennitala source as http(s)", () => {
    for (const edge of getEdges()) {
      expect(isHttpUrl(edge.source), edge.source).toBe(true);
      if (edge.programSource) {
        expect(isHttpUrl(edge.programSource), edge.programSource).toBe(true);
      }
    }
    for (const audit of getAudits()) {
      expect(isHttpUrl(audit.source), audit.source).toBe(true);
    }
    for (const change of getChanges()) {
      expect(isHttpUrl(change.source), change.source).toBe(true);
    }
    for (const record of getContradictions()) {
      for (const side of record.sides) {
        expect(isHttpUrl(side.source), side.source).toBe(true);
      }
    }
    for (const entry of getCatalog()) {
      if ("website" in entry && entry.website) {
        expect(isHttpUrl(entry.website), entry.website).toBe(true);
      }
      if (entry.kind === "treaty") {
        expect(isHttpUrl(entry.source), entry.source).toBe(true);
      }
    }
    for (const row of KENNITALA_RECORDS) {
      expect(isHttpUrl(row.source), row.source).toBe(true);
    }
    expect(isHttpUrl(GOVDIRECTORY_ICELAND.source)).toBe(true);
    expect(isHttpUrl(GOVDIRECTORY_ICELAND.wikidataProject)).toBe(true);
  });
});

describe("CSV export", () => {
  it("quotes formula-like cells so a spreadsheet does not execute them", () => {
    expect(csvCell("=cmd|' /C calc'!A0")).toBe(`"'=cmd|' /C calc'!A0"`);
    expect(csvCell("-227728")).toBe(`"'-227728"`);
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('say "hello"')).toBe(`"say ""hello"""`);
  });
});

describe("attachmentDisposition", () => {
  it("strips header-breaking characters from the filename", () => {
    expect(attachmentDisposition('foo";\r\nfilename=evil', "json")).toBe(
      'attachment; filename="foofilename=evil.json"',
    );
    expect(attachmentDisposition("landsvirkjun", "json")).toBe(
      'attachment; filename="landsvirkjun.json"',
    );
  });
});
