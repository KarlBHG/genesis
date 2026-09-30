import type { Metadata } from "next";
import Link from "next/link";

import { CompareForm } from "@/components/compare-form";
import { MarkdownBody } from "@/components/markdown-body";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { icelandicLang } from "@/lib/lang";
import type { Entry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare two entries from the Iceland system map side by side.",
};

function pick(entries: Entry[], slug: string | undefined, fallback: string): Entry {
  const chosen = slug ? entries.find((entry) => entry.slug === slug) : undefined;
  return chosen ?? entries.find((entry) => entry.slug === fallback) ?? entries[0];
}

function Column({ entry, side }: { entry: Entry; side: string }) {
  const facts = factsFor(entry);
  return (
    <article className="folio-phase" data-compare-column="" data-compare-side={side}>
      <p className="folio-index-meta">{side}</p>
      <h2 className="font-serif text-xl font-medium tracking-tight">
        <Link className="underline-offset-4 hover:underline" href={hrefFor(entry)}>
          {entry.title}
        </Link>
      </h2>
      <dl className="folio-gutter grid grid-cols-1 gap-0">
        {facts.map((fact) => (
          <div className="flex flex-col gap-1" key={fact.label}>
            <dt className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {fact.label}
            </dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="min-w-0">
        <MarkdownBody source={entry.body} />
      </div>
    </article>
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
    <ul className="flex min-w-0 flex-col">
      {touches.map((touch) => {
        const target = resolveSlug(touch.otherSlug);
        const verb =
          touch.direction === "out"
            ? labelize(touch.relationship)
            : `${labelize(touch.relationship)} from`;
        return (
          <li className="folio-pair flex flex-col gap-1" key={touch.key}>
            <p className="folio-index-meta">{verb}</p>
            <p>
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
            <p
              className="text-sm break-words text-muted-foreground"
              lang={icelandicLang(touch.note) ?? undefined}
            >
              {touch.note}
            </p>
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
    <main className="dashboard-canvas min-w-0">
      <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
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
        <header className="flex max-w-reading flex-col gap-2">
          <p className="kicker">Two records · one pair</p>
          <h1 className="display-title text-3xl sm:text-4xl">Compare</h1>
          <p className="text-base leading-7 text-muted-foreground">
            Two entries side by side. Figures stay in the wording of each summary. A connection is shared only when both entries have the same relationship to the same other entry. Two invoices on that pair stay two rows.
          </p>
        </header>
        <CompareForm left={left.slug} options={options} right={right.slug} />
        {same ? (
          <p className="folio-note text-sm text-muted-foreground">Choose two different entries.</p>
        ) : (
          <>
            <section
              aria-label="Compared entries"
              className="compare-spread grid grid-cols-1 gap-0 lg:grid-cols-2"
            >
              <Column entry={left} side="First entry" />
              <Column entry={right} side="Second entry" />
            </section>
            <section className="flex flex-col gap-1">
              <h2 className="reading-head">Differences</h2>
              <ul className="flex flex-col">
                {rows.map((row) => (
                  <li className="folio-pair flex flex-col gap-2" key={row.label}>
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-medium">{row.label}</span>
                      <span className="folio-index-meta">
                        {row.same ? "Same" : "Different"}
                      </span>
                    </p>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      <p data-compare-side="First" data-compare-value="">
                        {row.left}
                      </p>
                      <p data-compare-side="Second" data-compare-value="">
                        {row.right}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="flex flex-col gap-1">
              <h2 className="reading-head">Shared connections</h2>
              {shared.length === 0 ? (
                <p className="folio-note text-sm text-muted-foreground">
                  No typed connection points at the same entry in the same direction.
                </p>
              ) : (
                <ul className="flex flex-col">
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
                      <li className="folio-pair flex flex-col gap-1" key={`${touch.key}::${other.key}`}>
                        <p className="folio-index-meta">Shared</p>
                        <p>
                          {touch.direction === "out" ? (
                            <>
                              <span className="font-medium">{labelize(touch.relationship)}</span>{" "}
                              {name}
                            </>
                          ) : (
                            <>
                              {name} {labelize(touch.relationship).toLowerCase()} both
                            </>
                          )}
                        </p>
                        <p
                          className="text-sm break-words text-muted-foreground"
                          lang={icelandicLang(touch.note) ?? undefined}
                        >
                          {touch.note}
                        </p>
                        {other.note !== touch.note ? (
                          <p
                            className="text-sm break-words text-muted-foreground"
                            lang={icelandicLang(other.note) ?? undefined}
                          >
                            {other.note}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section
              aria-label="Connections only on one side"
              className="compare-spread grid grid-cols-1 gap-0 lg:grid-cols-2"
            >
              <div className="folio-phase flex flex-col gap-2">
                <h2 className="reading-head">Only {left.title}</h2>
                <TouchList touches={leftOnly} />
              </div>
              <div className="folio-phase flex flex-col gap-2">
                <h2 className="reading-head">Only {right.title}</h2>
                <TouchList touches={rightOnly} />
              </div>
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="reading-head">Related entries</h2>
              <p className="text-sm text-muted-foreground">
                These are the related links on each page, separate from typed connections.
              </p>
              <div className="compare-spread grid grid-cols-1 gap-0 lg:grid-cols-3">
                <RelatedGroup slugs={sharedRelated} title="On both" />
                <RelatedGroup slugs={leftRelatedOnly} title={`Only ${left.title}`} />
                <RelatedGroup slugs={rightRelatedOnly} title={`Only ${right.title}`} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function RelatedGroup({ slugs, title }: { slugs: string[]; title: string }) {
  return (
    <div className="folio-phase flex flex-col gap-2">
      <h3 className="folio-index-meta">{title}</h3>
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
                  <span className="text-sm text-muted-foreground">
                    Unresolved reference: {slug}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
