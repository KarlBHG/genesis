import { resolveSlug } from "@/lib/content";
import { labelize } from "@/lib/format";
import type { Edge } from "@/lib/types";

const COLUMN_X = [16, 280, 544];
const NODE_W = 200;
const NODE_H = 44;
const ROW = 76;

export function ConnectionGraph({ edges }: { edges: Edge[] }) {
  const ids = [...new Set(edges.flatMap((edge) => [edge.from, edge.to]))];
  const outCount = new Map<string, number>();
  const inCount = new Map<string, number>();
  for (const id of ids) {
    outCount.set(id, 0);
    inCount.set(id, 0);
  }
  for (const edge of edges) {
    outCount.set(edge.from, (outCount.get(edge.from) ?? 0) + 1);
    inCount.set(edge.to, (inCount.get(edge.to) ?? 0) + 1);
  }

  const columns: string[][] = [[], [], []];
  for (const id of ids) {
    const outgoing = outCount.get(id) ?? 0;
    const incoming = inCount.get(id) ?? 0;
    const column = outgoing && incoming ? 1 : outgoing ? 0 : 2;
    columns[column].push(id);
  }

  const pos = new Map<string, { x: number; y: number }>();
  columns.forEach((column, index) => {
    column.forEach((id, row) => {
      pos.set(id, { x: COLUMN_X[index], y: 16 + row * ROW });
    });
  });

  const height = 32 + Math.max(...columns.map((column) => column.length), 1) * ROW;
  const width = 760;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <svg
        aria-label="Graph of the seeded connections"
        className="min-w-[760px]"
        height={height}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
      >
        {edges.map((edge) => {
          const a = pos.get(edge.from);
          const b = pos.get(edge.to);
          if (!a || !b) return null;
          const x1 = a.x + NODE_W;
          const y1 = a.y + NODE_H / 2;
          const x2 = b.x;
          const y2 = b.y + NODE_H / 2;
          const mid = (x1 + x2) / 2;
          return (
            <g key={`${edge.from}-${edge.relationship}-${edge.to}`}>
              <path
                d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.45"
              />
              <text
                fill="currentColor"
                fontSize="11"
                textAnchor="middle"
                x={mid}
                y={(y1 + y2) / 2 - 6}
              >
                {labelize(edge.relationship)}
              </text>
            </g>
          );
        })}
        {ids.map((id) => {
          const point = pos.get(id);
          const target = resolveSlug(id);
          if (!point || !target) return null;
          const label = target.title.length > 28 ? `${target.title.slice(0, 26)}…` : target.title;
          return (
            <a key={id} href={target.href}>
              <g>
                <title>{target.title}</title>
                <rect
                  fill="var(--card)"
                  height={NODE_H}
                  rx="8"
                  stroke="currentColor"
                  strokeOpacity="0.35"
                  width={NODE_W}
                  x={point.x}
                  y={point.y}
                />
                <text
                  fill="currentColor"
                  fontSize="12"
                  x={point.x + 10}
                  y={point.y + 27}
                >
                  {label}
                </text>
              </g>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
