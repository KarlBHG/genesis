import type { Metadata } from "next";
import Link from "next/link";

import { ConnectionGroupedPanels, edgeKey } from "@/components/connection-graph";
import { HashScroll } from "@/components/hash-scroll";
import { PageHero } from "@/components/page-hero";
import { EdgeRow } from "@/components/viz";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCatalog, getContradictions, getEdges, hrefFor, resolveSlug } from "@/lib/content";
import { GROUP_BY_VIEW } from "@/lib/connection-groups";
import { compareAsOf } from "@/lib/as-of";
import { kindLabel } from "@/lib/format";
import { MAP_VIEWS, viewOf } from "@/lib/geo-map";
import { ownsRowNote, tradeValueNote } from "@/lib/notes";
import type { Edge, Kind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Connections",
  description: "Typed public-record links between entries in the Iceland system map.",
};

const KIND_ORDER: Kind[] = ["treaty", "institution", "event", "sector", "flow", "player"];

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
  const renderEdge = (edge: Edge) => (
    <EdgeRow
      edge={edge}
      key={edgeKey(edge)}
      note={noteFor(edge)}
      program="chip"
      showSource
    />
  );
  if (by === "none") {
    return (
      <ul className="flex min-w-0 flex-col">
        {edges.map((edge) => renderEdge(edge))}
      </ul>
    );
  }
  return (
    <ConnectionGroupedPanels
      edges={edges}
      groupBy={by}
      renderEdge={renderEdge}
    />
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
    <main className="dashboard-canvas min-w-0">
      <HashScroll />
      <PageHero
        description={
          <>
            The same buckets as the map. Authorisations, invoices, and contracts are
            separate money phases — a permission to spend is not a payment, and a
            power-purchase line is not an invoice. Each line is one typed
            relationship with its own page. Full names wrap. The budget drawing is on{" "}
            <Link className="underline underline-offset-4" href="/overview">Overview</Link>.
          </>
        }
        eyebrow="Typed public record"
        title="Connections"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-8 px-4 py-10 sm:px-6">
        {focusSlug ? (
          <p className="max-w-reading text-sm text-muted-foreground">
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
      <nav aria-label="Connection views" className="flex flex-wrap gap-2">
        {byView.map((view) => (
          <a
            className="rounded-md border px-3 py-1.5 text-sm underline-offset-4 transition-colors hover:bg-muted hover:underline"
            href={`#${view.id}`}
            key={view.id}
          >
            {view.label} · {view.edges.length}
          </a>
        ))}
      </nav>
      {byView.map((view) => (
        <section className="flex min-w-0 scroll-mt-24 flex-col gap-2" id={view.id} key={view.id}>
          <h2 className="text-xl font-medium">
            {view.label} · {view.edges.length}
          </h2>
          {view.id === "authorisations" ? (
            <p className="text-sm text-muted-foreground">
              Article 4 ceilings. A permission to spend, not a payment.
            </p>
          ) : null}
          {view.id === "spending" ? (
            <p className="text-sm text-muted-foreground">
              Each line is one Opnir reikningar invoice. Salaries, foreign-currency
              payments, and grants are not on that ledger. Amounts are not added
              together.
            </p>
          ) : null}
          {view.id === "contracts" ? (
            <p className="text-sm text-muted-foreground">
              Power-purchase agreements and Hagstofa import/export commodity rows.
              Not invoices.
            </p>
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
            These typed lines are outside the map views.
          </p>
          <ul className="flex min-w-0 flex-col">
            {leftover.map((edge) => (
              <EdgeRow edge={edge} key={edgeKey(edge)} note={null} showSource />
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
              Where a cited page still does not support an allowlisted relationship, the record
              is labelled prose-only instead of left unexplained.
            </p>
            <Table>
              <TableCaption>
                Catalog records with no typed edge on this drawing. Related links on
                their pages are not edges.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missing.map((entry) => (
                  <TableRow key={entry.slug}>
                    <TableCell className="whitespace-normal">
                      <Link className="underline underline-offset-4" href={hrefFor(entry)}>
                        {entry.title}
                      </Link>
                    </TableCell>
                    <TableCell>{kindLabel(entry.kind)}</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {entry.proseOnly ? "Prose only · no typed edge" : "No typed edge"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      </div>
    </main>
  );
}
