import Link from "next/link";
import {
  ArrowUpRightIcon,
  Globe2Icon,
  LandmarkIcon,
  MapIcon,
  ScaleIcon,
  ScrollTextIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";

import { SearchPanel } from "@/components/search-panel";
import { ConstellationLegend, HomeConstellation } from "@/components/home-constellation";
import { ResidentStanding } from "@/components/resident-standing";
import { Button } from "@/components/ui/button";
import { catalogSlices } from "@/lib/dashboard-stats";
import { labelize } from "@/lib/format";
import { LANDING_CHAINS, resolveChain, type LandingChain } from "@/lib/landing";
import type { StandingBoard, StandingQuestionView } from "@/lib/standing";
import type { Entry, SearchDoc } from "@/lib/types";

type HomeDashboardProps = {
  entries: Entry[];
  edgeCount: number;
  officeCount: number;
  treatyCount: number;
  mapPinCount: number;
  obligationThemeCount: number;
  searchDocs: SearchDoc[];
  standing: {
    board: StandingBoard;
    questions: StandingQuestionView[];
    programSlug: string;
    municipalitySlug: string | null;
  };
};

const PORTALS = [
  {
    href: "/map",
    title: "Map",
    description: "Geography of state, companies, and multinationals.",
    icon: MapIcon,
    tint: "portal-tint-map",
  },
  {
    href: "/obligations",
    title: "Obligations",
    description: "Security, Europe, trade, investment, and aid.",
    icon: ShieldIcon,
    tint: "portal-tint-obligations",
  },
  {
    href: "/treaties",
    title: "Treaties",
    description: "Every agreement record with source lines.",
    icon: ScaleIcon,
    tint: "portal-tint-treaties",
  },
  {
    href: "/money#government-programs",
    title: "Budget",
    description: "2026 policy areas, Article 4 rows, trade, and Treasury totals.",
    icon: LandmarkIcon,
    tint: "portal-tint-budget",
  },
  {
    href: "/events",
    title: "Events",
    description: "Crises, accession, and turning points.",
    icon: SparklesIcon,
    tint: "portal-tint-events",
  },
  {
    href: "/methodology",
    title: "Methodology",
    description:
      "Six required fields, as-of buckets, and what this project refuses to publish.",
    icon: ScrollTextIcon,
    tint: "portal-tint-method",
  },
] as const;

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

function ChainCard({ chain, index }: { chain: LandingChain; index: number }) {
  const steps = resolveChain(chain);
  const stepKeys = chain.steps.map(
    (step, stepIndex) =>
      `${chain.id}-${stepIndex}-${step.from}-${step.relationship}-${step.to}`,
  );
  return (
    <article className="glass-panel ink-card group relative flex flex-col gap-4 overflow-hidden p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <header className="flex flex-col gap-1">
        <p className="toc-num">{padIndex(index)}</p>
        <Link
          className="font-serif text-lg font-medium tracking-tight underline-offset-4 hover:underline"
          href={chain.href}
        >
          {chain.title}
        </Link>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {chain.blurb}
        </p>
      </header>
      <ol className="relative m-0 flex list-none flex-col gap-0 p-0">
        {steps.map((step, stepIndex) => (
          <li className="relative flex gap-3 pb-4 last:pb-0" key={stepKeys[stepIndex]}>
            {stepIndex < steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-3 left-[0.4375rem] h-[calc(100%-0.25rem)] w-px bg-border"
              />
            ) : null}
            <span
              aria-hidden
              className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full border border-primary/40 bg-background"
            />
            <p className="text-sm leading-6">
              {step.fromHref ? (
                <Link
                  className="font-medium underline-offset-4 hover:underline"
                  href={step.fromHref}
                >
                  {step.fromTitle}
                </Link>
              ) : (
                <span className="font-medium">{step.fromTitle}</span>
              )}{" "}
              <span className="text-muted-foreground">
                {labelize(step.relationship).toLowerCase()}
                {step.year ? ` · ${step.year}` : ""}
              </span>{" "}
              {step.toHref ? (
                <Link
                  className="font-medium underline-offset-4 hover:underline"
                  href={step.toHref}
                >
                  {step.toTitle}
                </Link>
              ) : (
                <span className="font-medium">{step.toTitle}</span>
              )}
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function HomeDashboard({
  entries,
  edgeCount,
  officeCount,
  treatyCount,
  mapPinCount,
  obligationThemeCount,
  searchDocs,
  standing,
}: HomeDashboardProps) {
  const entryCount = entries.length;
  const slices = catalogSlices(entries);
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const widest = Math.max(...slices.map((slice) => slice.count), 1);

  return (
    <div className="dashboard-canvas">
      <section className="dashboard-hero relative">
        <div className="mx-auto flex w-full max-w-shell flex-col gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="fade-rise flex max-w-xl flex-col gap-7">
            <p className="kicker">Sourced atlas</p>
            <h1 className="text-balance">
              <span className="home-display-how block">How</span>
              <span className="home-display-iceland mt-3 block font-serif">
                Iceland
              </span>
              <span className="home-display-wired block font-serif">
                is wired.
              </span>
            </h1>
            <p className="max-w-lede text-lg leading-8 text-muted-foreground">
              Public records, not influence scores. Each connection quotes its
              source — budget law, treaty, registry, or report.{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href="/system"
              >
                How to read the map
              </Link>
              , and the sourcing contract behind it on{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href="/methodology"
              >
                Methodology
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link href="/map" />} size="lg">
                <MapIcon className="size-4" data-icon="inline-start" />
                Open the map
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/obligations" />}
                size="lg"
                variant="outline"
              >
                <Globe2Icon className="size-4" data-icon="inline-start" />
                Obligations
              </Button>
            </div>
            <dl className="folio-rail">
              {[
                { label: "Entries", value: entryCount },
                { label: "Connections", value: edgeCount },
                { label: "Treaties", value: treatyCount },
                { label: "Map pins", value: mapPinCount },
              ].map((stat) => (
                <div className="folio-cell" key={stat.label}>
                  <dt className="text-[0.62rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-serif text-3xl font-medium tabular-nums tracking-tight">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="fade-rise-delayed flex w-full min-w-0 flex-col items-center gap-4 sm:gap-5 lg:max-w-md lg:flex-1">
            <p className="text-center text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {padIndex(obligationThemeCount)} themes ·{" "}
              <Link className="underline underline-offset-4" href="/obligations">
                full index
              </Link>
            </p>
            <div className="hidden w-full lg:block">
              <HomeConstellation />
            </div>
            <ConstellationLegend />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <p className="kicker">Resident standing</p>
          <h2 className="text-2xl font-medium">Three questions</h2>
          <p className="max-w-lede text-sm text-muted-foreground">
            As a taxpayer, as a depositor in a state-owned bank, as a voter
            after 30 November 2024. Each hop is a stored edge with a permalink,
            or{" "}
            <span className="text-foreground">no sourced line</span>. The folio
            is{" "}
            <Link className="underline underline-offset-4" href="/standing">
              Standing
            </Link>
            — not an eleventh nav leaf.
          </p>
        </div>
        <ResidentStanding
          board={standing.board}
          compact
          municipalitySlug={standing.municipalitySlug}
          programSlug={standing.programSlug}
          questions={standing.questions}
        />
      </section>

      <section className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="kicker">Contents</p>
            <h2 className="text-2xl font-medium">Enter anywhere</h2>
            <p className="text-sm text-muted-foreground">
              Six doors into the graph — map, law, money, and time.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {officeCount} public offices tracked
          </p>
        </div>
        <div className="home-portals grid grid-cols-1 gap-3 lg:grid-cols-3">
          {PORTALS.map((portal, index) => (
            <Link
              className="glass-panel ink-card group relative flex flex-col gap-4 overflow-hidden p-5"
              href={portal.href}
              key={portal.href}
            >
              <div aria-hidden className={`pointer-events-none absolute inset-0 ${portal.tint}`} />
              <div className="relative flex items-start justify-between gap-2">
                <span className="toc-num">{padIndex(index + 1)}</span>
                <div className="flex items-center gap-2">
                  <portal.icon className="size-4 text-primary/70" strokeWidth={1.5} />
                  <ArrowUpRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>
              </div>
              <div className="relative">
                <h3 className="font-serif text-lg font-medium">{portal.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {portal.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6">
          <p className="kicker">Width of the atlas</p>
          <h2 className="mb-2 text-2xl font-medium">Catalog shape</h2>
          <p className="mb-8 max-w-lede text-sm text-muted-foreground">
            {total} indexed records across six kinds — width of the atlas, not a
            ranking.
          </p>
          <ul className="flex flex-col gap-4">
            {slices.map((slice) => (
              <li className="flex flex-col gap-1.5" key={slice.kind}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium">{slice.label}</span>
                  <span className="font-serif text-lg tabular-nums">
                    {slice.count}
                  </span>
                </div>
                <div className="catalog-track" aria-hidden>
                  <div
                    className="catalog-fill"
                    style={{
                      width: `${(slice.count / widest) * 100}%`,
                      backgroundColor: slice.swatch,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <p className="kicker">Evidence paths</p>
          <h2 className="text-2xl font-medium">
            {LANDING_CHAINS.length} chains to start from
          </h2>
          <p className="max-w-lede text-sm text-muted-foreground">
            Short paths through the evidence — each step is a stored edge with a
            quotation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LANDING_CHAINS.map((chain, index) => (
            <ChainCard chain={chain} index={index + 1} key={chain.id} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-shell px-4 pb-20 sm:px-6">
        <div className="glass-panel p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <p className="toc-num">07</p>
            <SearchIcon className="size-5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-xl font-medium">Search the records</h2>
          </div>
          <SearchPanel docs={searchDocs} />
        </div>
      </section>
    </div>
  );
}
