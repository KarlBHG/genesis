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
  | "tariff-terms";

export type Connection = {
  to: string;
  relationship: Relationship;
  source: string;
  note: string;
  asOf: string;
};

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
  connections: Connection[];
  source: string;
  body: string;
  sources: string;
  summary: string;
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
  connections: Connection[];
  website: string;
  body: string;
  sources: string;
  summary: string;
};

export type MapEvent = {
  kind: "event";
  title: string;
  slug: string;
  date: string;
  type: string;
  related: string[];
  connections: Connection[];
  body: string;
  sources: string;
  summary: string;
};

export type Sector = {
  kind: "sector";
  title: string;
  slug: string;
  area: string;
  related: string[];
  connections: Connection[];
  body: string;
  sources: string;
  summary: string;
};

export type Flow = {
  kind: "flow";
  title: string;
  slug: string;
  year: string;
  related: string[];
  connections: Connection[];
  body: string;
  sources: string;
  summary: string;
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
  connections: Connection[];
  body: string;
  sources: string;
  summary: string;
};

export type Entry = Treaty | Institution | MapEvent | Sector | Flow | Player;

export type SearchDoc = {
  title: string;
  slug: string;
  kind: Kind;
  href: string;
  summary: string;
  topics: string[];
  body: string;
};

export type Edge = {
  from: string;
  fromTitle: string;
  to: string;
  toTitle: string;
  relationship: Relationship;
  source: string;
  note: string;
  asOf: string;
};
