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
import { Button } from "@/components/ui/button";
import { catalogSlices } from "@/lib/dashboard-stats";
import { labelize } from "@/lib/format";
import { LANDING_CHAINS, resolveChain, type LandingChain } from "@/lib/landing";
import type { Entry, SearchDoc } from "@/lib/types";

type HomeDashboardProps = {
  entries: Entry[];
  edgeCount: number;
  officeCount: number;
  treatyCount: number;
  mapPinCount: number;
  obligationThemeCount: number;
  searchDocs: SearchDoc[];
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

function ChainCard({ chain }: { chain: LandingChain }) {
  const steps = resolveChain(chain);
  const stepKeys = chain.steps.map(
    (step, index) => `${chain.id}-${index}-${step.from}-${step.relationship}-${step.to}`,
  );
  return (
    <article className="glass-panel ink-card group relative flex flex-col gap-4 overflow-hidden p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <header className="flex flex-col gap-1">
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
      <ol className="relative m-0 flex flex-col gap-0 p-0 list-none">
        {steps.map((step, index) => (
          <li className="relative flex gap-3 pb-4 last:pb-0" key={stepKeys[index]}>
            {index < steps.length - 1 ? (
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
}: HomeDashboardProps) {
  const entryCount = entries.length;
  const slices = catalogSlices(entries);
  const total = slices.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="dashboard-canvas">
      <section className="dashboard-hero relative border-b">
        <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="fade-rise flex max-w-xl flex-col gap-6">
            <p className="kicker">AlltÍkerfi · sourced atlas</p>
            <h1 className="text-4xl font-medium text-balance sm:text-5xl lg:text-[3.55rem] lg:leading-[1.04]">
              <span className="block">How Iceland</span>
              <span className="mt-1 block font-serif italic text-foreground/80">
                is wired.
              </span>
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
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
            <dl className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {[
                { label: "Entries", value: entryCount },
                { label: "Connections", value: edgeCount },
                { label: "Treaties", value: treatyCount },
                { label: "Map pins", value: mapPinCount },
              ].map((stat) => (
                <div className="stat-cell" key={stat.label}>
                  <dt className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-serif text-2xl font-medium tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="fade-rise-delayed flex w-full min-w-0 flex-col items-center gap-3 sm:gap-4 lg:max-w-md lg:flex-1">
            <p className="text-center text-sm text-muted-foreground">
              {obligationThemeCount} themes ·{" "}
              <Link className="underline underline-offset-4" href="/obligations">
                full index
              </Link>
            </p>
            <div className="hidden w-full sm:block">
              <HomeConstellation />
            </div>
            <ConstellationLegend />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-shell px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="kicker">Doors</p>
            <h2 className="text-2xl font-medium">Enter anywhere</h2>
            <p className="text-sm text-muted-foreground">
              Six doors into the graph — map, law, money, and time.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{officeCount} public offices tracked</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PORTALS.map((portal) => (
            <Link
              className="glass-panel ink-card group relative flex flex-col gap-3 overflow-hidden p-5"
              href={portal.href}
              key={portal.href}
            >
              <div aria-hidden className={`pointer-events-none absolute inset-0 ${portal.tint}`} />
              <div className="relative flex items-start justify-between gap-2">
                <portal.icon className="size-5 text-primary/80" strokeWidth={1.5} />
                <ArrowUpRightIcon
                  className="size-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                />
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
        <div className="mx-auto w-full max-w-shell px-4 py-12 sm:px-6">
          <p className="kicker">Width of the atlas</p>
          <h2 className="mb-2 text-2xl font-medium">Catalog shape</h2>
          <p className="mb-6 max-w-lede text-sm text-muted-foreground">
            {total} indexed records across six kinds — width of the atlas, not a
            ranking.
          </p>
          <div
            className="flex h-2.5 w-full overflow-hidden border bg-background"
            role="img"
            aria-label="Catalog distribution by kind"
          >
            {slices.map((slice) =>
              slice.count > 0 ? (
                <div
                  key={slice.kind}
                  className="h-full min-w-px transition-[flex-grow]"
                  style={{
                    flexGrow: slice.count,
                    backgroundColor: slice.swatch,
                  }}
                  title={`${slice.label}: ${slice.count}`}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {slices.map((slice) => (
              <li className="flex items-center gap-2" key={slice.kind}>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: slice.swatch }}
                />
                <span className="text-muted-foreground">{slice.label}</span>
                <span className="font-medium tabular-nums">{slice.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-shell px-4 py-12 sm:px-6">
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
          {LANDING_CHAINS.map((chain) => (
            <ChainCard chain={chain} key={chain.id} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-shell px-4 pb-16 sm:px-6">
        <div className="glass-panel p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <SearchIcon className="size-5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-xl font-medium">Search the records</h2>
          </div>
          <SearchPanel docs={searchDocs} />
        </div>
      </section>
    </div>
  );
}
