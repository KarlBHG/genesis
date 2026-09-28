import Link from "next/link";
import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import {
  PUBLIC_ENTITY_CATEGORY_LABELS,
  getPublicEntityCoverage,
  summarizePublicEntityCoverage,
} from "@/lib/public-entities";

export const metadata: Metadata = {
  title: "Public entities",
  description:
    "An explicit inventory of in-scope public entities and their coverage status: mapped, typed-linked, and office-linked.",
};

export default function PublicEntitiesPage() {
  const rows = getPublicEntityCoverage();
  const summaries = summarizePublicEntityCoverage(rows);
  const totalMapped = rows.filter((row) => row.mapped).length;
  const totalTyped = rows.filter((row) => row.typedLinkage).length;
  const totalOffice = rows.filter((row) => row.officeLinked).length;

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="Every in-scope public entity tracked in this phase appears here with explicit coverage indicators. “Mapped” means it has a geography pin unless marked office-only, “typed links” means at least one schema-typed edge, and “office-linked” means named office records connect through holds-office lines."
        eyebrow={`${rows.length} tracked entities · ${totalMapped} mapped · ${totalTyped} typed-linked`}
        title="Public entities"
      />
      <div className="mx-auto flex w-full max-w-shell flex-col gap-6 px-4 pb-16 pt-10 sm:px-6">
        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Mapped</p>
            <p className="mt-1 text-2xl font-medium">
              {totalMapped} / {rows.length}
            </p>
          </article>
          <article className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Typed links</p>
            <p className="mt-1 text-2xl font-medium">
              {totalTyped} / {rows.length}
            </p>
          </article>
          <article className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Office-linked</p>
            <p className="mt-1 text-2xl font-medium">
              {totalOffice} / {rows.length}
            </p>
          </article>
        </section>

        {summaries.map((summary) => (
          <section className="flex flex-col gap-3" key={summary.category}>
            <h2 className="font-serif text-xl font-medium tracking-tight">
              {PUBLIC_ENTITY_CATEGORY_LABELS[summary.category]}{" "}
              <span className="text-muted-foreground">· {summary.total}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {summary.mapped}/{summary.total} mapped · {summary.typedLinked}/
              {summary.total} typed-linked · {summary.officeLinked}/
              {summary.total} office-linked
            </p>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {rows
                .filter((row) => row.category === summary.category)
                .map((row) => (
                  <li className="rounded-xl border bg-card p-4" key={row.slug}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium">
                        {row.href ? (
                          <Link
                            className="underline underline-offset-4"
                            href={row.href}
                          >
                            {row.title}
                          </Link>
                        ) : (
                          row.title
                        )}
                      </p>
                      <Badge variant="outline">{row.mapMode}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{row.slug}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={row.inCatalog ? "secondary" : "destructive"}>
                        {row.inCatalog ? "Catalog: yes" : "Catalog: missing"}
                      </Badge>
                      <Badge
                        variant={row.mapped || row.mapMode === "office-only" ? "secondary" : "destructive"}
                      >
                        {row.mapMode === "office-only"
                          ? "Mapped: office-only"
                          : row.mapped
                            ? "Mapped: yes"
                            : "Mapped: missing"}
                      </Badge>
                      <Badge variant={row.typedLinkage ? "secondary" : "destructive"}>
                        Typed links: {row.directTypedLinks + row.officeLinks}
                      </Badge>
                      <Badge variant={row.officeLinked ? "secondary" : "outline"}>
                        Office-linked: {row.officeLinked ? "yes" : "no"}
                      </Badge>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
