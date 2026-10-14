import Link from "next/link";

import { navLeaves, OFF_INDEX, padFolio } from "@/lib/nav";

export function SiteFooter() {
  const plates = navLeaves();

  return (
    <footer className="site-footer-glow relative mt-auto border-t border-border print:hidden">
      <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="flex max-w-md flex-col gap-3">
          <p className="kicker">Colophon</p>
          <p className="font-serif text-2xl font-medium tracking-[0.05em]">
            AlltÍkerfi
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            A reading map of Icelandic treaties, institutions, events, sectors,
            money flows, and public office-holders. Every connection quotes its
            source — six required fields, a dated page, and no figure this
            project made up. The contract is written out on{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/methodology"
            >
              Methodology
            </Link>
            .
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="colophon-index min-w-0 flex-1"
        >
          <div className="colophon-group">
            <p className="kicker">Plates 01–10</p>
            {plates.map((plate) => (
              <Link
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                href={plate.href}
                key={plate.href}
              >
                <span aria-hidden className="masthead-link-index">
                  {padFolio(plate.index)}
                </span>
                {plate.label}
              </Link>
            ))}
          </div>
          <div className="colophon-group">
            <p className="kicker">Off the index</p>
            {OFF_INDEX.map((room) => (
              <Link
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                href={room.href}
                key={room.href}
              >
                {room.label}
              </Link>
            ))}
          </div>
        </nav>
        <p className="max-w-xs text-xs leading-6 text-muted-foreground lg:text-right">
          No influence scores. No summed totals this project invented. Printed
          as a map of records that already exist.
        </p>
      </div>
    </footer>
  );
}
