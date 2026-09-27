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
  crisis: "Crisis",
  program: "Program",
};

export function labelize(value: string): string {
  if (!value.trim()) return "Not stated";
  return LABELS[value] ?? value;
}

export function kindLabel(kind: "treaty" | "institution" | "event"): string {
  if (kind === "treaty") return "Treaties";
  if (kind === "institution") return "Institutions";
  return "Events";
}

export function kindPath(kind: "treaty" | "institution" | "event"): string {
  if (kind === "treaty") return "/treaties";
  if (kind === "institution") return "/institutions";
  return "/events";
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
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "Undated";
}
