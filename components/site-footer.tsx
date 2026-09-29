import Link from "next/link";

const LINKS = [
  { href: "/map", label: "Map" },
  { href: "/obligations", label: "Obligations" },
  { href: "/treaties", label: "Treaties" },
  { href: "/connections", label: "Connections" },
  { href: "/system", label: "How to read" },
  { href: "/methodology", label: "Methodology" },
  { href: "/intake", label: "Paste a line" },
] as const;

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

export function SiteFooter() {
  return (
    <footer className="site-footer-glow relative mt-auto border-t border-border/70 print:hidden">
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
        <nav aria-label="Footer" className="colophon-index min-w-0 flex-1 lg:max-w-sm">
          {LINKS.map((link, index) => (
            <Link
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href={link.href}
              key={link.href}
            >
              <span aria-hidden className="masthead-link-index">
                {padIndex(index + 1)}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="max-w-xs text-xs leading-6 text-muted-foreground lg:text-right">
          No influence scores. No summed totals this project invented. Printed
          as a map of records that already exist.
        </p>
      </div>
    </footer>
  );
}
