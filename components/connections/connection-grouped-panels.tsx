import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { groupEdges, type GroupBy } from "@/lib/connection-groups";
import { labelize } from "@/lib/format";
import type { Edge } from "@/lib/types";

/** Grouped connection index panels — headers are plain links, not inside disclosure controls. */
export function ConnectionGroupedPanels({
  edges,
  groupBy,
  renderEdge,
}: {
  edges: Edge[];
  groupBy: Exclude<GroupBy, "none">;
  renderEdge: (edge: Edge) => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {groupEdges(edges, groupBy).map((group) => {
        const first = group.edges[0];
        if (!first) return null;
        const target = groupBy === "from" ? resolveSlug(first.from) : null;
        const title =
          groupBy === "from" ? first.fromTitle : labelize(first.relationship);
        return (
          <section className="min-w-0 rounded-lg border px-4" key={group.key}>
            <header className="flex flex-wrap items-baseline gap-x-2 border-b py-3">
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
            </header>
            <ul className="flex min-w-0 flex-col pb-2">
              {group.edges.map((edge) => renderEdge(edge))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
