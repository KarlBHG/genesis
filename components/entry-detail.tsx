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
import { edgesFor, resolveSlug } from "@/lib/content";
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

function EdgeList({ edges, direction }: { edges: Edge[]; direction: "out" | "in" }) {
  if (edges.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {edges.map((edge) => {
        const other = direction === "out" ? edge.to : edge.from;
        const otherTitle = direction === "out" ? edge.toTitle : edge.fromTitle;
        const target = resolveSlug(other);
        return (
          <li key={`${edge.from}-${edge.relationship}-${edge.to}-${edge.asOf}-${edge.source}`} className="flex flex-col gap-1">
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
                <span className="text-muted-foreground"> · {formatDate(edge.asOf)}</span>
              ) : null}
            </p>
            <p className="text-sm text-muted-foreground">{edge.quotation}</p>
            <a className="text-sm break-all" href={edge.source} rel="noreferrer" target="_blank">
              {edge.source}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function EntryDetail({ entry }: { entry: Entry }) {
  const section = kindLabel(entry.kind);
  const { out, inn } = edgesFor(entry.slug);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumb>
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
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
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
      </header>
      <MarkdownBody source={entry.body} />
      <Record entry={entry} />
      {out.length > 0 || inn.length > 0 ? (
        <>
          <Separator />
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-medium">Connections</h2>
            <div className="flex flex-col gap-4">
              <EdgeList direction="out" edges={out} />
              <EdgeList direction="in" edges={inn} />
            </div>
          </section>
        </>
      ) : null}
      <Separator />
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Related</h2>
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
            <a href={entry.source} rel="noreferrer" target="_blank">
              {entry.source}
            </a>
          </p>
        ) : null}
      </section>
    </article>
  );
}
