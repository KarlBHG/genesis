import Link from "next/link";

import { obligationVisual } from "@/lib/obligation-visual";
import { OBLIGATION_SECTIONS } from "@/lib/obligations";

const SIZE = 520;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 158;
const LABEL_GAP = 72;

function polar(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

/** How far a node's angle sits from due north (0°) or due south (180°). */
function distanceFromVertical(angle: number): number {
  const fromTop = Math.min(angle, 360 - angle);
  const fromBottom = Math.abs(angle - 180);
  return Math.min(fromTop, fromBottom);
}

const VERTICAL_ZONE = 22;

export function HomeConstellation() {
  const count = OBLIGATION_SECTIONS.length;
  const nodes = OBLIGATION_SECTIONS.map((section, index) => {
    const angle = (360 / count) * index;
    const node = polar(angle, R);
    const label = polar(angle, R + LABEL_GAP);
    const visual = obligationVisual(section.id);
    const isVertical = distanceFromVertical(angle) < VERTICAL_ZONE;
    const isTop = angle < 90 || angle > 270;
    const isRightHalf = angle > 0 && angle < 180;
    return { section, node, label, angle, visual, isVertical, isTop, isRightHalf };
  });

  return (
    <div className="home-constellation relative mx-auto w-full max-w-[36rem] overflow-visible px-2 py-2 sm:px-3 sm:py-4">
      <svg
        aria-labelledby="constellation-title"
        className="mx-auto h-auto w-full max-h-[min(72vw,18rem)] drop-shadow-sm sm:max-h-none"
        role="img"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <title id="constellation-title">
          Obligation themes arranged around Iceland
        </title>
        <defs>
          <radialGradient cx="50%" cy="50%" id="core-glow" r="50%">
            <stop offset="0%" stopColor="var(--constellation-core)" />
            <stop offset="55%" stopColor="var(--constellation-core-mid)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="orbit-stroke" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--constellation-orbit-a)" />
            <stop offset="50%" stopColor="var(--constellation-orbit-b)" />
            <stop offset="100%" stopColor="var(--constellation-orbit-c)" />
          </linearGradient>
        </defs>
        <circle cx={CX} cy={CY} fill="url(#core-glow)" r={R + 46} />
        <g
          className="constellation-orbit motion-reduce:animate-none"
          transform={`translate(${CX} ${CY})`}
        >
          <circle
            cx={0}
            cy={0}
            fill="none"
            r={R}
            stroke="url(#orbit-stroke)"
            strokeDasharray="3 10"
            strokeWidth="1"
          />
        </g>
        {nodes.map(({ section, node, visual }) => (
          <line
            key={`line-${section.id}`}
            stroke={visual.ring}
            strokeOpacity={0.32}
            strokeWidth="0.75"
            x1={CX}
            x2={node.x}
            y1={CY}
            y2={node.y}
          />
        ))}
        <circle
          className="fill-card/95 stroke-primary/25"
          cx={CX}
          cy={CY}
          r={38}
          strokeWidth="1.25"
        />
        <text
          className="fill-foreground text-[12px] font-medium"
          dominantBaseline="middle"
          textAnchor="middle"
          x={CX}
          y={CY - 7}
        >
          Iceland
        </text>
        <text
          className="fill-muted-foreground text-[9px] tracking-wide"
          dominantBaseline="middle"
          textAnchor="middle"
          x={CX}
          y={CY + 11}
        >
          obligations
        </text>
        {nodes.map(({ section, node, visual }) => (
          <circle
            className="constellation-node motion-reduce:animate-none"
            cx={node.x}
            cy={node.y}
            fill={visual.ring}
            key={section.id}
            r={6}
            stroke="var(--constellation-node-ring)"
            strokeWidth="2"
            style={{
              animation: "constellation-pulse 4s ease-in-out infinite",
              animationDelay: `${section.id.length * 0.15}s`,
            }}
          />
        ))}
      </svg>
      <ul className="absolute inset-0 m-0 hidden list-none p-0 sm:block">
        {nodes.map(({ section, label, isVertical, isTop, isRightHalf }) => {
          const topPct = (label.y / SIZE) * 100;
          const leftPct = (label.x / SIZE) * 100;

          let transform: string;
          let textAlign: "left" | "right" | "center";
          if (isVertical) {
            textAlign = "center";
            transform = `translate(-50%, ${isTop ? "-100%" : "0%"}) translateY(${isTop ? "-0.4rem" : "0.4rem"})`;
          } else if (isRightHalf) {
            textAlign = "left";
            transform = "translate(0, -50%)";
          } else {
            textAlign = "right";
            transform = "translate(-100%, -50%)";
          }

          return (
            <li
              className="absolute max-w-[6.75rem] text-[0.68rem] leading-snug sm:max-w-[7.25rem] sm:text-[0.72rem]"
              key={section.id}
              style={{ top: `${topPct}%`, left: `${leftPct}%`, transform, textAlign }}
            >
              <Link
                className="constellation-label font-semibold underline-offset-4 transition-colors hover:text-foreground hover:underline"
                href={`/obligations#${section.id}`}
              >
                {section.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Compact fallback for narrow screens — a legend, not the full radial diagram. */
export function ConstellationLegend() {
  return (
    <ul className="grid w-full max-w-sm grid-cols-1 gap-2 sm:hidden">
      {OBLIGATION_SECTIONS.map((section) => {
        const visual = obligationVisual(section.id);
        return (
          <li key={section.id}>
            <Link
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm transition-colors hover:border-primary/25"
              href={`/obligations#${section.id}`}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: visual.ring }}
              />
              <span className="font-medium">{section.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
