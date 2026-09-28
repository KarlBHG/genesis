import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import type { Edge } from "@/lib/types";

export type EgoNode = {
  slug: string;
  title: string;
  /** The centre of the network — the entry whose page this is. */
  isCentre: boolean;
  x: number;
  y: number;
};

export type EgoLink = {
  id: string;
  edge: Edge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type EgoLayout = {
  nodes: EgoNode[];
  links: EgoLink[];
  width: number;
  height: number;
};

type Simulated = SimulationNodeDatum & { slug: string; title: string; isCentre: boolean };
type SimulatedLink = SimulationLinkDatum<Simulated> & { id: string; edge: Edge };

const TICKS = 260;

/**
 * Lays out the typed edges around one entry.
 *
 * `edges` must be stored `Edge` records. Untyped `related` links are
 * deliberately not accepted: a force layout reads as a claim about structure,
 * and only a sourced relationship earns that.
 *
 * The simulation is run to completion here rather than animated, so the result
 * is deterministic and can be rendered on the server.
 */
export function egoLayout(
  centre: string,
  edges: readonly Edge[],
  size = { width: 640, height: 420 },
): EgoLayout {
  const titles = new Map<string, string>();
  for (const edge of edges) {
    titles.set(edge.from, edge.fromTitle);
    titles.set(edge.to, edge.toTitle);
  }
  if (!titles.has(centre)) titles.set(centre, centre);

  const nodes: Simulated[] = [...titles].map(([slug, title]) => ({
    slug,
    title,
    isCentre: slug === centre,
    // A fixed start keeps the layout stable between a server render and a
    // client render of the same data.
    x: slug === centre ? size.width / 2 : undefined,
    y: slug === centre ? size.height / 2 : undefined,
    fx: slug === centre ? size.width / 2 : undefined,
    fy: slug === centre ? size.height / 2 : undefined,
  }));

  const links: SimulatedLink[] = edges.map((edge, index) => ({
    id: `${edge.from}|${edge.relationship}|${edge.to}|${index}`,
    edge,
    source: edge.from,
    target: edge.to,
  }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<Simulated, SimulatedLink>(links)
        .id((node) => node.slug)
        .distance(110)
        .strength(0.5),
    )
    .force("charge", forceManyBody().strength(-260))
    .force("collide", forceCollide(26))
    .force("centre", forceCenter(size.width / 2, size.height / 2))
    .stop();

  simulation.tick(TICKS);

  const clamp = (value: number, limit: number): number =>
    Math.max(18, Math.min(limit - 18, value));

  const placed = nodes.map((node) => ({
    slug: node.slug,
    title: node.title,
    isCentre: node.isCentre,
    x: clamp(node.x ?? size.width / 2, size.width),
    y: clamp(node.y ?? size.height / 2, size.height),
  }));
  const bySlug = new Map(placed.map((node) => [node.slug, node]));

  return {
    nodes: placed,
    width: size.width,
    height: size.height,
    links: links.flatMap((link) => {
      const from = bySlug.get(link.edge.from);
      const to = bySlug.get(link.edge.to);
      if (!from || !to) return [];
      return [{ id: link.id, edge: link.edge, x1: from.x, y1: from.y, x2: to.x, y2: to.y }];
    }),
  };
}
