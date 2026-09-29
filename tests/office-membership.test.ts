import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { NAV, navLeafCount } from "@/components/site-header";
import { getEdges, getOfficeById, getOffices } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import {
  HOLDER_MISMATCH_LABEL,
  NOT_PRINTED,
  displayCareerDate,
  getOfficeMembershipViews,
  holderMismatchRows,
  isCurrentMembership,
  isUnprinted,
  officeMembershipView,
} from "@/lib/office-membership";

const ROOT = process.cwd();

describe("office membership", () => {
  it("keeps offices off the primary nav", () => {
    expect(navLeafCount()).toBeLessThanOrEqual(10);
    const hrefs = NAV.flatMap((entry) =>
      "href" in entry ? [entry.href] : entry.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/offices");
  });

  it("treats not-printed end plus cited as-of as current, and never copies start from as-of", () => {
    expect(isUnprinted("not printed")).toBe(true);
    expect(isUnprinted("")).toBe(true);
    expect(isUnprinted(null)).toBe(true);
    expect(isUnprinted("2024")).toBe(false);
    expect(
      isCurrentMembership({ end: "not printed", asOf: "2024-12-21" }),
    ).toBe(true);
    expect(isCurrentMembership({ end: "2024", asOf: "2018-2024" })).toBe(false);
    expect(isCurrentMembership({ end: "not printed", asOf: "" })).toBe(false);
    expect(displayCareerDate("not printed")).toBe(NOT_PRINTED);
    expect(displayCareerDate("2024-12-21")).toBe("2024-12-21");

    const landsvirkjun = officeMembershipView(getOfficeById("ceo-of-landsvirkjun")!);
    expect(landsvirkjun.vacant).toBe(false);
    expect(landsvirkjun.current).toHaveLength(1);
    expect(landsvirkjun.current[0]?.personSlug).toBe("hordur-arnarson");
    expect(displayCareerDate(landsvirkjun.current[0]?.start)).toBe(NOT_PRINTED);
    expect(landsvirkjun.current[0]?.start).not.toBe(landsvirkjun.office.asOf);
    expect(landsvirkjun.boardSeats.some((row) => row.personSlug === "brynja-baldursdottir")).toBe(
      true,
    );
  });

  it("keeps the Prime Minister post and lists Kristrún as current membership", () => {
    const view = officeMembershipView(getOfficeById("prime-minister")!);
    expect(view.vacant).toBe(false);
    expect(view.mismatch).toBeNull();
    expect(view.organizationTitle).toMatch(/Prime Minister/i);
    expect(view.current.map((row) => row.personSlug)).toEqual([
      "kristrun-frostadottir",
    ]);
    expect(view.current[0]?.href).toBe(edgeHref(view.current[0]!.edge));
    expect(view.current[0]?.href).toMatch(/^\/connections\//);
    expect(displayCareerDate(view.current[0]?.end)).toBe(NOT_PRINTED);
  });

  it("lists ended memberships on a post that still has a current row", () => {
    const view = officeMembershipView(
      getOfficeById("minister-of-social-affairs-and-housing")!,
    );
    expect(view.vacant).toBe(false);
    expect(view.current.map((row) => row.personSlug)).toEqual([
      "ragnar-thor-ingolfsson",
    ]);
    expect(
      view.memberships.some(
        (row) => row.personSlug === "inga-saeland" && !row.current,
      ),
    ).toBe(true);
    expect(view.mismatch).toBeNull();
  });

  it("labels vacant posts and does not fill them from the holder field", () => {
    const director = officeMembershipView(getOfficeById("director-of-health")!);
    expect(director.vacant).toBe(true);
    expect(director.current).toHaveLength(0);
    expect(director.office.holder).toBe("alma-d-moller");
    expect(director.memberships).toHaveLength(1);
    expect(director.memberships[0]?.end).toBe("2024");
    expect(director.mismatch?.label).toBe(HOLDER_MISMATCH_LABEL);
    expect(director.mismatch?.kind).toBe("vacant-holder-named");
  });

  it("lists holder-field mismatches as a checklist, not a rewritten succession", () => {
    const mismatches = holderMismatchRows();
    const ids = mismatches.map((row) => row.officeId).sort();
    expect(ids).toEqual([
      "alternate-mp-dadi",
      "chair-peoples-party-parliamentary-group",
      "chair-samfylkingin-parliamentary-group",
      "chair-vidreisn-parliamentary-group",
      "director-of-health",
      "minister-of-transport-and-local-government",
    ]);
    expect(mismatches.every((row) => row.label === HOLDER_MISMATCH_LABEL)).toBe(
      true,
    );
    expect(getOfficeMembershipViews()).toHaveLength(getOffices().length);
    expect(
      getOfficeMembershipViews().filter((view) => view.vacant).map((view) => view.office.id).sort(),
    ).toEqual(ids);
  });

  it("does not invent a missing holds-office from offices.json", () => {
    const edges = getEdges();
    for (const office of getOffices()) {
      const view = officeMembershipView(office, edges);
      for (const row of view.memberships) {
        expect(row.edge.relationship).toBe("holds-office");
        expect(row.edge.to).toBe(office.id);
        expect(row.start).toBe(row.edge.start);
        if (isUnprinted(row.start)) {
          expect(row.start).not.toBe(row.asOf);
          expect(displayCareerDate(row.start)).toBe(NOT_PRINTED);
        }
      }
    }
    const transport = officeMembershipView(
      getOfficeById("minister-of-transport-and-local-government")!,
    );
    expect(transport.current).toHaveLength(0);
    expect(transport.memberships[0]?.end).toBe("2025-03-15");
  });

  it("does not scrape, fetch, or call a model from the office modules", () => {
    const files = [
      "lib/office-membership.ts",
      "components/office-membership-table.tsx",
      "components/office-holder-mismatch-checklist.tsx",
      "components/office-posts-index.tsx",
      "app/offices/page.tsx",
      "app/offices/[id]/page.tsx",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\bfetch\s*\(\s*['"`]https?:/);
      expect(source.toLowerCase(), file).not.toMatch(/ollama/);
      expect(source, file).not.toMatch(/\bscrape\w*\s*\(/i);
    }
  });
});
