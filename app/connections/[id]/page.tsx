import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProvenanceEdgeCard } from "@/components/provenance-edge";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { asOfMeta } from "@/lib/as-of";
import { getCatalog, getEdges, getOffices, resolveSlug } from "@/lib/content";
import { edgeId, findEdgeById } from "@/lib/edge-id";
import { clampSentence } from "@/lib/entry-facts";
import { labelize } from "@/lib/format";
import { MAP_VIEWS, viewOf } from "@/lib/geo-map";
import { identityForPaysEdge, uniqueMatchForHeading } from "@/lib/identities";
import { officeLabel } from "@/lib/notes";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getEdges().map((edge) => ({ id: edgeId(edge) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const edge = findEdgeById(id, getEdges());
  if (!edge) return { title: "Not found" };
  const toTitle =
    edge.relationship === "holds-office" ? officeLabel(edge) : edge.toTitle;
  const title = `${edge.fromTitle} ${labelize(edge.relationship)} ${toTitle}`;
  return {
    title,
    description: clampSentence(edge.quotation, 200),
  };
}

export default async function ConnectionPermalinkPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const edge = findEdgeById(id, getEdges());
  if (!edge) notFound();

  const view = viewOf(edge.relationship);
  const viewLabel = MAP_VIEWS.find((item) => item.id === view)?.label;
  const asOf = asOfMeta(edge.asOf);
  const from = resolveSlug(edge.from);
  const to = resolveSlug(edge.to);
  const toTitle =
    edge.relationship === "holds-office" ? officeLabel(edge) : edge.toTitle;
  const program = edge.program ? resolveSlug(edge.program) : null;
  const identity = identityForPaysEdge(edge);
  const identitySits = identity?.catalogSlug
    ? resolveSlug(identity.catalogSlug)
    : null;
  const uniqueSlug = identity
    ? uniqueMatchForHeading(identity.printedHeading, [
        ...getCatalog().map((entry) => ({ id: entry.slug, title: entry.title })),
        ...getOffices().map((office) => ({ id: office.id, title: office.title })),
      ])
    : null;
  const uniqueMatch = uniqueSlug ? resolveSlug(uniqueSlug) : null;

  return (
    <article className="atlas-page mx-auto flex w-full max-w-reading flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/overview" />}>
              Overview
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/connections" />}>
              Connections
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{labelize(edge.relationship)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="glass-panel atlas-page-header entry-masthead">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="kicker fade-rise">Typed connection</p>
          {view && viewLabel ? (
            <Link
              className="entry-running-head fade-rise underline-offset-4 hover:underline"
              href={`/connections#${view}`}
            >
              {viewLabel} view
            </Link>
          ) : null}
        </div>
        <h1 className="display-title hero-display text-[2.05rem] leading-[1.02] text-balance sm:text-4xl lg:text-[2.85rem]">
          {edge.fromTitle}{" "}
          <span className="display-italic">{labelize(edge.relationship).toLowerCase()}</span>{" "}
          {toTitle}
        </h1>
        <p className="standfirst-body fade-rise-3">
          This page is one stored relationship — the quotation, the date the cited
          page prints, and the address it was read at. It is not a score, a
          cluster, or a derived total.
        </p>
        <p className="fade-rise-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{labelize(edge.relationship)}</Badge>
        </p>
      </header>

      <ProvenanceEdgeCard
        as="article"
        edge={edge}
        showProgramQuotation
      />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">From</dt>
          <dd>
            {from ? (
              <Link className="underline underline-offset-4" href={from.href}>
                {edge.fromTitle}
              </Link>
            ) : (
              edge.fromTitle
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">To</dt>
          <dd>
            {to ? (
              <Link className="underline underline-offset-4" href={to.href}>
                {toTitle}
              </Link>
            ) : (
              toTitle
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">As of</dt>
          <dd>
            {asOf.display}{" "}
            <span className="text-muted-foreground">({asOf.bucketLabel})</span>
          </dd>
        </div>
        {edge.year ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Fiscal year</dt>
            <dd>{edge.year}</dd>
          </div>
        ) : null}
        {program ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Budget heading</dt>
            <dd>
              <Link className="underline underline-offset-4" href={program.href}>
                {edge.programTitle ?? program.title}
              </Link>
            </dd>
          </div>
        ) : null}
        {edge.programNullReason ? (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Ledger prints no program
            </dt>
            <dd className="text-sm leading-6">{edge.programNullReason}</dd>
          </div>
        ) : null}
        {identity ? (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Printed heading
            </dt>
            <dd className="text-sm leading-6">
              <span lang="is">{identity.printedHeading}</span>
              {identitySits ? (
                <>
                  {" "}
                  sits on{" "}
                  <Link className="underline underline-offset-4" href={identitySits.href}>
                    {identitySits.title}
                  </Link>
                </>
              ) : (
                <> is unmatched</>
              )}
              {uniqueMatch && uniqueSlug && uniqueSlug !== identity.catalogSlug ? (
                <>
                  . The unique catalog title match is{" "}
                  <Link className="underline underline-offset-4" href={uniqueMatch.href}>
                    {uniqueMatch.title}
                  </Link>
                  ; these invoices were not moved there
                </>
              ) : null}
              . See{" "}
              <Link className="underline underline-offset-4" href="/money#printed-headings">
                heading identities
              </Link>
              .
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
