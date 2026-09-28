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
import { getEdges, resolveSlug } from "@/lib/content";
import { edgeId, findEdgeById } from "@/lib/edge-id";
import { clampSentence } from "@/lib/entry-facts";
import { labelize } from "@/lib/format";
import { MAP_VIEWS, viewOf } from "@/lib/geo-map";
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

  return (
    <article className="mx-auto flex w-full max-w-reading flex-col gap-8 px-4 py-8 sm:px-6">
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

      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Typed connection</p>
        <h1 className="text-3xl font-medium tracking-tight">
          {edge.fromTitle} {labelize(edge.relationship)} {toTitle}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          This page is one stored relationship — the quotation, the date the cited
          page prints, and the address it was read at. It is not a score, a
          cluster, or a derived total.
        </p>
        <p className="flex flex-wrap items-center gap-2">
          {view && viewLabel ? (
            <Link
              className="text-sm underline underline-offset-4"
              href={`/connections#${view}`}
            >
              {viewLabel} view
            </Link>
          ) : null}
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
          <dt className="text-sm text-muted-foreground">From</dt>
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
          <dt className="text-sm text-muted-foreground">To</dt>
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
          <dt className="text-sm text-muted-foreground">As of</dt>
          <dd>
            {asOf.display}{" "}
            <span className="text-muted-foreground">({asOf.bucketLabel})</span>
          </dd>
        </div>
        {edge.year ? (
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Fiscal year</dt>
            <dd>{edge.year}</dd>
          </div>
        ) : null}
        {program ? (
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Budget heading</dt>
            <dd>
              <Link className="underline underline-offset-4" href={program.href}>
                {edge.programTitle ?? program.title}
              </Link>
            </dd>
          </div>
        ) : null}
        {edge.programNullReason ? (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-sm text-muted-foreground">
              Ledger prints no program
            </dt>
            <dd className="text-sm leading-6">{edge.programNullReason}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
