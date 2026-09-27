import type { Metadata } from "next";
import Link from "next/link";

import { edgeKey } from "@/components/connection-graph";
import { Badge } from "@/components/ui/badge";
import { getCatalog, getContradictions, getEdges, hrefFor, resolveSlug } from "@/lib/content";
import { formatDate, kindLabel, labelize } from "@/lib/format";
import { MAP_VIEWS, viewOf } from "@/lib/geo-map";
import { officeLabel, ownsRowNote, tradeValueNote } from "@/lib/notes";
import type { Edge, Kind } from "@/lib/types";

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
        ) : null}
        <span className="text-sm text-muted-foreground"> · {formatDate(edge.asOf)}</span>
      </p>
      <p className="break-words text-sm leading-6">{edge.quotation}</p>
      {note ? <p className="break-words text-sm leading-6 text-muted-foreground">{note}</p> : null}
    </li>
  );
}

export default function ConnectionsPage() {
  const entries = getCatalog();
  const edges = getEdges();
  const contradictions = getContradictions();
  const drawn = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
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
      .sort((a, b) => a.fromTitle.localeCompare(b.fromTitle, "en") || a.toTitle.localeCompare(b.toTitle, "en") || a.asOf.localeCompare(b.asOf) || a.quotation.localeCompare(b.quotation));
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
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Seven views, the same buckets as the map. Each line is one typed relationship. Full names wrap. The budget drawing is on <Link className="underline underline-offset-4" href="/overview">Overview</Link>.
        </p>
      </header>
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
          <ul className="flex min-w-0 flex-col">
            {view.edges.map((edge) => (
              <EdgeLine
                edge={edge}
                key={edgeKey(edge)}
                note={[tradeValueNote(edge.relationship), ownsRowNote(edge, contradictions)].filter(Boolean).join(" ") || null}
              />
            ))}
          </ul>
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
