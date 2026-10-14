import { compareAsOf } from "@/lib/as-of";
import {
  getCatalog,
  getEdges,
  hrefFor,
  resolveSlug,
} from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import { paysEdgesForProgram } from "@/lib/invoice-budget";
import {
  PUBLIC_ENTITY_INVENTORY,
} from "@/lib/public-entities";
import type { Edge, Entry, Relationship } from "@/lib/types";

export const NO_SOURCED_LINE = "no sourced line";

export const BUDGET_LAW_SLUG = "treasury-budget-2026";
export const ELECTION_SLUG = "2024-parliamentary-election";
export const ALTHINGI_SLUG = "althingi";
export const DEFAULT_PROGRAM_SLUG = "policy-area-23-sjukrahusthjonusta";

export const STANDING_QUESTION_IDS = [
  "taxpayer",
  "depositor",
  "voter",
] as const;

export type StandingQuestionId = (typeof STANDING_QUESTION_IDS)[number];

export type StandingOption = {
  slug: string;
  title: string;
  href: string | null;
};

export type StandingSourcedHop = {
  status: "sourced";
  from: string;
  fromTitle: string;
  fromHref: string | null;
  relationship: Relationship;
  to: string;
  toTitle: string;
  toHref: string | null;
  asOf: string;
  href: string;
};

export type StandingEmptyHop = {
  status: "empty";
  want: string;
};

export type StandingHop = StandingSourcedHop | StandingEmptyHop;

export type StandingQuestionView = {
  id: StandingQuestionId;
  title: string;
  blurb: string;
  hops: StandingHop[];
};

export type StandingBoard = {
  municipalities: StandingOption[];
  programs: StandingOption[];
  defaultProgramSlug: string;
};

function endpointOf(slug: string): { title: string; href: string | null } {
  const resolved = resolveSlug(slug);
  if (resolved) return resolved;
  return { title: slug, href: null };
}

function toHop(edge: Edge): StandingSourcedHop {
  const from = endpointOf(edge.from);
  const to = endpointOf(edge.to);
  return {
    status: "sourced",
    from: edge.from,
    fromTitle: from.title,
    fromHref: from.href,
    relationship: edge.relationship,
    to: edge.to,
    toTitle: to.title,
    toHref: to.href,
    asOf: edge.asOf,
    href: edgeHref(edge),
  };
}

function emptyHop(want: string): StandingEmptyHop {
  return { status: "empty", want };
}

function findEdge(
  edges: readonly Edge[],
  from: string,
  relationship: Relationship,
  to: string,
): Edge | undefined {
  return edges.find(
    (edge) =>
      edge.from === from &&
      edge.relationship === relationship &&
      edge.to === to,
  );
}

function sortEdges(edges: readonly Edge[]): Edge[] {
  return [...edges].sort(
    (a, b) =>
      compareAsOf(b.asOf, a.asOf) ||
      a.fromTitle.localeCompare(b.fromTitle, "en") ||
      a.toTitle.localeCompare(b.toTitle, "en") ||
      a.quotation.localeCompare(b.quotation, "en"),
  );
}

function article4Funds(
  edges: readonly Edge[],
  programSlug: string,
): Edge[] {
  return sortEdges(
    edges.filter(
      (edge) =>
        edge.from === BUDGET_LAW_SLUG &&
        edge.relationship === "funds" &&
        edge.to === programSlug,
    ),
  );
}

function looksLikeBank(entry: Entry): boolean {
  const role = "role" in entry ? entry.role : "";
  const hay = `${entry.slug} ${entry.title} ${role}`.toLowerCase();
  return /banki|bankinn|central bank/.test(hay);
}

function bankSlugs(catalog: readonly Entry[]): Set<string> {
  return new Set(catalog.filter(looksLikeBank).map((entry) => entry.slug));
}

function ownedBanks(
  edges: readonly Edge[],
  catalog: readonly Entry[],
): Edge[] {
  const banks = bankSlugs(catalog);
  return sortEdges(
    edges.filter(
      (edge) => edge.relationship === "owns" && banks.has(edge.to),
    ),
  );
}

function memberElects(
  edges: readonly Edge[],
  municipalitySlug: string,
): Edge[] {
  return sortEdges(
    edges.filter(
      (edge) =>
        edge.relationship === "elects" && edge.from === municipalitySlug,
    ),
  );
}

function municipalityOwnsBank(
  edges: readonly Edge[],
  catalog: readonly Entry[],
  municipalitySlug: string,
): Edge[] {
  const banks = bankSlugs(catalog);
  return sortEdges(
    edges.filter(
      (edge) =>
        edge.relationship === "owns" &&
        edge.from === municipalitySlug &&
        banks.has(edge.to),
    ),
  );
}

export function standingMunicipalities(
  catalog: readonly Entry[] = getCatalog(),
): StandingOption[] {
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  return PUBLIC_ENTITY_INVENTORY.filter(
    (row) => row.category === "municipalities",
  )
    .flatMap((row) => {
      const entry = bySlug.get(row.slug);
      if (!entry) return [];
      return [
        {
          slug: entry.slug,
          title: entry.title,
          href: hrefFor(entry),
        } satisfies StandingOption,
      ];
    })
    .sort((a, b) => a.title.localeCompare(b.title, "is"));
}

export function standingPrograms(
  catalog: readonly Entry[] = getCatalog(),
): StandingOption[] {
  return catalog
    .filter((entry) => entry.kind === "flow" && entry.slug.startsWith("policy-area-"))
    .map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      href: hrefFor(entry),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, "en"));
}

export function walkTaxpayer(
  programSlug: string,
  edges: readonly Edge[] = getEdges(),
): StandingHop[] {
  const hops: StandingHop[] = [];
  const law = findEdge(edges, ALTHINGI_SLUG, "funds", BUDGET_LAW_SLUG);
  hops.push(
    law
      ? toHop(law)
      : emptyHop("Alþingi funds the 2026 budget"),
  );

  const funds = article4Funds(edges, programSlug);
  if (funds.length === 0) {
    hops.push(emptyHop("the 2026 budget funds this policy area"));
  } else {
    hops.push(...funds.map(toHop));
  }

  const invoices = paysEdgesForProgram(programSlug, [...edges]);
  if (invoices.length === 0) {
    hops.push(emptyHop("an invoice joined to this policy area"));
  } else {
    hops.push(...invoices.map(toHop));
  }
  return hops;
}

export function walkDepositor(
  municipalitySlug: string | null,
  edges: readonly Edge[] = getEdges(),
  catalog: readonly Entry[] = getCatalog(),
): StandingHop[] {
  const hops: StandingHop[] = [];
  const banks = ownedBanks(edges, catalog);
  if (banks.length === 0) {
    hops.push(emptyHop("the state owns a bank"));
  } else {
    hops.push(...banks.map(toHop));
  }

  const place = municipalitySlug
    ? endpointOf(municipalitySlug).title
    : "this municipality";
  const local = municipalitySlug
    ? municipalityOwnsBank(edges, catalog, municipalitySlug)
    : [];
  if (local.length === 0) {
    hops.push(emptyHop(`${place} owns a deposit bank`));
  } else {
    hops.push(...local.map(toHop));
  }
  return hops;
}

export function walkVoter(
  municipalitySlug: string | null,
  edges: readonly Edge[] = getEdges(),
): StandingHop[] {
  const hops: StandingHop[] = [];
  const election = findEdge(edges, ELECTION_SLUG, "elects", ALTHINGI_SLUG);
  hops.push(
    election
      ? toHop(election)
      : emptyHop("the 30 November 2024 election elects Alþingi"),
  );

  const place = municipalitySlug
    ? endpointOf(municipalitySlug).title
    : "this municipality";
  const members = municipalitySlug ? memberElects(edges, municipalitySlug) : [];
  if (members.length === 0) {
    hops.push(emptyHop(`${place} elects a member of Alþingi`));
  } else {
    hops.push(...members.map(toHop));
  }
  return hops;
}

export function taxpayerQuestion(
  programSlug: string,
  edges: readonly Edge[] = getEdges(),
): StandingQuestionView {
  return {
    id: "taxpayer",
    title: "As a taxpayer",
    blurb:
      "Alþingi passes the budget as law. Article 4 authorises a policy area. An invoice hop is only a stored pays row joined to that area — never a summed total.",
    hops: walkTaxpayer(programSlug, edges),
  };
}

export function depositorQuestion(
  municipalitySlug: string | null,
  edges: readonly Edge[] = getEdges(),
  catalog: readonly Entry[] = getCatalog(),
): StandingQuestionView {
  return {
    id: "depositor",
    title: "As a depositor in a state-owned bank",
    blurb:
      "Ownership is a dated sentence, not a guess at which bank you use. Only sourced owns lines to a bank are walked. A municipality is not a branch finder.",
    hops: walkDepositor(municipalitySlug, edges, catalog),
  };
}

export function voterQuestion(
  municipalitySlug: string | null,
  edges: readonly Edge[] = getEdges(),
): StandingQuestionView {
  return {
    id: "voter",
    title: "As a voter after 30 Nov 2024",
    blurb:
      "The stored elects line is the 2024 general election to Alþingi. A municipality is a catalog pick, not a postcode, and it does not invent a constituency membership.",
    hops: walkVoter(municipalitySlug, edges),
  };
}

export function standingQuestions(
  programSlug: string,
  municipalitySlug: string | null,
  edges: readonly Edge[] = getEdges(),
  catalog: readonly Entry[] = getCatalog(),
): StandingQuestionView[] {
  return [
    taxpayerQuestion(programSlug, edges),
    depositorQuestion(municipalitySlug, edges, catalog),
    voterQuestion(municipalitySlug, edges),
  ];
}

export function buildStandingBoard(
  catalog: readonly Entry[] = getCatalog(),
): StandingBoard {
  const programs = standingPrograms(catalog);
  const defaultProgram =
    programs.find((item) => item.slug === DEFAULT_PROGRAM_SLUG)?.slug ??
    programs[0]?.slug ??
    DEFAULT_PROGRAM_SLUG;
  return {
    municipalities: standingMunicipalities(catalog),
    programs,
    defaultProgramSlug: defaultProgram,
  };
}

export function invoiceRowCaption(count: number): string {
  const noun = count === 1 ? "row" : "rows";
  return `${count} sourced invoice ${noun}. Counts are rows, not krónur.`;
}

export function article4Caption(count: number): string {
  const noun = count === 1 ? "row" : "rows";
  return `${count} Article 4 ${noun}. Amounts are not added together.`;
}

export function isValidMunicipality(
  slug: string | null | undefined,
  municipalities: readonly StandingOption[],
): slug is string {
  if (!slug) return false;
  return municipalities.some((item) => item.slug === slug);
}

export function standingFolioHref(
  programSlug: string,
  municipalitySlug: string | null,
  hash?: StandingQuestionId,
): string {
  const params = new URLSearchParams();
  params.set("program", programSlug);
  if (municipalitySlug) params.set("municipality", municipalitySlug);
  const path = `/standing?${params.toString()}`;
  return hash ? `${path}#${hash}` : path;
}

export function isValidProgram(
  slug: string | null | undefined,
  programs: readonly StandingOption[],
): slug is string {
  if (!slug) return false;
  return programs.some((item) => item.slug === slug);
}

export function sourcedHops(hops: readonly StandingHop[]): StandingSourcedHop[] {
  return hops.filter(
    (hop): hop is StandingSourcedHop => hop.status === "sourced",
  );
}

export function emptyHops(hops: readonly StandingHop[]): StandingEmptyHop[] {
  return hops.filter((hop): hop is StandingEmptyHop => hop.status === "empty");
}
