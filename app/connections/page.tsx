import type { Metadata } from "next";
import Link from "next/link";

import { ConnectionGraph } from "@/components/connection-graph";
import { Badge } from "@/components/ui/badge";
import { getEdges, resolveSlug } from "@/lib/content";
import { formatDate, labelize } from "@/lib/format";

export const metadata: Metadata = {
  title: "Connections",
  description: "Typed public-record links between entries in the Iceland system map.",
};

export default function ConnectionsPage() {
  const edges = getEdges().slice().sort((a, b) => a.fromTitle.localeCompare(b.fromTitle, "en"));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Each line is one relationship stored on the source entry. The graph draws only these edges.
        </p>
      </header>
      <ConnectionGraph edges={edges} />
      <ol className="flex flex-col gap-4">
        {edges.map((edge) => {
          const from = resolveSlug(edge.from);
          const to = resolveSlug(edge.to);
          return (
            <li
              key={`${edge.from}-${edge.relationship}-${edge.to}`}
              className="flex flex-col gap-2 rounded-lg border p-4"
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
    </main>
  );
}
