"use client";

import { useId, useState } from "react";
import { linkHorizontal } from "d3-shape";

import type { EgoLayout } from "@/components/viz/ego-layout";
import { labelize } from "@/lib/format";
import { icelandicLang } from "@/lib/lang";

const curve = linkHorizontal<
  { x1: number; y1: number; x2: number; y2: number },
  [number, number]
>()
  .source((link) => [link.x1, link.y1])
  .target((link) => [link.x2, link.y2]);

/**
 * The typed edges around one entry, laid out on the server by `egoLayout`.
 * Client-side only for hover and keyboard focus — the geometry never moves, so
 * there is no animation to chase and nothing shifts under the pointer.
 */
export function EgoNetwork({
  layout,
  label,
}: {
  layout: EgoLayout;
  label: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const titleId = useId();
  const activeLink = layout.links.find((link) => link.id === active);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <svg
        aria-labelledby={titleId}
        className="h-auto w-full"
        role="img"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        <title id={titleId}>{label}</title>
        {layout.links.map((link) => (
          <path
            d={curve(link) ?? undefined}
            fill="none"
            key={link.id}
            onMouseEnter={() => setActive(link.id)}
            onMouseLeave={() => setActive(null)}
            stroke="var(--viz-link)"
            strokeOpacity={active === null || active === link.id ? 0.85 : 0.2}
            strokeWidth={active === link.id ? 2.25 : 1.1}
          />
        ))}
        {layout.nodes.map((node) => (
          <g key={node.slug}>
            <circle
              cx={node.x}
              cy={node.y}
              fill={node.isCentre ? "var(--viz-bar)" : "var(--viz-node)"}
              r={node.isCentre ? 8 : 5}
              stroke="var(--viz-node-ring)"
              strokeWidth={1.5}
            />
            <text
              className="fill-muted-foreground text-[10px]"
              dominantBaseline="middle"
              textAnchor="middle"
              x={node.x}
              y={node.y + (node.isCentre ? 20 : 16)}
            >
              {node.title}
            </text>
          </g>
        ))}
      </svg>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {layout.links.map((link) => (
          <li key={link.id}>
            <button
              className="w-full cursor-pointer text-left text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              onBlur={() => setActive(null)}
              onFocus={() => setActive(link.id)}
              type="button"
            >
              {link.edge.fromTitle} · {labelize(link.edge.relationship)} ·{" "}
              {link.edge.toTitle}
            </button>
          </li>
        ))}
      </ul>
      {activeLink ? (
        <p
          className="text-xs leading-5 text-muted-foreground"
          lang={icelandicLang(activeLink.edge.quotation)}
        >
          {activeLink.edge.quotation}
        </p>
      ) : null}
    </div>
  );
}
