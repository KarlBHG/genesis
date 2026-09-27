import { resolveSlug } from "@/lib/content";
import { labelize, yearOf } from "@/lib/format";
import type { Edge } from "@/lib/types";

export type StripId = "budget" | "power" | "ownership";

export function edgeKey(edge: Edge): string {
  return [edge.from, edge.relationship, edge.to, edge.asOf, edge.source].join("|");
}

function figureOnLine(note: string): string | null {
  const hits = [...note.matchAll(/(\d[\d.,]*)\s*(m\.kr\.|billion ISK)/gi)];
  if (hits.length !== 1) return null;
  const hit = hits[0];
  if (!hit) return null;
  return `${hit[1]} ${hit[2]}`;
}

function lineLabel(edge: Edge): string {
  const year = yearOf(edge.asOf);
  const parts = [labelize(edge.relationship)];
  if (year !== "Undated") parts.push(year);
  const figure = figureOnLine(edge.note);
  if (figure) parts.push(figure);
  return parts.join(" · ");
}

export function stripOf(edge: Edge): StripId | "other" {
  if (edge.relationship === "funds") return "budget";
  if (edge.relationship === "sells-power-to") return "power";
  if (
    edge.from === "ministry-of-finance" &&
    edge.to === "landsvirkjun" &&
    edge.relationship === "appoints"
  ) {
    return "power";
  }
  if (edge.from === "landsvirkjun" && edge.to === "hordur-arnarson") return "power";
  if (edge.from === "aluminium-exports-2024" && edge.to === "power-and-aluminium") {
    return "power";
  }
  if (edge.relationship === "invests-in" || edge.relationship === "owns") return "ownership";
  if (edge.from === "financial-supervisory-authority" && edge.relationship === "regulates") {
    return "ownership";
  }
  if (edge.from === "sedlabanki" && edge.to === "arion-banki") return "ownership";
  return "other";
}

const OWNERSHIP_RANK = [
  "financial-supervisory-authority",
  "bru",
  "birta",
  "lsr",
  "stapi",
  "arion-banki",
  "islandsbanki",
  "sedlabanki",
  "ministry-of-finance",
  "reykjavikurborg",
];

function sortEdges(edges: Edge[], strip: StripId | "other"): Edge[] {
  return edges.slice().sort((a, b) => {
    if (strip === "budget") {
      const aHealth = a.asOf.startsWith("2024") ? 0 : 1;
      const bHealth = b.asOf.startsWith("2024") ? 0 : 1;
      if (aHealth !== bHealth) return aHealth - bHealth;
    }
    if (strip === "ownership") {
      const aRank = OWNERSHIP_RANK.indexOf(a.from);
      const bRank = OWNERSHIP_RANK.indexOf(b.from);
      const aOrder = aRank === -1 ? OWNERSHIP_RANK.length : aRank;
      const bOrder = bRank === -1 ? OWNERSHIP_RANK.length : bRank;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    const from = a.fromTitle.localeCompare(b.fromTitle, "en");
    if (from !== 0) return from;
    const to = a.toTitle.localeCompare(b.toTitle, "en");
    if (to !== 0) return to;
    return a.asOf.localeCompare(b.asOf);
  });
}

function EdgeRow({ edge }: { edge: Edge }) {
  const from = resolveSlug(edge.from);
  const to = resolveSlug(edge.to);
  return (
    <li
      className="grid grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-baseline sm:gap-3"
      key={edgeKey(edge)}
    >
      {from ? (
        <a className="font-medium break-words underline underline-offset-4" href={from.href}>
          {from.title}
        </a>
      ) : (
        <span className="font-medium break-words">{edge.fromTitle}</span>
      )}
      <span className="text-sm text-muted-foreground">{lineLabel(edge)}</span>
      {to ? (
        <a
          className="font-medium break-words underline underline-offset-4 sm:text-right"
          href={to.href}
        >
          {to.title}
        </a>
      ) : (
        <span className="font-medium break-words sm:text-right">{edge.toTitle}</span>
      )}
    </li>
  );
}

const STRIP_COPY: Record<StripId, { title: string; text: string }> = {
  budget: {
    title: "Budget",
    text: "Alþingi funds the 2026 budget, and that budget funds the ministries. Lines dated 2024 are the earlier health release, not the 2026 law.",
  },
  power: {
    title: "Power",
    text: "The Minister of Finance appoints Landsvirkjun’s board. Landsvirkjun sells power onward. The two Norðurál lines are the 2024 supply sentence and the 2026 contract. Aluminium exports are a separate arrow into the sector page.",
  },
  ownership: {
    title: "Ownership",
    text: "Fjármálaeftirlitið supervises the pension funds. Those funds, and two banks, hold the shares listed here. The finance ministry’s holding in Landsbankinn is its own line.",
  },
};

export function ConnectionStrips({
  edges,
  only,
}: {
  edges: Edge[];
  only?: StripId;
}) {
  const groups: Record<StripId | "other", Edge[]> = {
    budget: [],
    power: [],
    ownership: [],
    other: [],
  };
  for (const edge of edges) {
    groups[stripOf(edge)].push(edge);
  }

  const shown: StripId[] = only ? [only] : ["budget", "power", "ownership"];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {shown.map((id) => {
        const copy = STRIP_COPY[id];
        const edgesForStrip = sortEdges(groups[id], id);
        return (
          <section className="flex min-w-0 flex-col gap-3" id={`${id}-strip`} key={id}>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-medium">{copy.title}</h2>
              <p className="text-sm text-muted-foreground">{copy.text}</p>
            </div>
            <ol className="divide-y overflow-hidden rounded-lg border">
              {edgesForStrip.map((edge) => (
                <EdgeRow edge={edge} key={edgeKey(edge)} />
              ))}
            </ol>
            {id === "ownership" && !only && groups.other.length > 0 ? (
              <div className="flex flex-col gap-2" id="other-edges">
                <h3 className="text-base font-medium">Other typed edges</h3>
                <p className="text-sm text-muted-foreground">
                  These links are on the map and are not the pension, bank, or Landsbankinn lines above.
                </p>
                <ol className="divide-y overflow-hidden rounded-lg border">
                  {sortEdges(groups.other, "other").map((edge) => (
                    <EdgeRow edge={edge} key={edgeKey(edge)} />
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
