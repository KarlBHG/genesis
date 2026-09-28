export type Kind =
  | "treaty"
  | "institution"
  | "event"
  | "sector"
  | "flow"
  | "player";

export type Relationship =
  | "owns"
  | "regulates"
  | "appoints"
  | "sells-power-to"
  | "represents"
  | "funds"
  | "export-of"
  | "import-line-of"
  | "tariff-terms"
  | "invests-in"
  | "holds-office"
  | "sits-on-board"
  | "pays"
  | "elects"
  | "imported-from"
  | "exported-to"
  | "incorporates";

export type Treaty = {
  kind: "treaty";
  title: string;
  slug: string;
  type: string;
  signed: string;
  effective: string;
  parties: string[];
  status: string;
  topics: string[];
  related: string[];
  source: string;
  body: string;
  sources: string;
  summary: string;
  lede: string;
};

export type Institution = {
  kind: "institution";
  title: string;
  slug: string;
  type: string;
  founded: string;
  role: string;
  parent: string;
  related: string[];
  website: string;
  body: string;
  sources: string;
  summary: string;
  lede: string;
};

export type MapEvent = {
  kind: "event";
  title: string;
  slug: string;
  date: string;
  type: string;
  related: string[];
  body: string;
  sources: string;
  summary: string;
  lede: string;
};

export type Sector = {
  kind: "sector";
  title: string;
  slug: string;
  area: string;
  related: string[];
  body: string;
  sources: string;
  summary: string;
  lede: string;
};

export type Flow = {
  kind: "flow";
  title: string;
  slug: string;
  year: string;
  related: string[];
  body: string;
  sources: string;
  summary: string;
  lede: string;
};

export type Player = {
  kind: "player";
  title: string;
  slug: string;
  playerType: "organization" | "person";
  role: string;
  asOf: string;
  website: string;
  related: string[];
  body: string;
  sources: string;
  summary: string;
  lede: string;
};

export type Entry = Treaty | Institution | MapEvent | Sector | Flow | Player;

export type SearchKind = Kind | "edge";

export type SearchDoc = {
  title: string;
  slug: string;
  kind: SearchKind;
  href: string;
  summary: string;
  topics: string[];
  body: string;
};

export type CareerChannel = "political" | "business";

/** Currency unit exactly as the cited page abbreviates it. */
export type MoneyUnit = "ISK" | "mkr" | "makr" | "USD";

/** What kind of document the figure was printed in. */
export type MoneyBasis =
  | "authorisation"
  | "invoice"
  | "statement"
  | "trade-release";

/**
 * A figure lifted verbatim off a cited page. `value` is the number as printed,
 * never the result of arithmetic: nothing in this repo converts units, nets a
 * credit note, or adds two amounts together.
 */
export type EdgeAmount = {
  value: number;
  unit: MoneyUnit;
  basis: MoneyBasis;
  /** The sentence or ledger row the number came from. */
  quotation: string;
};

export type Edge = {
  from: string;
  fromTitle: string;
  to: string;
  toTitle: string;
  relationship: Relationship;
  source: string;
  quotation: string;
  asOf: string;
  start: string | null;
  end: string | null;
  channel: CareerChannel | null;
  organization: string | null;
  organizationTitle: string | null;
  /** Fiscal year for Opnir reikningar `pays` rows when tagged. */
  year: string | null;
  /** Policy-area flow slug when the buyer ledger prints a program heading. */
  program: string | null;
  programTitle: string | null;
  /** When `program` is null on a tagged invoice, why the ledger did not join. */
  programNullReason: string | null;
  programSource: string | null;
  programQuotation: string | null;
  /** Present only when the cited page prints the figure. */
  amount?: EdgeAmount;
};

export type ChangeRecord = {
  id: string;
  edgeId: string;
  field: string;
  oldValue: string;
  newValue: string;
  observed: string;
  source: string;
};

export type AuditFinding = {
  id: string;
  entries: string[];
  published: string;
  source: string;
  quotation: string;
};

export type ContradictionSide = {
  source: string;
  quotation: string;
};

export type OfficeRecord = {
  id: string;
  title: string;
  holder: string;
  organization: string;
  asOf: string;
};

export type Contradiction = {
  id: string;
  entries: string[];
  summary: string;
  sides: [ContradictionSide, ContradictionSide];
};
