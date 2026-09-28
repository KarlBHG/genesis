import Link from "next/link";

import { MarkdownBody } from "@/components/markdown-body";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  edgesFor,
  getAudits,
  getContradictions,
  resolveSlug,
} from "@/lib/content";
import { groupEdges } from "@/lib/connection-groups";
import { uniqueProgramNullReasons } from "@/lib/invoice-budget";
import { compareAsOf } from "@/lib/as-of";
import { AsOfChip } from "@/components/as-of-chip";
import { factStrip } from "@/lib/entry-facts";
import { formatDate, kindLabel, kindPath, labelize } from "@/lib/format";
import type { Edge, Entry } from "@/lib/types";

function Fact({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ParentValue({ parent }: { parent: string }) {
  if (!parent || parent === "none" || parent === "independent") {
    return <span>{labelize(parent || "none")}</span>;
  }
  const target = resolveSlug(parent);
  if (!target) {
    return <Badge variant="outline">Unresolved reference: {parent}</Badge>;
  }
  return <Link href={target.href}>{target.title}</Link>;
}

function Record({ entry }: { entry: Entry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entry.kind === "treaty" ? (
            <>
              <Fact term="Signed">{formatDate(entry.signed)}</Fact>
              <Fact term="Effective">{formatDate(entry.effective)}</Fact>
              <Fact term="Status">{labelize(entry.status)}</Fact>
              <Fact term="Parties">{entry.parties.join(", ") || "Not stated"}</Fact>
              <Fact term="Topics">
                <span className="flex flex-wrap gap-1">
                  {entry.topics.map((topic) => (
                    <Badge key={topic} variant="outline">
                      {labelize(topic)}
                    </Badge>
                  ))}
                </span>
              </Fact>
            </>
          ) : null}
          {entry.kind === "institution" ? (
            <>
              <Fact term="Founded">{formatDate(entry.founded)}</Fact>
              <Fact term="Role">{labelize(entry.role)}</Fact>
              <Fact term="Parent">
                <ParentValue parent={entry.parent} />
              </Fact>
              <Fact term="Website">
                {entry.website ? (
                  <a href={entry.website} rel="noreferrer" target="_blank">
                    {entry.website.replace(/^https:\/\//, "")}
                  </a>
                ) : (
                  "Not stated"
                )}
              </Fact>
            </>
          ) : null}
          {entry.kind === "event" ? (
            <>
              <Fact term="Date">{formatDate(entry.date)}</Fact>
              <Fact term="Type">{labelize(entry.type)}</Fact>
            </>
          ) : null}
          {entry.kind === "sector" ? (
            <Fact term="Area">{labelize(entry.area)}</Fact>
          ) : null}
          {entry.kind === "flow" ? (
            <Fact term="Year">{entry.year}</Fact>
          ) : null}
          {entry.kind === "player" ? (
            <>
              <Fact term="Type">{labelize(entry.playerType)}</Fact>
              <Fact term="Role">{entry.role}</Fact>
              <Fact term="As of">
                {entry.asOf ? formatDate(entry.asOf) : "Not dated on the source page"}
              </Fact>
              <Fact term="Website">
                {entry.website ? (
                  <a href={entry.website} rel="noreferrer" target="_blank">
                    {entry.website.replace(/^https:\/\//, "")}
                  </a>
                ) : (
                  "Not stated"
                )}
              </Fact>
            </>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

function Related({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) {
    return <p className="text-sm text-muted-foreground">None recorded.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {slugs.map((slug) => {
        const target = resolveSlug(slug);
        if (!target) {
          return (
            <li key={slug}>
              <Badge variant="outline">Unresolved reference: {slug}</Badge>
            </li>
          );
        }
        return (
          <li key={slug}>
            <Link className="underline underline-offset-4" href={target.href}>
              {target.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function EdgeRow({ edge, slug }: { edge: Edge; slug: string }) {
  const outward = edge.from === slug;
  const other = outward ? edge.to : edge.from;
  const otherTitle = outward ? edge.toTitle : edge.fromTitle;
  const target = resolveSlug(other);
  return (
    <li
      key={`${edge.from}-${edge.relationship}-${edge.to}-${edge.asOf}-${edge.source}`}
      className="flex flex-col gap-1"
    >
      <p>
        <Badge variant="outline">{labelize(edge.relationship)}</Badge>{" "}
        {target ? (
          <Link className="underline underline-offset-4" href={target.href}>
            {otherTitle}
          </Link>
        ) : (
          otherTitle
        )}
        {edge.relationship === "holds-office" && edge.organizationTitle ? (
          <span> · {edge.organizationTitle}</span>
        ) : null}
        {edge.asOf ? (
          <span className="text-muted-foreground">
            {" "}
            · <AsOfChip asOf={edge.asOf} />
          </span>
        ) : null}
        {edge.relationship === "pays" && edge.program ? (
          <span className="text-muted-foreground">
            {" "}
            · Program{" "}
            {resolveSlug(edge.program) ? (
              <Link
                className="underline underline-offset-4"
                href={resolveSlug(edge.program)!.href}
              >
                {edge.programTitle ?? edge.program}
              </Link>
            ) : (
              edge.programTitle ?? edge.program
            )}
          </span>
        ) : null}
      </p>
      <p className="entry-quotation text-sm text-muted-foreground">
        {edge.quotation}
      </p>
      <a
        className="print-literal-url text-sm break-all"
        href={edge.source}
        rel="noreferrer"
        target="_blank"
      >
        {edge.source}
      </a>
    </li>
  );
}

/** The counterparties in a group, so a closed row still says who is inside. */
function groupPreview(edges: Edge[], slug: string): string {
  const names: string[] = [];
  for (const edge of edges) {
    const name = edge.from === slug ? edge.toTitle : edge.fromTitle;
    if (!names.includes(name)) names.push(name);
  }
  const shown = names.slice(0, 3).join(" · ");
  const rest = names.length - 3;
  return rest > 0 ? `${shown} · +${rest} more` : shown;
}

/**
 * Groups stay closed once a section is long enough to become a scroll cliff
 * on a phone. Short sections open on load so nothing needs a tap to read.
 */
const OPEN_BY_DEFAULT_UP_TO = 5;

function EdgeSection({
  title,
  edges,
  slug,
}: {
  title: string;
  edges: Edge[];
  slug: string;
}) {
  if (edges.length === 0) return null;
  const sorted = edges.slice().sort((a, b) => compareAsOf(a.asOf, b.asOf));
  const groups = groupEdges(sorted, "relationship");
  const openByDefault = edges.length <= OPEN_BY_DEFAULT_UP_TO;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-medium">
        {title} · {edges.length}
      </h3>
      {groups.map((group) => (
        <details
          className="entry-edge-group rounded-lg border px-4"
          key={group.key}
          open={openByDefault}
        >
          <summary className="cursor-pointer list-none py-2.5 [&::-webkit-details-marker]:hidden">
            <span className="flex flex-col gap-0.5 text-sm">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{labelize(group.key)}</span>
                <Badge variant="outline">{group.edges.length}</Badge>
              </span>
              <span className="entry-edge-preview line-clamp-1 text-muted-foreground">
                {groupPreview(group.edges, slug)}
              </span>
            </span>
          </summary>
          <ul className="flex flex-col gap-3 pb-3">
            {group.edges.map((edge) => (
              <EdgeRow
                edge={edge}
                key={`${edge.from}-${edge.relationship}-${edge.to}-${edge.asOf}`}
                slug={slug}
              />
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

function EvidenceNotice({ slug }: { slug: string }) {
  const contradictions = getContradictions().filter((record) =>
    record.entries.includes(slug),
  );
  const audits = getAudits().filter((record) =>
    record.entries.includes(slug),
  );
  if (contradictions.length === 0 && audits.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Disputed or audited</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {contradictions.length > 0 ? (
          <p>
            {contradictions.length}{" "}
            {contradictions.length === 1 ? "contradiction" : "contradictions"}{" "}
            on file: two sourced sentences that disagree.{" "}
            <Link className="underline underline-offset-4" href="/anomalies#contradictions">
              Read both sides
            </Link>
            .
          </p>
        ) : null}
        {audits.map((audit) => (
          <p className="text-muted-foreground" key={audit.id}>
            Ríkisendurskoðun, {formatDate(audit.published)}: “{audit.quotation}”{" "}
            <a
              className="break-all underline underline-offset-4"
              href={audit.source}
              rel="noreferrer"
              target="_blank"
            >
              Source
            </a>
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function PaysProgramNullNotice({ slug }: { slug: string }) {
  const { out, inn } = edgesFor(slug);
  const reasons = uniqueProgramNullReasons([...out, ...inn]);
  if (reasons.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ledger prints no program</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        {reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </CardContent>
    </Card>
  );
}

function FactStrip({ entry }: { entry: Entry }) {
  return (
    <dl className="entry-fact-strip flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {factStrip(entry).map((fact) => (
        <div className="flex items-baseline gap-1.5" key={fact.term}>
          <dt className="text-muted-foreground">{fact.term}</dt>
          <dd className="font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EntryDetail({ entry }: { entry: Entry }) {
  const section = kindLabel(entry.kind);
  const { out, inn } = edgesFor(entry.slug);

  return (
    <article className="atlas-page mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <p className="print-only">
        AlltÍkerfi · {kindPath(entry.kind)}/{entry.slug}
      </p>
      <Breadcrumb className="print:hidden">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/overview" />}>Overview</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={kindPath(entry.kind)} />}>
              {section}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{entry.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <header className="glass-panel atlas-page-header flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <p className="text-sm text-muted-foreground">{labelize(entry.kind)}</p>
          <Button
            nativeButton={false}
            render={<Link href={kindPath(entry.kind)} />}
            size="sm"
            variant="outline"
          >
            Back to {kindLabel(entry.kind).toLowerCase()}
          </Button>
          <Button
            nativeButton={false}
            render={
              <a download={`${entry.slug}.json`} href={`/api/entry/${entry.slug}`} />
            }
            size="sm"
            variant="outline"
          >
            Export JSON
          </Button>
        </div>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          {entry.title}
        </h1>
        {entry.lede ? (
          <p className="max-w-2xl font-serif text-xl leading-8">{entry.lede}</p>
        ) : entry.summary ? (
          <div className="flex max-w-2xl flex-col gap-1">
            <p className="text-lg leading-8 text-muted-foreground">
              {entry.summary}
            </p>
            <p className="text-xs text-muted-foreground">
              Opening paragraph of the record, extracted automatically. No
              authored lede yet.
            </p>
          </div>
        ) : null}
        <FactStrip entry={entry} />
      </header>
      <EvidenceNotice slug={entry.slug} />
      <PaysProgramNullNotice slug={entry.slug} />
      <MarkdownBody source={entry.body} />
      <Record entry={entry} />
      {out.length > 0 || inn.length > 0 ? (
        <>
          <Separator />
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-medium">Connections</h2>
              <Link
                className="text-sm text-muted-foreground underline underline-offset-4 print:hidden"
                href={`/connections?entry=${entry.slug}`}
              >
                Open in connections index
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <EdgeSection edges={out} slug={entry.slug} title="Outgoing" />
              <EdgeSection edges={inn} slug={entry.slug} title="Incoming" />
            </div>
          </section>
        </>
      ) : null}
      <Separator />
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Reading suggestions</h2>
        {entry.related.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Untyped links from this record&apos;s Markdown. They are reading
            suggestions only — not sourced graph edges. Typed connections appear
            in Connections above and on the map.
          </p>
        ) : null}
        <Related slugs={entry.related} />
      </section>
      <Separator />
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Sources</h2>
        {entry.sources ? (
          <MarkdownBody source={entry.sources} />
        ) : (
          <p className="text-sm text-muted-foreground">No sources recorded.</p>
        )}
        {entry.kind === "treaty" && !entry.sources.includes(entry.source) ? (
          <p>
            <a
              className="print-literal-url"
              href={entry.source}
              rel="noreferrer"
              target="_blank"
            >
              {entry.source}
            </a>
          </p>
        ) : null}
      </section>
    </article>
  );
}
