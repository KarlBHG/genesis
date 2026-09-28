import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownBody } from "@/components/markdown-body";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  edgesFor,
  getOfficeById,
  getOffices,
  resolveSlug,
} from "@/lib/content";
import { formatDate, labelize } from "@/lib/format";
import { icelandicLang } from "@/lib/lang";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getOffices().map((office) => ({ id: office.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const office = getOfficeById(id);
  if (!office) return { title: "Not found" };
  return { title: office.title, description: `Holders of the office ${office.title}.` };
}

export default async function OfficePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const office = getOfficeById(id);
  if (!office) notFound();

  const holder = resolveSlug(office.holder);
  const organization = resolveSlug(office.organization);
  const { out, inn } = edgesFor(office.id);
  const touches = [...inn, ...out].sort((a, b) =>
    a.asOf.localeCompare(b.asOf),
  );

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
            <BreadcrumbLink render={<Link href="/map" />}>Map</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{office.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Office</p>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          {office.title}
        </h1>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Holder</dt>
            <dd>
              {holder ? (
                <Link
                  className="font-medium underline underline-offset-4"
                  href={holder.href}
                >
                  {holder.title}
                </Link>
              ) : (
                office.holder
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Organization</dt>
            <dd>
              {organization ? (
                <Link
                  className="font-medium underline underline-offset-4"
                  href={organization.href}
                >
                  {organization.title}
                </Link>
              ) : (
                office.organization
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">As of</dt>
            <dd>{formatDate(office.asOf)}</dd>
          </div>
        </dl>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">
          Recorded holders · {touches.length}
        </h2>
        {touches.length === 0 ? (
          <MarkdownBody
            source={
              "No dated appointment edge points at this office. The act prints the appointment rule, but the opened pages do not print when the current holder was appointed."
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {touches.map((edge) => {
              const person =
                edge.from === office.id
                  ? resolveSlug(edge.to)
                  : resolveSlug(edge.from);
              const personTitle =
                edge.from === office.id ? edge.toTitle : edge.fromTitle;
              return (
                <li
                  className="rounded-lg border p-4"
                  key={`${edge.from}-${edge.relationship}-${edge.to}-${edge.asOf}-${edge.start ?? ""}`}
                >
                  <p className="break-words font-medium">
                    {person ? (
                      <Link
                        className="underline underline-offset-4"
                        href={person.href}
                      >
                        {personTitle}
                      </Link>
                    ) : (
                      personTitle
                    )}{" "}
                    <Badge variant="secondary">
                      {labelize(edge.relationship)}
                    </Badge>{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {edge.start ?? "start not printed"} –{" "}
                      {edge.end ?? "end not printed"} ·{" "}
                      {formatDate(edge.asOf)}
                    </span>
                  </p>
                  <p className="mt-1 break-words text-sm leading-6">
                    <span lang={icelandicLang(edge.quotation)}>{edge.quotation}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
