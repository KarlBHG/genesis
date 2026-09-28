import Link from "next/link";

const LINKS = [
  { href: "/map", label: "Map" },
  { href: "/obligations", label: "Obligations" },
  { href: "/treaties", label: "Treaties" },
  { href: "/connections", label: "Connections" },
  { href: "/system", label: "How to read" },
  { href: "/methodology", label: "Methodology" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-border/70 site-footer-glow print:hidden">
      <div className="mx-auto flex w-full max-w-shell flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-md flex-col gap-3">
          <p className="font-serif text-lg font-medium tracking-tight">AlltÍkerfi</p>
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
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <Link
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
