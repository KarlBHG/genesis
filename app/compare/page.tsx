import type { Metadata } from "next";
import Link from "next/link";

import { CompareForm } from "@/components/compare-form";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_LEFT,
  DEFAULT_RIGHT,
  factRows,
  factsFor,
  onlyTouches,
  sharedTouches,
  touchesOf,
} from "@/lib/compare";
import { getCatalog, getEdges, hrefFor, resolveSlug } from "@/lib/content";
import { formatDate, labelize } from "@/lib/format";
import type { Entry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare two entries from the Iceland system map side by side.",
};

function pick(entries: Entry[], slug: string | undefined, fallback: string): Entry {
  const chosen = slug ? entries.find((entry) => entry.slug === slug) : undefined;
  return chosen ?? entries.find((entry) => entry.slug === fallback) ?? entries[0];
}

function Column({ entry }: { entry: Entry }) {
  const facts = factsFor(entry);
  return (
    <Card data-compare-column>
      <CardHeader>
        <CardTitle>
          <Link className="underline underline-offset-4" href={hrefFor(entry)}>
            {entry.title}
          </Link>
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-1">
          {facts.map((fact) => (
            <Badge key={fact.label} variant="outline">
              {fact.label}: {fact.value}
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MarkdownBody source={entry.body} />
      </CardContent>
    </Card>
  );
}

function TouchList({
  touches,
}: {
  touches: ReturnType<typeof touchesOf>;
}) {
  if (touches.length === 0) {
    return <p className="text-sm text-muted-foreground">None.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {touches.map((touch) => {
        const target = resolveSlug(touch.otherSlug);
        const verb =
          touch.direction === "out"
            ? labelize(touch.relationship)
            : `${labelize(touch.relationship)} from`;
        return (
          <li className="flex flex-col gap-1" key={touch.key}>
            <p>
              <Badge variant="secondary">{verb}</Badge>{" "}
              {target ? (
                <Link className="underline underline-offset-4" href={target.href}>
                  {touch.otherTitle}
                </Link>
              ) : (
                touch.otherTitle
              )}
              {touch.asOf ? (
                <span className="text-muted-foreground"> · {formatDate(touch.asOf)}</span>
              ) : null}
            </p>
            <p className="text-sm break-words text-muted-foreground">{touch.note}</p>
          </li>
        );
      })}
    </ul>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const params = await searchParams;
  const entries = getCatalog().slice().sort((a, b) => a.title.localeCompare(b.title, "en"));
  const left = pick(entries, params.left, DEFAULT_LEFT);
  const right = pick(entries, params.right, DEFAULT_RIGHT);
  const same = left.slug === right.slug;
  const edges = getEdges();
  const leftTouches = touchesOf(left.slug, edges);
  const rightTouches = touchesOf(right.slug, edges);
  const shared = sharedTouches(leftTouches, rightTouches);
  const leftOnly = onlyTouches(leftTouches, rightTouches);
  const rightOnly = onlyTouches(rightTouches, leftTouches);
  const rows = [
    ...factRows(factsFor(left), factsFor(right)),
    {
      label: "Summary",
      left: left.summary,
      right: right.summary,
      same: left.summary === right.summary,
    },
  ];
  const sharedRelated = left.related.filter((slug) => right.related.includes(slug));
  const leftRelatedOnly = left.related.filter((slug) => !right.related.includes(slug));
  const rightRelatedOnly = right.related.filter((slug) => !left.related.includes(slug));
  const options = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    kind: entry.kind,
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Overview</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Compare</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Compare</h1>
        <p className="text-muted-foreground">
          Two entries side by side. Figures stay in the wording of each summary. A connection is shared only when both entries have the same relationship to the same other entry.
        </p>
      </header>
      <CompareForm left={left.slug} options={options} right={right.slug} />
      {same ? (
        <p className="text-sm text-muted-foreground">Choose two different entries.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Column entry={left} />
            <Column entry={right} />
          </div>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-medium">Differences</h2>
            <ul className="flex flex-col gap-3">
              {rows.map((row) => (
                <li className="rounded-lg border p-3" key={row.label}>
                  <p className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.label}</span>
                    <Badge variant={row.same ? "secondary" : "outline"}>
                      {row.same ? "Same" : "Different"}
                    </Badge>
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <p>{row.left}</p>
                    <p>{row.right}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-medium">Shared connections</h2>
            {shared.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No typed connection points at the same entry in the same direction.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {shared.map(({ left: touch, right: other }) => {
                  const target = resolveSlug(touch.otherSlug);
                  const name = target ? (
                    <Link className="underline underline-offset-4" href={target.href}>
                      {touch.otherTitle}
                    </Link>
                  ) : (
                    touch.otherTitle
                  );
                  return (
                    <li className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-400/10" key={touch.key}>
                      <p>
                        <Badge>Shared</Badge>{" "}
                        {touch.direction === "out" ? (
                          <>
                            <Badge variant="outline">{labelize(touch.relationship)}</Badge> {name}
                          </>
                        ) : (
                          <>
                            {name} {labelize(touch.relationship).toLowerCase()} both
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-sm break-words text-muted-foreground">{touch.note}</p>
                      {other.note !== touch.note ? (
                        <p className="mt-1 text-sm break-words text-muted-foreground">{other.note}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Only {left.title}</h2>
              <TouchList touches={leftOnly} />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Only {right.title}</h2>
              <TouchList touches={rightOnly} />
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-medium">Related entries</h2>
            <p className="text-sm text-muted-foreground">
              These are the related links on each page, separate from typed connections.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <RelatedGroup slugs={sharedRelated} title="On both" />
              <RelatedGroup slugs={leftRelatedOnly} title={`Only ${left.title}`} />
              <RelatedGroup slugs={rightRelatedOnly} title={`Only ${right.title}`} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function RelatedGroup({ slugs, title }: { slugs: string[]; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {slugs.length === 0 ? (
        <p className="text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {slugs.map((slug) => {
            const target = resolveSlug(slug);
            return (
              <li key={slug}>
                {target ? (
                  <Link className="underline underline-offset-4" href={target.href}>
                    {target.title}
                  </Link>
                ) : (
                  <Badge variant="outline">Unresolved reference: {slug}</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
