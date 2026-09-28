import Link from "next/link";

import { OBLIGATION_SECTIONS } from "@/lib/obligations";

const SIZE = 420;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 158;

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
    return { section, x, y, angle };
  });

  return (
    <div className="relative mx-auto w-full max-w-[28rem]">
      <svg
        aria-labelledby="constellation-title"
        className="h-auto w-full text-border"
        role="img"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <title id="constellation-title">
          Obligation themes arranged around Iceland
        </title>
        <defs>
          <radialGradient cx="50%" cy="50%" id="core-glow" r="50%">
            <stop offset="0%" stopColor="oklch(0.75 0.06 255 / 0.35)" />
            <stop offset="70%" stopColor="oklch(0.92 0.03 220 / 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} fill="url(#core-glow)" r={R + 36} />
        <circle
          className="fill-none stroke-current"
          cx={CX}
          cy={CY}
          r={R}
          strokeDasharray="4 8"
          strokeWidth="0.75"
        />
        {nodes.map(({ section, x, y }) => (
          <line
            key={`line-${section.id}`}
            className="stroke-current opacity-40"
            strokeWidth="0.75"
            x1={CX}
            x2={x}
            y1={CY}
            y2={y}
          />
        ))}
        <circle
          className="fill-card stroke-primary/30"
          cx={CX}
          cy={CY}
          r={36}
          strokeWidth="1"
        />
        <text
          className="fill-foreground text-[11px] font-medium"
          dominantBaseline="middle"
          textAnchor="middle"
          x={CX}
          y={CY - 6}
        >
          Iceland
        </text>
        <text
          className="fill-muted-foreground text-[9px]"
          dominantBaseline="middle"
          textAnchor="middle"
          x={CX}
          y={CY + 10}
        >
          obligations
        </text>
        {nodes.map(({ section, x, y }) => (
          <g key={section.id}>
            <circle
              className="fill-primary/90 stroke-background"
              cx={x}
              cy={y}
              r={5}
              strokeWidth="2"
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
                  labelOnLeft ? "translateX(-0.65rem)" : "translateX(0.65rem)"
                }`,
                textAlign: labelOnLeft ? "right" : "left",
              }}
            >
              <Link
                className="font-medium text-foreground/90 underline-offset-4 hover:text-foreground hover:underline"
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
