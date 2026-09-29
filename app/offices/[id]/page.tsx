import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OfficeMismatchCallout } from "@/components/office-holder-mismatch-checklist";
import {
  OfficeBoardSeatTable,
  OfficeMembershipTable,
} from "@/components/office-membership-table";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getOfficeById, getOffices } from "@/lib/content";
import { officeMembershipView } from "@/lib/office-membership";

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
  return {
    title: office.title,
    description: `Post and sourced membership of ${office.title}. Vacant stays vacant.`,
  };
}

export default async function OfficePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const office = getOfficeById(id);
  if (!office) notFound();

  const view = officeMembershipView(office);

  return (
    <main className="atlas-page mx-auto flex w-full max-w-reading flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumb className="print:hidden">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/overview" />}>
              Overview
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/offices" />}>
              Offices
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{office.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="glass-panel atlas-page-header entry-masthead flex flex-col gap-4">
        <p className="kicker fade-rise">Post</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="display-title hero-display text-[2.05rem] leading-[1.02] text-balance sm:text-4xl lg:text-[2.85rem]">
            {office.title}
          </h1>
          {view.vacant ? (
            <Badge variant="outline">vacant</Badge>
          ) : (
            <Badge variant="secondary">current membership</Badge>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Organization
            </dt>
            <dd>
              {view.organizationHref ? (
                <Link
                  className="font-medium underline underline-offset-4"
                  href={view.organizationHref}
                >
                  {view.organizationTitle}
                </Link>
              ) : (
                view.organizationTitle
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Current membership
            </dt>
            <dd>
              {view.vacant ? (
                <span>Vacant. Not filled from the holder field.</span>
              ) : (
                view.current
                  .map((row) => row.personTitle)
                  .filter((title, index, all) => all.indexOf(title) === index)
                  .join(", ")
              )}
            </dd>
          </div>
        </dl>
        {view.vacant ? (
          <p className="text-sm leading-6 text-muted-foreground">
            A vacant post has no holds-office row whose end is empty and whose
            as-of is cited. Ended memberships stay in the table below.
          </p>
        ) : null}
      </header>

      <OfficeMismatchCallout view={view} />
      <OfficeMembershipTable view={view} />
      <OfficeBoardSeatTable view={view} />
    </main>
  );
}
