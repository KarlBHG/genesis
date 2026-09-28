import type { LucideIcon } from "lucide-react";
import {
  BanknoteIcon,
  Globe2Icon,
  HandshakeIcon,
  LandmarkIcon,
  PlaneIcon,
  ShieldIcon,
  Ship,
  TrendingUpIcon,
} from "lucide-react";

export type ObligationVisual = {
  accent: string;
  ring: string;
  icon: LucideIcon;
};

export const OBLIGATION_VISUAL: Record<string, ObligationVisual> = {
  security: {
    accent: "from-slate-600/8 via-indigo-500/4 to-transparent",
    ring: "oklch(0.5 0.07 265)",
    icon: ShieldIcon,
  },
  europe: {
    accent: "from-blue-600/7 via-violet-500/4 to-transparent",
    ring: "oklch(0.52 0.11 275)",
    icon: Globe2Icon,
  },
  "bilateral-trade": {
    accent: "from-amber-600/7 via-orange-500/4 to-transparent",
    ring: "oklch(0.6 0.13 65)",
    icon: HandshakeIcon,
  },
  multilateral: {
    accent: "from-teal-600/6 via-cyan-500/4 to-transparent",
    ring: "oklch(0.54 0.09 200)",
    icon: Ship,
  },
  financial: {
    accent: "from-rose-600/6 via-red-500/4 to-transparent",
    ring: "oklch(0.52 0.15 25)",
    icon: TrendingUpIcon,
  },
  budget: {
    accent: "from-emerald-600/6 via-green-500/4 to-transparent",
    ring: "oklch(0.5 0.11 155)",
    icon: LandmarkIcon,
  },
  aviation: {
    accent: "from-sky-600/7 via-blue-400/4 to-transparent",
    ring: "oklch(0.54 0.11 235)",
    icon: PlaneIcon,
  },
  investment: {
    accent: "from-violet-600/6 via-purple-500/4 to-transparent",
    ring: "oklch(0.48 0.13 305)",
    icon: BanknoteIcon,
  },
  development: {
    accent: "from-lime-600/5 via-emerald-500/4 to-transparent",
    ring: "oklch(0.52 0.12 145)",
    icon: Globe2Icon,
  },
};

export function obligationVisual(id: string): ObligationVisual {
  return (
    OBLIGATION_VISUAL[id] ?? {
      accent: "from-primary/6 to-transparent",
      ring: "oklch(0.5 0.06 255)",
      icon: Globe2Icon,
    }
  );
}
