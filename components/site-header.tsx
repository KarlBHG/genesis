"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

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

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/treaties", label: "Treaties" },
  { href: "/institutions", label: "Institutions" },
  { href: "/events", label: "Events" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link className="text-lg font-medium tracking-tight" href="/">
          AlltÍkerfi
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button
              key={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              render={<Link href={item.href} />}
              size="sm"
              variant={isCurrent(pathname, item.href) ? "secondary" : "ghost"}
            >
              {item.label}
            </Button>
          ))}
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
            <nav className="flex flex-col gap-1 px-4">
              {NAV.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <Link
                      aria-current={
                        isCurrent(pathname, item.href) ? "page" : undefined
                      }
                      className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      href={item.href}
                    />
                  }
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
