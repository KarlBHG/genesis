import { compareAsOf } from "@/lib/as-of";
import { getEdges, getOffices, resolveSlug } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import { dateSortKey } from "@/lib/format";
import type { Edge, OfficeRecord } from "@/lib/types";

/** Career rows store this when the cited page prints no start or end. */
export const NOT_PRINTED = "not printed";

export const HOLDER_MISMATCH_LABEL =
  "holder field vs typed membership: mismatch";

export function isUnprinted(value: string | null | undefined): boolean {
  if (value == null) return true;
  const trimmed = value.trim();
  return trimmed === "" || /^not printed$/i.test(trimmed);
}

export function isCitedAsOf(asOf: string | null | undefined): boolean {
  return Boolean(asOf?.trim());
}

/**
 * Current membership: no end date stored, and a cited as-of.
 * Does not mean the person is still in post when that as-of is old.
 * Start is never copied from as-of.
 */
export function isCurrentMembership(
  edge: Pick<Edge, "end" | "asOf">,
): boolean {
  return isUnprinted(edge.end) && isCitedAsOf(edge.asOf);
}

export function displayCareerDate(value: string | null | undefined): string {
  if (isUnprinted(value)) return NOT_PRINTED;
  return value!.trim();
}

export type MembershipRow = {
  edge: Edge;
  personSlug: string;
  personTitle: string;
  personHref: string | null;
  start: string | null;
  end: string | null;
  asOf: string;
  href: string;
  current: boolean;
};

export type HolderMismatchKind =
  | "no-membership"
  | "vacant-holder-named"
  | "holder-not-in-current"
  | "extra-current";

export type HolderMismatch = {
  officeId: string;
  officeTitle: string;
  officeHref: string;
  holderSlug: string;
  holderTitle: string;
  holderHref: string | null;
  currentPeople: { slug: string; title: string }[];
  kind: HolderMismatchKind;
  label: typeof HOLDER_MISMATCH_LABEL;
  detail: string;
};

export type OfficeMembershipView = {
  office: OfficeRecord;
  organizationTitle: string;
  organizationHref: string | null;
  memberships: MembershipRow[];
  current: MembershipRow[];
  vacant: boolean;
  boardSeats: MembershipRow[];
  mismatch: HolderMismatch | null;
};

function personOf(edge: Edge): { slug: string; title: string } {
  return { slug: edge.from, title: edge.fromTitle };
}

function toMembershipRow(edge: Edge): MembershipRow {
  const person = personOf(edge);
  const resolved = resolveSlug(person.slug);
  return {
    edge,
    personSlug: person.slug,
    personTitle: person.title,
    personHref: resolved?.href ?? null,
    start: edge.start,
    end: edge.end,
    asOf: edge.asOf,
    href: edgeHref(edge),
    current: isCurrentMembership(edge),
  };
}

function careerSortKey(value: string | null | undefined): string {
  if (isUnprinted(value)) return "00000000";
  const trimmed = value!.trim();
  if (/^\d{4}(-\d{2}(-\d{2})?)?/.test(trimmed)) return dateSortKey(trimmed);
  return `1${trimmed.toLowerCase()}`;
}

function compareMembership(a: MembershipRow, b: MembershipRow): number {
  if (a.current !== b.current) return a.current ? -1 : 1;
  const start = careerSortKey(b.start).localeCompare(careerSortKey(a.start));
  if (start) return start;
  const asOf = compareAsOf(b.asOf, a.asOf);
  if (asOf) return asOf;
  return a.personTitle.localeCompare(b.personTitle, "en");
}

function uniquePeople(
  rows: MembershipRow[],
): { slug: string; title: string }[] {
  const seen = new Set<string>();
  const people: { slug: string; title: string }[] = [];
  for (const row of rows) {
    if (seen.has(row.personSlug)) continue;
    seen.add(row.personSlug);
    people.push({ slug: row.personSlug, title: row.personTitle });
  }
  return people;
}

function mismatchFor(
  office: OfficeRecord,
  memberships: MembershipRow[],
  current: MembershipRow[],
): HolderMismatch | null {
  const holder = resolveSlug(office.holder);
  const currentPeople = uniquePeople(current);
  const currentSlugs = new Set(currentPeople.map((person) => person.slug));
  const holderIsCurrent = currentSlugs.has(office.holder);

  let kind: HolderMismatchKind | null = null;
  let detail: string;
  if (memberships.length === 0) {
    kind = "no-membership";
    detail = `No holds-office edge. offices.json names ${holder?.title ?? office.holder}.`;
  } else if (current.length === 0) {
    kind = "vacant-holder-named";
    detail = `Vacant post. offices.json names ${holder?.title ?? office.holder}. No current holds-office membership.`;
  } else if (!holderIsCurrent) {
    kind = "holder-not-in-current";
    const names = currentPeople.map((person) => person.title).join(", ");
    detail = `Current membership is ${names}. offices.json names ${holder?.title ?? office.holder}.`;
  } else if (currentSlugs.size > 1) {
    kind = "extra-current";
    const names = currentPeople.map((person) => person.title).join(", ");
    detail = `Current memberships include ${names}. offices.json names ${holder?.title ?? office.holder}.`;
  } else {
    return null;
  }

  return {
    officeId: office.id,
    officeTitle: office.title,
    officeHref: `/offices/${office.id}`,
    holderSlug: office.holder,
    holderTitle: holder?.title ?? office.holder,
    holderHref: holder?.href ?? null,
    currentPeople,
    kind,
    label: HOLDER_MISMATCH_LABEL,
    detail,
  };
}

export function holdsOfficeFor(
  officeId: string,
  edges: readonly Edge[] = getEdges(),
): Edge[] {
  return edges.filter(
    (edge) => edge.relationship === "holds-office" && edge.to === officeId,
  );
}

export function boardSeatsFor(
  office: Pick<OfficeRecord, "id" | "organization">,
  edges: readonly Edge[] = getEdges(),
): Edge[] {
  return edges.filter(
    (edge) =>
      edge.relationship === "sits-on-board" &&
      (edge.to === office.id || edge.to === office.organization),
  );
}

export function officeMembershipView(
  office: OfficeRecord,
  edges: readonly Edge[] = getEdges(),
): OfficeMembershipView {
  const organization = resolveSlug(office.organization);
  const memberships = holdsOfficeFor(office.id, edges)
    .map(toMembershipRow)
    .sort(compareMembership);
  const current = memberships.filter((row) => row.current);
  const boardSeats = boardSeatsFor(office, edges)
    .map(toMembershipRow)
    .sort(compareMembership);
  return {
    office,
    organizationTitle: organization?.title ?? office.organization,
    organizationHref: organization?.href ?? null,
    memberships,
    current,
    vacant: current.length === 0,
    boardSeats,
    mismatch: mismatchFor(office, memberships, current),
  };
}

export function getOfficeMembershipViews(
  offices: readonly OfficeRecord[] = getOffices(),
  edges: readonly Edge[] = getEdges(),
): OfficeMembershipView[] {
  return offices
    .map((office) => officeMembershipView(office, edges))
    .sort((a, b) => a.office.title.localeCompare(b.office.title, "en"));
}

export function holderMismatchRows(
  views: readonly OfficeMembershipView[] = getOfficeMembershipViews(),
): HolderMismatch[] {
  return views
    .map((view) => view.mismatch)
    .filter((row): row is HolderMismatch => row != null);
}

export function officeMembershipCaption(view: OfficeMembershipView): string {
  const ended = view.memberships.length - view.current.length;
  return (
    `${view.memberships.length} holds-office memberships. ` +
    `${view.current.length} current. ` +
    `${ended} ended. ` +
    `Current means no end date stored and a cited as-of. ` +
    `Ended rows stay listed. Start is never copied from as-of.`
  );
}

export function boardSeatCaption(
  view: OfficeMembershipView,
): string {
  const ended = view.boardSeats.filter((row) => !row.current).length;
  const current = view.boardSeats.length - ended;
  return (
    `${view.boardSeats.length} board seats at ${view.organizationTitle}. ` +
    `${current} with no end date stored. ` +
    `${ended} ended. ` +
    `These are sits-on-board rows, not memberships of this post.`
  );
}

export function holderMismatchCaption(rows: readonly HolderMismatch[]): string {
  return (
    `${rows.length} offices where the holder field does not match typed membership. ` +
    `The Post stays. Vacant stays vacant. ` +
    `Counts are posts, not a succession.`
  );
}

export function officeIndexCaption(views: readonly OfficeMembershipView[]): string {
  const vacant = views.filter((view) => view.vacant).length;
  const mismatches = views.filter((view) => view.mismatch).length;
  const current = views.length - vacant;
  return (
    `${views.length} posts. ` +
    `${current} have a current membership. ` +
    `${vacant} vacant. ` +
    `${mismatches} holder-field mismatches. ` +
    `A vacant post is not filled from offices.json.`
  );
}
