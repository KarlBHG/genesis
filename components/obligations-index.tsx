import Link from "next/link";

import { HomeConstellation } from "@/components/home-constellation";
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
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${visual.accent} opacity-90`}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
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
                          className="block rounded-2xl border border-border/50 bg-background/55 p-4 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-background/80 hover:shadow-md"
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
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-xs tracking-wide text-muted-foreground uppercase">
        Thematic orbit
      </p>
      <div className="scale-90 sm:scale-100">
        <HomeConstellation />
      </div>
    </div>
  );
}
