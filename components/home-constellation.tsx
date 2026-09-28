import Link from "next/link";

import { obligationVisual } from "@/lib/obligation-visual";
import { OBLIGATION_SECTIONS } from "@/lib/obligations";

const SIZE = 440;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 162;

function polar(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

export function HomeConstellation() {
  const nodes = OBLIGATION_SECTIONS.map((section, index) => {
    const angle = (360 / OBLIGATION_SECTIONS.length) * index;
    const { x, y } = polar(angle, R);
    const visual = obligationVisual(section.id);
    return { section, x, y, angle, visual };
  });

  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      <svg
        aria-labelledby="constellation-title"
        className="h-auto w-full drop-shadow-sm"
        role="img"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <title id="constellation-title">
          Obligation themes arranged around Iceland
        </title>
        <defs>
          <radialGradient cx="50%" cy="50%" id="core-glow" r="50%">
            <stop offset="0%" stopColor="oklch(0.72 0.08 255 / 0.45)" />
            <stop offset="55%" stopColor="oklch(0.9 0.04 220 / 0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="orbit-stroke" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.75 0.06 255 / 0.5)" />
            <stop offset="50%" stopColor="oklch(0.82 0.08 85 / 0.35)" />
            <stop offset="100%" stopColor="oklch(0.78 0.07 200 / 0.45)" />
          </linearGradient>
        </defs>
        <circle cx={CX} cy={CY} fill="url(#core-glow)" r={R + 42} />
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
        {nodes.map(({ section, x, y, visual }) => (
          <line
            key={`line-${section.id}`}
            stroke={visual.ring}
            strokeOpacity={0.35}
            strokeWidth="0.75"
            x1={CX}
            x2={x}
            y1={CY}
            y2={y}
          />
        ))}
        <circle
          className="fill-card/90 stroke-primary/25"
          cx={CX}
          cy={CY}
          r={40}
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
        {nodes.map(({ section, x, y, visual }) => (
          <g key={section.id}>
            <circle
              className="constellation-node motion-reduce:animate-none"
              cx={x}
              cy={y}
              fill={visual.ring}
              r={6}
              stroke="oklch(0.99 0.005 90)"
              strokeWidth="2"
              style={{
                animation: "constellation-pulse 4s ease-in-out infinite",
                animationDelay: `${section.id.length * 0.15}s`,
              }}
            />
          </g>
        ))}
      </svg>
      <ul className="absolute inset-0 m-0 list-none p-0">
        {nodes.map(({ section, x, y, angle }) => {
          const labelOnLeft = angle > 90 && angle < 270;
          const topPct = (y / SIZE) * 100;
          const leftPct = (x / SIZE) * 100;
          return (
            <li
              className="absolute max-w-[7.5rem] -translate-y-1/2 text-[0.7rem] leading-snug sm:max-w-[8.5rem] sm:text-xs"
              key={section.id}
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                transform: `translate(${labelOnLeft ? "-100%" : "0"}, -50%) ${
                  labelOnLeft ? "translateX(-0.75rem)" : "translateX(0.75rem)"
                }`,
                textAlign: labelOnLeft ? "right" : "left",
              }}
            >
              <Link
                className="font-medium text-foreground/85 underline-offset-4 transition-colors hover:text-foreground hover:underline"
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
