const LABELS: Record<string, string> = {
  "single-market": "Single market",
  "monetary-policy": "Monetary policy",
  "fiscal-policy": "Fiscal policy",
  "treaty-entry": "Treaty entry",
  legislature: "Legislature",
  supervision: "Supervision",
  security: "Security",
  trade: "Trade",
  regulation: "Regulation",
  borders: "Borders",
  movement: "Movement",
  active: "Active",
  independent: "Independent",
  none: "None",
  treaty: "Treaty",
  institution: "Institution",
  event: "Event",
  sector: "Sector",
  flow: "Money flow",
  player: "Player",
  organization: "Organization",
  person: "Person",
  owns: "Owns",
  regulates: "Regulates",
  appoints: "Appoints",
  "sells-power-to": "Sells power to",
  represents: "Represents",
  funds: "Funds",
  "export-of": "Export line of",
  "import-line-of": "Import line for",
  "tariff-terms": "Tariff terms for",
  "invests-in": "Invests in",
  fisheries: "Fisheries",
  energy: "Energy",
  tourism: "Tourism",
  banking: "Banking",
  agriculture: "Agriculture",
  healthcare: "Healthcare",
  telecoms: "Telecoms",
  retail: "Retail",
  "construction-and-housing": "Construction and housing",
  crisis: "Crisis",
  founding: "Founding",
  referendum: "Referendum",
  judgment: "Judgment",
  election: "Election",
  agreement: "Agreement",
  program: "Program",
  edge: "Connection",
};

export function labelize(value: string): string {
  if (!value.trim()) return "Not stated";
  return LABELS[value] ?? value;
}

const KIND_LABELS = {
  treaty: "Treaties",
  institution: "Institutions",
  event: "Events",
  sector: "Business",
  flow: "Money",
  player: "Players",
} as const;

const KIND_PATHS = {
  treaty: "/treaties",
  institution: "/institutions",
  event: "/events",
  sector: "/business",
  flow: "/money",
  player: "/players",
} as const;

export function kindLabel(kind: keyof typeof KIND_LABELS): string {
  return KIND_LABELS[kind];
}

export function kindPath(kind: keyof typeof KIND_PATHS): string {
  return KIND_PATHS[kind];
}

export function formatDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}-01T00:00:00Z`));
  }
  if (/^\d{4}$/.test(value)) return value;
  if (!value.trim()) return "Not stated";
  return value;
}

export function dateSortKey(value: string): string {
  const [year = "0000", month = "00", day = "00"] = value.split("-");
  return `${year.padStart(4, "0")}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
}

export function yearOf(value: string): string {
  const year = value.split("-")[0] ?? "";
  return /^\d{3,4}$/.test(year) ? year : "Undated";
}
