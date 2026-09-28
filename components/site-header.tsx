"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

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

const NAV: NavEntry[] = [
  { href: "/system", label: "System" },
  { href: "/map", label: "Map" },
  {
    label: "Records",
    items: [
      { href: "/overview", label: "Overview" },
      { href: "/obligations", label: "Obligations" },
      { href: "/treaties", label: "Treaties" },
      { href: "/institutions", label: "Institutions" },
      { href: "/events", label: "Events" },
      { href: "/business", label: "Business" },
      { href: "/money", label: "Money" },
      { href: "/programs", label: "Programs" },
      { href: "/players", label: "Players" },
    ],
  },
  {
    label: "Evidence",
    items: [
      { href: "/connections", label: "Connections" },
      { href: "/anomalies", label: "Anomalies" },
    ],
  },
  { href: "/compare", label: "Compare" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function entryActive(pathname: string, entry: NavEntry): boolean {
  if ("href" in entry) return isCurrent(pathname, entry.href);
  return entry.items.some((item) => isCurrent(pathname, item.href));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link className="text-lg font-medium tracking-tight" href="/">
          AlltÍkerfi
        </Link>
        <div className="ml-auto md:ml-0">
          <CommandPalette />
        </div>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((entry) =>
            "href" in entry ? (
              <Button
                key={entry.href}
                aria-current={isCurrent(pathname, entry.href) ? "page" : undefined}
                nativeButton={false}
                render={<Link href={entry.href} />}
                size="sm"
                variant={isCurrent(pathname, entry.href) ? "secondary" : "ghost"}
              >
                {entry.label}
              </Button>
            ) : (
              <div
                key={entry.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(entry.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Button
                  aria-expanded={openMenu === entry.label}
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenMenu(openMenu === entry.label ? null : entry.label)
                  }
                  size="sm"
                  variant={entryActive(pathname, entry) ? "secondary" : "ghost"}
                >
                  {entry.label}
                </Button>
                {openMenu === entry.label ? (
                  <div className="absolute top-full right-0 z-50 w-52 rounded-xl border bg-popover p-1 shadow-lg">
                    {entry.items.map((item) => (
                      <Link
                        aria-current={
                          isCurrent(pathname, item.href) ? "page" : undefined
                        }
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-muted aria-[current=page]:bg-muted"
                        href={item.href}
                        key={item.href}
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          )}
        </nav>
        <Sheet>
          <SheetTrigger
            className="ml-auto md:hidden"
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
              <SheetDescription>Sections of the map</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
              {NAV.map((entry) =>
                "href" in entry ? (
                  <SheetClose
                    key={entry.href}
                    render={
                      <Link
                        aria-current={
                          isCurrent(pathname, entry.href) ? "page" : undefined
                        }
                        className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                        href={entry.href}
                      />
                    }
                  >
                    {entry.label}
                  </SheetClose>
                ) : (
                  <div className="flex flex-col gap-1" key={entry.label}>
                    <p className="px-3 text-xs tracking-wide text-muted-foreground uppercase">
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
                            className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                            href={item.href}
                          />
                        }
                      >
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
    </header>
  );
}
