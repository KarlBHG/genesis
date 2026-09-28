import type { Metadata } from "next";
import Link from "next/link";

import { edgeKey } from "@/components/connection-graph";
import { Badge } from "@/components/ui/badge";
import { getCatalog, getContradictions, getEdges, hrefFor, resolveSlug } from "@/lib/content";
import { GROUP_BY_VIEW, groupEdges } from "@/lib/connection-groups";
import { compareAsOf } from "@/lib/as-of";
import { AsOfChip } from "@/components/as-of-chip";
import { kindLabel, labelize } from "@/lib/format";
import { MAP_VIEWS, viewOf } from "@/lib/geo-map";
import { officeLabel, ownsRowNote, tradeValueNote } from "@/lib/notes";
import type { Edge, Kind } from "@/lib/types";
import { icelandicLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "Connections",
  description: "Typed public-record links between entries in the Iceland system map.",
};

const KIND_ORDER: Kind[] = ["treaty", "institution", "event", "sector", "flow", "player"];

function EdgeLine({ edge, note }: { edge: Edge; note: string | null }) {
  const from = resolveSlug(edge.from);
  const to = resolveSlug(edge.to);
  const org = resolveSlug(edge.organization ?? "");
  const targetTitle = officeLabel(edge);
  return (
    <li className="flex min-w-0 flex-col gap-1 border-b py-3">
      <p className="break-words">
        {from ? (
          <Link className="font-medium underline underline-offset-4" href={from.href}>
            {edge.fromTitle}
          </Link>
        ) : (
          edge.fromTitle
        )}{" "}
        <Badge variant="secondary">{labelize(edge.relationship)}</Badge>{" "}
        {to ? (
          <Link className="font-medium underline underline-offset-4" href={to.href}>
            {edge.relationship === "holds-office" ? edge.toTitle : targetTitle}
          </Link>
        ) : (
          edge.toTitle
        )}
        {edge.relationship === "holds-office" && edge.organizationTitle ? (
          <>
            {" · "}
            {org ? (
              <Link className="underline underline-offset-4" href={org.href}>
                {edge.organizationTitle}
              </Link>
            ) : (
              edge.organizationTitle
            )}
          </>
        ) : null}{" "}
        <span className="text-sm">
          · <AsOfChip asOf={edge.asOf} />
        </span>
      </p>
      <p className="break-words text-sm leading-6" lang={icelandicLang(edge.quotation)}>
        {edge.quotation}
      </p>
      {note ? <p className="break-words text-sm leading-6 text-muted-foreground">{note}</p> : null}
    </li>
  );
}

function ViewBody({
  viewId,
  edges,
  noteFor,
}: {
  viewId: string;
  edges: Edge[];
  noteFor: (edge: Edge) => string | null;
}) {
  const by = GROUP_BY_VIEW[viewId] ?? "none";
  if (by === "none") {
    return (
      <ul className="flex min-w-0 flex-col">
        {edges.map((edge) => (
          <EdgeLine edge={edge} key={edgeKey(edge)} note={noteFor(edge)} />
        ))}
      </ul>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {groupEdges(edges, by).map((group) => {
        const first = group.edges[0];
        if (!first) return null;
        const target = by === "from" ? resolveSlug(first.from) : null;
        const title =
          by === "from" ? first.fromTitle : labelize(first.relationship);
        return (
          <details
            className="min-w-0 rounded-lg border px-4"
            key={group.key}
            open
          >
            <summary className="cursor-pointer list-none py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex flex-wrap items-baseline gap-x-2">
                {target ? (
                  <Link
                    className="font-medium underline underline-offset-4"
                    href={target.href}
                  >
                    {title}
                  </Link>
                ) : (
                  <span className="font-medium">{title}</span>
                )}
                <Badge variant="outline">{group.edges.length}</Badge>
              </span>
            </summary>
            <ul className="flex min-w-0 flex-col pb-2">
              {group.edges.map((edge) => (
                <EdgeLine
                  edge={edge}
                  key={edgeKey(edge)}
                  note={noteFor(edge)}
                />
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string }>;
}) {
  const params = await searchParams;
  const focusSlug = params.entry?.trim() ?? "";
  const focusEntry = focusSlug ? resolveSlug(focusSlug) : null;
  const entries = getCatalog();
  const allEdges = getEdges();
  const edges =
    focusSlug.length > 0
      ? allEdges.filter(
          (edge) => edge.from === focusSlug || edge.to === focusSlug,
        )
      : allEdges;
  const contradictions = getContradictions();
  const drawn = new Set(allEdges.flatMap((edge) => [edge.from, edge.to]));
  const missing = entries
    .filter((entry) => !drawn.has(entry.slug))
    .sort((a, b) => {
      const kind = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
      if (kind !== 0) return kind;
      return a.title.localeCompare(b.title, "en");
    });
  const sortEdges = (list: Edge[]) =>
    list
      .slice()
      .sort(
        (a, b) =>
          a.fromTitle.localeCompare(b.fromTitle, "en") ||
          a.toTitle.localeCompare(b.toTitle, "en") ||
          compareAsOf(a.asOf, b.asOf) ||
          a.quotation.localeCompare(b.quotation),
      );
  const holdings = edges.filter((edge) => edge.relationship === "invests-in" && edge.channel != null);
  const byView = MAP_VIEWS.map((view) => ({
    ...view,
    edges: sortEdges(
      view.id === "careers"
        ? [...edges.filter((edge) => viewOf(edge.relationship) === view.id), ...holdings]
        : edges.filter((edge) => viewOf(edge.relationship) === view.id),
    ),
  }));
  const leftover = edges
    .filter((edge) => viewOf(edge.relationship) == null)
    .slice()
    .sort((a, b) => a.relationship.localeCompare(b.relationship) || a.fromTitle.localeCompare(b.fromTitle, "en"));

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-reading flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Seven views, the same buckets as the map. Each line is one typed relationship. Full names wrap. The budget drawing is on <Link className="underline underline-offset-4" href="/overview">Overview</Link>.
        </p>
        {focusSlug ? (
          <p className="text-sm text-muted-foreground">
            {focusEntry ? (
              <>
                Showing {edges.length} line{edges.length === 1 ? "" : "s"} involving{" "}
                <Link className="underline underline-offset-4" href={focusEntry.href}>
                  {focusEntry.title}
                </Link>
                .{" "}
                <Link className="underline underline-offset-4" href="/connections">
                  Clear filter
                </Link>
              </>
            ) : (
              <>
                No catalog entry for <code className="text-xs">{focusSlug}</code>.{" "}
                <Link className="underline underline-offset-4" href="/connections">
                  Show all connections
                </Link>
              </>
            )}
          </p>
        ) : null}
      </header>
      <nav aria-label="Connection views" className="flex flex-wrap gap-2">
        {byView.map((view) => (
          <a
            className="rounded-full border px-3 py-1.5 text-sm underline-offset-4 hover:underline"
            href={`#${view.id}`}
            key={view.id}
          >
            {view.label} · {view.edges.length}
          </a>
        ))}
      </nav>
      {byView.map((view) => (
        <section className="flex min-w-0 flex-col gap-2" id={view.id} key={view.id}>
          <h2 className="text-xl font-medium">
            {view.label} · {view.edges.length}
          </h2>
          {view.id === "spending" ? (
            <p className="text-sm text-muted-foreground">Each line is one invoice. Amounts are not added together.</p>
          ) : null}
          {view.id === "ownership" ? (
            <p className="text-sm text-muted-foreground">Owns only. Stakes are under Investments.</p>
          ) : null}
          {view.id === "careers" ? (
            <p className="text-sm text-muted-foreground">Dated personal holdings are listed here as well as under Investments. Ásgeir Jónsson has no dated appointment, so he is not on a line.</p>
          ) : null}
          <ViewBody
            edges={view.edges}
            noteFor={(edge) =>
              [tradeValueNote(edge.relationship), ownsRowNote(edge, contradictions)].filter(Boolean).join(" ") || null
            }
            viewId={view.id}
          />
        </section>
      ))}
      {leftover.length > 0 ? (
        <section className="flex min-w-0 flex-col gap-2" id="leftover">
          <h2 className="text-xl font-medium">Leftover · {leftover.length}</h2>
          <p className="text-sm text-muted-foreground">
            These typed lines are outside the seven views.
          </p>
          <ul className="flex min-w-0 flex-col">
            {leftover.map((edge) => (
              <EdgeLine edge={edge} key={edgeKey(edge)} note={null} />
            ))}
          </ul>
        </section>
      ) : null}
      {focusSlug ? null : (
        <>
          <p>
            <a className="underline underline-offset-4" href="#not-on-the-drawing">
              {missing.length} of {entries.length} entries are not on this drawing.
            </a>
          </p>
          <section className="flex flex-col gap-3" id="not-on-the-drawing">
            <h2 className="text-xl font-medium">Not on this drawing</h2>
            <p className="text-muted-foreground">
              These entries have no typed edge. Related links on their pages are not drawn here.
            </p>
            <ul className="flex flex-col gap-2">
              {missing.map((entry) => (
                <li className="flex flex-wrap items-baseline gap-2" key={entry.slug}>
                  <Link className="underline underline-offset-4" href={hrefFor(entry)}>
                    {entry.title}
                  </Link>
                  <span className="text-sm text-muted-foreground">{kindLabel(entry.kind)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a className="underline underline-offset-4" download="alltikerfi-catalog.json" href="/api/catalog">
          Download catalog JSON
        </a>
        <a className="underline underline-offset-4" download="alltikerfi-connections.csv" href="/api/connections">
          Download connections CSV
        </a>
      </p>
    </main>
  );
}
