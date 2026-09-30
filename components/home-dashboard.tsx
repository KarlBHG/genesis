import Link from "next/link";

import { ConstellationLegend, HomeConstellation } from "@/components/home-constellation";
import { ResidentStanding } from "@/components/resident-standing";
import { Button } from "@/components/ui/button";
import { catalogSlices } from "@/lib/dashboard-stats";
import { labelize } from "@/lib/format";
import { LANDING_CHAINS, resolveChain, type LandingChain } from "@/lib/landing";
import {
  navLeaves,
  OFF_INDEX,
  padFolio,
  PLATE_STANDFIRSTS,
} from "@/lib/nav";
import type { StandingBoard, StandingQuestionView } from "@/lib/standing";
import type { Entry } from "@/lib/types";

type HomeDashboardProps = {
  entries: Entry[];
  edgeCount: number;
  officeCount: number;
  treatyCount: number;
  mapPinCount: number;
  obligationThemeCount: number;
  standing: {
    board: StandingBoard;
    questions: StandingQuestionView[];
    programSlug: string;
    municipalitySlug: string | null;
  };
};

function ChainPlate({ chain, index }: { chain: LandingChain; index: number }) {
  const steps = resolveChain(chain);
  const stepKeys = chain.steps.map(
    (step, stepIndex) =>
      `${chain.id}-${stepIndex}-${step.from}-${step.relationship}-${step.to}`,
  );
  return (
    <article className="chain-plate">
      <header className="flex flex-col gap-1">
        <p className="toc-num">{padFolio(index)}</p>
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
      <ol className="relative m-0 mt-4 flex list-none flex-col gap-0 p-0">
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
              className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full border border-primary bg-background"
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
  standing,
}: HomeDashboardProps) {
  const entryCount = entries.length;
  const slices = catalogSlices(entries);
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const plates = navLeaves();

  return (
    <div className="dashboard-canvas">
      <section className="dashboard-hero relative">
        <div className="mx-auto flex w-full max-w-shell flex-col gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="fade-rise rise-ink flex max-w-xl flex-col gap-7">
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
            <div className="flex flex-wrap items-center gap-2">
              <Button nativeButton={false} render={<Link href="/map" />} size="lg">
                Open the map
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/standing" />}
                size="lg"
                variant="outline"
              >
                Standing
              </Button>
              <p className="text-sm text-muted-foreground">
                Index{" "}
                <kbd className="rounded-sm border border-border px-1 font-sans text-xs text-muted-foreground">
                  ⌘K
                </kbd>
              </p>
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
          <div className="fade-rise-delayed rise-ink flex w-full min-w-0 flex-col items-center gap-4 sm:gap-5 lg:max-w-md lg:flex-1">
            <p className="text-center text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {padFolio(obligationThemeCount)} themes ·{" "}
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
        <div className="mb-8 flex flex-col gap-2">
          <p className="kicker">Contents</p>
          <h2 className="text-2xl font-medium">Ten plates</h2>
          <p className="max-w-lede text-sm text-muted-foreground">
            The same numbered index as the masthead. Standing, offices, and
            intake stay off this list.
          </p>
        </div>
        <nav aria-label="Ten plates" className="home-portals plate-index">
          {plates.map((plate) => (
            <Link className="plate-index-row" href={plate.href} key={plate.href}>
              <span className="toc-num">{padFolio(plate.index)}</span>
              <span className="min-w-0">
                <span className="block font-serif text-lg font-medium tracking-tight">
                  {plate.label}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {PLATE_STANDFIRSTS[plate.href]}
                </span>
              </span>
            </Link>
          ))}
        </nav>
        <p className="off-index-line">
          Off the index ·{" "}
          {OFF_INDEX.map((room, index) => (
            <span key={room.href}>
              {index > 0 ? " · " : null}
              <Link className="underline-offset-4 hover:underline" href={room.href}>
                {room.label}
              </Link>
            </span>
          ))}
          {` · ${officeCount} public offices tracked`}
        </p>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6">
          <p className="kicker">Width of the atlas</p>
          <h2 className="mb-2 text-2xl font-medium">Catalog shape</h2>
          <p className="mb-8 max-w-lede text-sm text-muted-foreground">
            {total} indexed records across six kinds — width of the atlas, not a
            ranking.
          </p>
          <ul className="catalog-index">
            {slices.map((slice) => (
              <li className="catalog-index-row" key={slice.kind}>
                <span className="font-medium">{slice.label}</span>
                <span className="catalog-index-leader" aria-hidden />
                <span className="font-serif text-lg tabular-nums">
                  {slice.count}
                </span>
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
        <div className="landing-chains grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-x-12">
          {LANDING_CHAINS.map((chain, index) => (
            <ChainPlate chain={chain} index={index + 1} key={chain.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
