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
