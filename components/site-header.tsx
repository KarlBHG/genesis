"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { CommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavLink = { href: string; label: string };
type NavEntry =
  | NavLink
  | { label: string; items: NavLink[] };

type IndexedLink = NavLink & { index: number };
type IndexedEntry =
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

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

function withIndex(entries: NavEntry[] = NAV): IndexedEntry[] {
  let n = 1;
  return entries.map((entry) => {
    if ("href" in entry) {
      return { ...entry, index: n++ };
    }
    const items = entry.items.map((item) => ({ ...item, index: n++ }));
    return { ...entry, items, index: items[0]?.index ?? n };
  });
}

function isCurrent(pathname: string, href: string) {
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

function entryActive(pathname: string, entry: IndexedEntry): boolean {
  if ("href" in entry) return isCurrent(pathname, entry.href);
  return entry.items.some((item) => isCurrent(pathname, item.href));
}

function FolioNum({ n }: { n: number }) {
  return (
    <span aria-hidden className="masthead-link-index">
      {padIndex(n)}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const indexed = withIndex();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="site-masthead sticky top-0 z-40 print:hidden">
      <div className="mx-auto flex w-full max-w-shell flex-col px-4 sm:px-6">
        <div className="flex items-end gap-3 py-3">
          <Link className="masthead-wordmark" href="/">
            <span className="masthead-folio">Iceland · public record</span>
            <span className="masthead-wordmark-name">AlltÍkerfi</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <Sheet>
              <SheetTrigger
                className="md:hidden"
                render={
                  <Button className="md:hidden" size="icon" variant="outline" />
                }
              >
                <MenuIcon />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>AlltÍkerfi</SheetTitle>
                  <SheetDescription>Index of the atlas</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 overflow-y-auto px-4 pb-4">
                  {indexed.map((entry) =>
                    "href" in entry ? (
                      <SheetClose
                        key={entry.href}
                        render={
                          <Link
                            aria-current={
                              isCurrent(pathname, entry.href) ? "page" : undefined
                            }
                            className="flex items-baseline gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                            href={entry.href}
                          />
                        }
                      >
                        <FolioNum n={entry.index} />
                        {entry.label}
                      </SheetClose>
                    ) : (
                      <div className="flex flex-col gap-1" key={entry.label}>
                        <p className="px-3 pt-2 text-xs tracking-wide text-muted-foreground uppercase">
                          {entry.label}
                        </p>
                        {entry.items.map((item) => (
                          <SheetClose
                            key={item.href}
                            render={
                              <Link
                                aria-current={
                                  isCurrent(pathname, item.href)
                                    ? "page"
                                    : undefined
                                }
                                className="flex items-baseline gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                href={item.href}
                              />
                            }
                          >
                            <FolioNum n={item.index} />
                            {item.label}
                          </SheetClose>
                        ))}
                      </div>
                    ),
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <nav aria-label="Primary" className="masthead-index">
          {indexed.map((entry) =>
            "href" in entry ? (
              <Link
                aria-current={isCurrent(pathname, entry.href) ? "page" : undefined}
                className="masthead-link"
                href={entry.href}
                key={entry.href}
              >
                <FolioNum n={entry.index} />
                {entry.label}
              </Link>
            ) : (
              <div
                className="relative"
                key={entry.label}
                onMouseEnter={() => setOpenMenu(entry.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  aria-expanded={openMenu === entry.label}
                  aria-haspopup="true"
                  className="masthead-link"
                  data-active={entryActive(pathname, entry) ? "true" : undefined}
                  onClick={() =>
                    setOpenMenu(openMenu === entry.label ? null : entry.label)
                  }
                  type="button"
                >
                  <FolioNum n={entry.index} />
                  {entry.label}
                </button>
                {openMenu === entry.label ? (
                  <div className="masthead-dropdown">
                    {entry.items.map((item) => (
                      <Link
                        aria-current={
                          isCurrent(pathname, item.href) ? "page" : undefined
                        }
                        href={item.href}
                        key={item.href}
                        onClick={() => setOpenMenu(null)}
                      >
                        <FolioNum n={item.index} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
