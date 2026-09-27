export type Kind = "treaty" | "institution" | "event";

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
};

export type Entry = Treaty | Institution | MapEvent;

export type SearchDoc = {
  title: string;
  slug: string;
  kind: Kind;
  href: string;
  summary: string;
  topics: string[];
  body: string;
};
