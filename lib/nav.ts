/**
 * Primary masthead leaves. Folio numbers on screen and on paper share this
 * list so a printed plate can say `02` and mean the same Map as the index.
 */

export type NavLink = { href: string; label: string };
export type NavEntry = NavLink | { label: string; items: NavLink[] };

export type IndexedLink = NavLink & { index: number };
export type IndexedEntry =
  | (NavLink & { index: number })
  | { label: string; index: number; items: IndexedLink[] };

/** Nav leaf destinations (dropdown items count individually). Keep ≤10. */
export const NAV: NavEntry[] = [
  { href: "/system", label: "System" },
  { href: "/map", label: "Map" },
  { href: "/institutions", label: "Institutions" },
  { href: "/money", label: "Budget" },
  { href: "/players", label: "People" },
  {
    label: "Treaties & events",
    items: [
      { href: "/treaties", label: "Treaties" },
      { href: "/events", label: "Events" },
    ],
  },
  { href: "/business", label: "Business" },
  { href: "/connections", label: "Connections" },
  { href: "/anomalies", label: "Evidence" },
];

/**
 * First sentence already printed on each plate. Home contents and the ⌘K
 * index quote these; they are not a second marketing line.
 */
export const PLATE_STANDFIRSTS: Record<string, string> = {
  "/system":
    "How the Icelandic state, the central bank, trade, and outside arrangements are recorded.",
  "/map": "Iceland at night, only where a sourced page names the place.",
  "/institutions": "Public bodies, grouped by role.",
  "/money": "Authorisations, invoices, and contracts are different fiscal phases.",
  "/players":
    "Organizations, and people only where a public page names them in office.",
  "/treaties": "Agreements Iceland is party to.",
  "/events":
    "A full date is shown when the source gave one; otherwise the year.",
  "/business": "How the main sectors are structured.",
  "/connections": "The same buckets as the map.",
  "/anomalies":
    "Public records that disagree, change, repeat, or come from Ríkisendurskoðun.",
};

/**
 * Rooms the folio keeps off the thumb index. Not an eleventh nav leaf.
 * Labels match the footer and the standing / intake doors already in copy.
 */
export const OFF_INDEX: NavLink[] = [
  { href: "/standing", label: "Standing" },
  { href: "/obligations", label: "Obligations" },
  { href: "/methodology", label: "Methodology" },
  { href: "/offices", label: "Offices" },
  { href: "/intake", label: "Paste a line" },
  { href: "/intake/opnir", label: "Review Opnir rows" },
];

export function navLeafCount(entries: NavEntry[] = NAV): number {
  return entries.reduce(
    (count, entry) => count + ("href" in entry ? 1 : entry.items.length),
    0,
  );
}

export function padFolio(n: number): string {
  return String(n).padStart(2, "0");
}

export function withNavIndex(entries: NavEntry[] = NAV): IndexedEntry[] {
  let n = 1;
  return entries.map((entry) => {
    if ("href" in entry) {
      return { ...entry, index: n++ };
    }
    const items = entry.items.map((item) => ({ ...item, index: n++ }));
    return { ...entry, items, index: items[0]?.index ?? n };
  });
}

export function navLeaves(entries: NavEntry[] = NAV): IndexedLink[] {
  return withNavIndex(entries).flatMap((entry) =>
    "href" in entry ? [entry] : entry.items,
  );
}

/** Same current-leaf rule as the masthead, including Budget covering /programs. */
export function pathMatchesHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/money") {
    return (
      pathname === "/money" ||
      pathname.startsWith("/money/") ||
      pathname === "/programs" ||
      pathname.startsWith("/programs/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function folioForPath(pathname: string): IndexedLink | null {
  return (
    navLeaves().find((leaf) => pathMatchesHref(pathname, leaf.href)) ?? null
  );
}
