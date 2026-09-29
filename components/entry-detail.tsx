import Link from "next/link";

import { CitationClaim, CitationGutter } from "@/components/citation-gutter";
import { ExternalLink } from "@/components/external-link";
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
import { edgeKey } from "@/components/connection-graph";
import { EdgeRow, EgoNetwork, egoLayout, type EdgeRowSide } from "@/components/viz";
import {
  edgesFor,
  getAudits,
  getContradictions,
  getEdges,
  resolveSlug,
} from "@/lib/content";
import { groupEdges } from "@/lib/connection-groups";
import { kennitalaFor } from "@/lib/identifiers";
import { uniqueProgramNullReasons } from "@/lib/invoice-budget";
import { compareAsOf } from "@/lib/as-of";
import { PrintPlateColophon, PrintPlateHead } from "@/components/print-plate";
import { entryAsOfValue, factStrip, kindNoun } from "@/lib/entry-facts";
import { mapFocusHref } from "@/lib/map-focus";
import { formatDate, kindLabel, kindPath, labelize } from "@/lib/format";
import {
  SOE_OWNERSHIP_STATUS_LABELS,
  isInventoryPublicCompanyOrFund,
  soeOwnershipFor,
} from "@/lib/ownership";
import {
  PARENT_MINISTRY_STATUS_LABELS,
  isParentMinistryScope,
  parentMinistryFor,
} from "@/lib/parent-ministry";
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

function ParentValue({ parent, inScope }: { parent: string; inScope: boolean }) {
  if (!parent || parent === "none") {
    if (inScope) {
      return <Badge variant="outline">empty parent</Badge>;
    }
    return <span>{labelize(parent || "none")}</span>;
  }
  if (parent === "independent") {
    return <span>{labelize(parent)}</span>;
  }
  const target = resolveSlug(parent);
  if (!target) {
    return <Badge variant="outline">Unresolved reference: {parent}</Badge>;
  }
  return <Link href={target.href}>{target.title}</Link>;
}

function KennitalaFact({ slug }: { slug: string }) {
  const record = kennitalaFor(slug);
  if (!record) return null;
  return (
    <CitationClaim
      gutter={
        <CitationGutter
          quotation={record.quotation}
          source={record.source}
        />
      }
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Kennitala
      </p>
      <p className="font-mono tabular-nums">{record.kennitala}</p>
    </CitationClaim>
  );
}

function ParentMinistryFact({ slug }: { slug: string }) {
  if (!isParentMinistryScope(slug)) return null;
  const row = parentMinistryFor(slug);
  if (!row) return null;
  return (
    <Fact term="Parent ministry">
      <Badge variant={row.status === "sourced" ? "secondary" : "outline"}>
        {PARENT_MINISTRY_STATUS_LABELS[row.status]}
      </Badge>
      {row.statements.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm leading-6">
          {row.statements.map((statement) => (
            <li key={statement.href}>
              <Link className="underline underline-offset-4" href={statement.href}>
                {statement.fromTitle}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                · {labelize(statement.relationship)} · {statement.asOf}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Empty parent. No cited ministry, statute, or about page prints a
          regulates, appoints, or owns parent. MFA represents does not fill
          this.{" "}
          <Link
            className="underline underline-offset-4"
            href="/public-entities#parent-ministry"
          >
            Parent-ministry checklist
          </Link>
          .
        </p>
      )}
    </Fact>
  );
}

function OwnershipFact({ slug }: { slug: string }) {
  if (!isInventoryPublicCompanyOrFund(slug)) return null;
  const row = soeOwnershipFor(slug);
  if (!row) return null;
  return (
    <Fact term="Ownership statements">
      <Badge
        variant={
          row.status === "sourced"
            ? "secondary"
            : row.status === "contradiction-only"
              ? "outline"
              : "destructive"
        }
      >
        {SOE_OWNERSHIP_STATUS_LABELS[row.status]}
      </Badge>
      {row.statements.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm leading-6">
          {row.statements.map((statement) => (
            <li key={statement.href}>
              <Link className="underline underline-offset-4" href={statement.href}>
                {statement.interestedPartyTitle}
              </Link>
              <span className="text-muted-foreground"> · {statement.asOf}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          No sourced owns row names this company as its subject. Appoints and
          regulates stay on their own lines.{" "}
          <Link
            className="underline underline-offset-4"
            href="/public-entities#ownership"
          >
            Ownership checklist
          </Link>
          .
        </p>
      )}
    </Fact>
  );
}

function Record({ entry }: { entry: Entry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                <ParentValue
                  inScope={isParentMinistryScope(entry.slug)}
                  parent={entry.parent}
                />
              </Fact>
              <Fact term="Website">
                {entry.website ? (
                  <ExternalLink href={entry.website}>
                    {entry.website.replace(/^https:\/\//, "")}
                  </ExternalLink>
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
                  <ExternalLink href={entry.website}>
                    {entry.website.replace(/^https:\/\//, "")}
                  </ExternalLink>
                ) : (
                  "Not stated"
                )}
              </Fact>
            </>
          ) : null}
          <OwnershipFact slug={entry.slug} />
          <ParentMinistryFact slug={entry.slug} />
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
  side,
}: {
  title: string;
  edges: Edge[];
  slug: string;
  side: EdgeRowSide;
}) {
  if (edges.length === 0) return null;
  const sorted = edges.slice().sort((a, b) => compareAsOf(a.asOf, b.asOf));
  const groups = groupEdges(sorted, "relationship");
  const openByDefault = edges.length <= OPEN_BY_DEFAULT_UP_TO;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="reading-head text-lg">
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
          <ul className="flex flex-col pb-3">
            {group.edges.map((edge) => (
              <EdgeRow
                edge={edge}
                key={edgeKey(edge)}
                program="chip"
                side={side}
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
    <section className="flex flex-col gap-3">
      <h2 className="reading-head text-lg">Disputed or audited</h2>
      {contradictions.length > 0 ? (
        <p className="text-sm leading-6">
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
        <CitationClaim
          key={audit.id}
          gutter={
            <CitationGutter
              asOf={audit.published}
              quotation={audit.quotation}
              source={audit.source}
            />
          }
        >
          <p className="text-sm leading-6">
            Ríkisendurskoðun, {formatDate(audit.published)}
          </p>
        </CitationClaim>
      ))}
    </section>
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
    <dl className="entry-fact-strip">
      {factStrip(entry).map((fact) => (
        <div className="flex flex-col gap-0.5" key={fact.term}>
          <dt>{fact.term}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EntryDetail({ entry }: { entry: Entry }) {
  const section = kindLabel(entry.kind);
  const { out, inn } = edgesFor(entry.slug);
  const mapHref = mapFocusHref(entry.slug);
  const ego = egoLayout(entry.slug, getEdges());

  return (
    <article className="atlas-page mx-auto flex w-full max-w-folio flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <PrintPlateHead
        asOf={entryAsOfValue(entry)}
        kind={kindNoun(entry.kind)}
        pathname={kindPath(entry.kind)}
        slug={entry.slug}
      />
      <Breadcrumb className="max-w-reading print:hidden">
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
      <header className="glass-panel atlas-page-header entry-masthead max-w-reading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="kicker fade-rise">{labelize(entry.kind)}</p>
          <p className="entry-running-head fade-rise print:hidden">
            {kindPath(entry.kind)}/{entry.slug}
          </p>
        </div>
        <h1 className="display-title hero-display text-[2.15rem] leading-[0.98] text-balance sm:text-5xl lg:text-[3.35rem]">
          {entry.title}
        </h1>
        {entry.lede ? (
          <p className="standfirst fade-rise-3">{entry.lede}</p>
        ) : entry.summary ? (
          <div className="fade-rise-3 flex max-w-lede flex-col gap-1">
            <p className="standfirst-body">
              {entry.summary}
            </p>
            <p className="text-xs text-muted-foreground">
              Opening paragraph of the record, extracted automatically. No
              authored lede yet.
            </p>
          </div>
        ) : null}
        <FactStrip entry={entry} />
        <div className="fade-rise-4 flex flex-wrap items-center gap-2 print:hidden">
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
          {mapHref ? (
            <Button
              nativeButton={false}
              render={<Link href={mapHref} />}
              size="sm"
              variant="outline"
            >
              Open on map
            </Button>
          ) : null}
        </div>
      </header>
      <EvidenceNotice slug={entry.slug} />
      <div className="max-w-reading">
        <PaysProgramNullNotice slug={entry.slug} />
      </div>
      <div className="max-w-reading">
        <MarkdownBody source={entry.body} />
      </div>
      <div className="max-w-reading">
        <Record entry={entry} />
      </div>
      <KennitalaFact slug={entry.slug} />
      {ego.nodes.length > 1 ? (
        <section className="flex max-w-reading flex-col gap-3 print:hidden">
          <h2 className="reading-head">Typed network (one hop)</h2>
          <p className="text-base leading-7 text-muted-foreground">
            Neighbours on the graph only. Untyped reading suggestions are not
            drawn here.
          </p>
          <EgoNetwork label={entry.title} layout={ego} />
        </section>
      ) : null}
      {out.length > 0 || inn.length > 0 ? (
        <>
          <Separator />
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="reading-head">Connections</h2>
              <Link
                className="text-sm text-muted-foreground underline underline-offset-4 print:hidden"
                href={`/connections?entry=${entry.slug}`}
              >
                Open in connections index
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <EdgeSection
                edges={out}
                side="outward"
                slug={entry.slug}
                title="Outgoing"
              />
              <EdgeSection
                edges={inn}
                side="inward"
                slug={entry.slug}
                title="Incoming"
              />
            </div>
          </section>
        </>
      ) : entry.proseOnly ? (
        <>
          <Separator />
          <section className="flex flex-col gap-2">
            <h2 className="reading-head">Connections</h2>
            <p className="text-base leading-7 text-muted-foreground">
              Prose only · no typed edge. A cited page supports this record, but
              no allowlisted relationship can be drawn from it without inventing a
              join.
            </p>
          </section>
        </>
      ) : null}
      <Separator />
      <section
        className="flex max-w-reading flex-col gap-3"
        data-reading-suggestions=""
      >
        <h2 className="reading-head">Reading suggestions</h2>
        {entry.related.length > 0 ? (
          <p className="text-base leading-7 text-muted-foreground">
            Untyped links from this record&apos;s Markdown. They are reading
            suggestions only — not sourced graph edges, and not citation
            sidenotes. Typed connections appear in Connections above and on the
            map.
          </p>
        ) : null}
        <Related slugs={entry.related} />
      </section>
      <Separator />
      <section className="flex max-w-reading flex-col gap-3">
        <h2 className="reading-head">Sources</h2>
        {entry.sources ? (
          <MarkdownBody source={entry.sources} />
        ) : (
          <p className="text-base leading-7 text-muted-foreground">No sources recorded.</p>
        )}
        {entry.kind === "treaty" && !entry.sources.includes(entry.source) ? (
          <p>
            <ExternalLink className="print-literal-url" href={entry.source}>
              {entry.source}
            </ExternalLink>
          </p>
        ) : null}
      </section>
      <PrintPlateColophon />
    </article>
  );
}
