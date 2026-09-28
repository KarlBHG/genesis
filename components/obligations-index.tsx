import Link from "next/link";

import { OBLIGATION_SECTIONS } from "@/lib/obligations";
import { obligationVisual } from "@/lib/obligation-visual";

export function ObligationsIndex() {
  return (
    <div className="relative">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,13rem)_1fr] lg:gap-16 lg:py-16">
        <nav
          aria-label="Obligation themes"
          className="top-24 hidden h-fit lg:sticky lg:block"
        >
          <p className="mb-4 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Themes
          </p>
          <ul className="flex flex-col gap-1 border-l border-border/80 pl-4">
            {OBLIGATION_SECTIONS.map((section) => {
              const visual = obligationVisual(section.id);
              return (
                <li key={section.id}>
                  <Link
                    className="group flex items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    href={`#${section.id}`}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full opacity-70 transition-transform group-hover:scale-125"
                      style={{ backgroundColor: visual.ring }}
                    />
                    <span className="leading-snug">{section.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-14">
          {OBLIGATION_SECTIONS.map((section, index) => {
            const visual = obligationVisual(section.id);
            const Icon = visual.icon;
            return (
              <section
                className="scroll-mt-24"
                id={section.id}
                key={section.id}
              >
                <article className="glass-panel group relative overflow-hidden rounded-3xl p-6 sm:p-8">
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${visual.accent}`}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-20 h-44 w-44 rounded-full opacity-[0.14] blur-3xl"
                    style={{ backgroundColor: visual.ring }}
                  />
                  <header className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/70 shadow-sm backdrop-blur-sm"
                        style={{ color: visual.ring }}
                      >
                        <Icon className="size-5" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, "0")} · theme
                        </p>
                        <h2 className="text-2xl font-medium tracking-tight">
                          {section.title}
                        </h2>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                          {section.lead}
                        </p>
                      </div>
                    </div>
                  </header>
                  <ul className="relative mt-8 flex flex-col gap-3">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          className="block rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur-sm transition-all hover:border-primary/25 hover:bg-background/95 hover:shadow-md"
                          href={item.href}
                        >
                          <span className="font-medium underline-offset-4 group-hover:underline">
                            {item.label}
                          </span>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.note}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {section.footnote ? (
                    <p className="relative mt-6 text-sm leading-6 text-muted-foreground">
                      {section.footnote}
                    </p>
                  ) : null}
                </article>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ObligationsHeroAside() {
  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-5">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {OBLIGATION_SECTIONS.length} themes on this page
      </p>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {OBLIGATION_SECTIONS.map((section) => {
          const visual = obligationVisual(section.id);
          return (
            <li key={section.id}>
              <Link
                className="group flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                href={`#${section.id}`}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: visual.ring }}
                />
                <span className="truncate">{section.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        The full orbit view is on the{" "}
        <Link className="underline underline-offset-4" href="/">
          homepage
        </Link>
        .
      </p>
    </div>
  );
}
