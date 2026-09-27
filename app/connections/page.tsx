import type { Metadata } from "next";
import Link from "next/link";

import { ConnectionStrips, edgeKey } from "@/components/connection-graph";
import { Badge } from "@/components/ui/badge";
import { getCatalog, getEdges, hrefFor, resolveSlug } from "@/lib/content";
import { formatDate, kindLabel, labelize } from "@/lib/format";
import type { Kind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Connections",
  description: "Typed public-record links between entries in the Iceland system map.",
};

const KIND_ORDER: Kind[] = ["treaty", "institution", "event", "sector", "flow", "player"];

export default function ConnectionsPage() {
  const entries = getCatalog();
  const edges = getEdges();
  const drawn = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
  const missing = entries
    .filter((entry) => !drawn.has(entry.slug))
    .sort((a, b) => {
      const kind = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
      if (kind !== 0) return kind;
      return a.title.localeCompare(b.title, "en");
    });
  const listed = edges
    .slice()
    .sort((a, b) => a.fromTitle.localeCompare(b.fromTitle, "en") || a.toTitle.localeCompare(b.toTitle, "en") || a.asOf.localeCompare(b.asOf));

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Each line is one relationship from an entry, with the year on the line. Full names wrap. Nothing here scrolls sideways.
        </p>
      </header>
      <ConnectionStrips edges={edges} />
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
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Notes</h2>
        <ol className="flex flex-col gap-4">
          {listed.map((edge) => {
            const from = resolveSlug(edge.from);
            const to = resolveSlug(edge.to);
            return (
              <li
                className="flex flex-col gap-2 rounded-lg border p-4"
                key={edgeKey(edge)}
              >
                <p className="flex flex-wrap items-center gap-2">
                  {from ? (
                    <Link className="font-medium underline underline-offset-4" href={from.href}>
                      {edge.fromTitle}
                    </Link>
                  ) : (
                    edge.fromTitle
                  )}
                  <Badge variant="secondary">{labelize(edge.relationship)}</Badge>
                  {edge.asOf ? (
                    <span className="text-sm text-muted-foreground">{formatDate(edge.asOf)}</span>
                  ) : null}
                  {to ? (
                    <Link className="font-medium underline underline-offset-4" href={to.href}>
                      {edge.toTitle}
                    </Link>
                  ) : (
                    edge.toTitle
                  )}
                </p>
                <p>{edge.note}</p>
                <p className="text-sm text-muted-foreground">
                  {edge.asOf ? `As of ${formatDate(edge.asOf)}. ` : "The source page does not date this sentence. "}
                  <a className="break-all underline underline-offset-4" href={edge.source} rel="noreferrer" target="_blank">
                    {edge.source}
                  </a>
                </p>
              </li>
            );
          })}
        </ol>
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
