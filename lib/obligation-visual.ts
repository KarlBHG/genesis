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
    accent: "from-slate-600/20 via-indigo-500/10 to-transparent",
    ring: "oklch(0.55 0.06 265)",
    icon: ShieldIcon,
  },
  europe: {
    accent: "from-blue-600/15 via-violet-500/10 to-transparent",
    ring: "oklch(0.58 0.1 275)",
    icon: Globe2Icon,
  },
  "bilateral-trade": {
    accent: "from-amber-600/15 via-orange-500/8 to-transparent",
    ring: "oklch(0.68 0.12 65)",
    icon: HandshakeIcon,
  },
  multilateral: {
    accent: "from-teal-600/12 via-cyan-500/8 to-transparent",
    ring: "oklch(0.62 0.08 200)",
    icon: Ship,
  },
  financial: {
    accent: "from-rose-600/12 via-red-500/8 to-transparent",
    ring: "oklch(0.58 0.14 25)",
    icon: TrendingUpIcon,
  },
  budget: {
    accent: "from-emerald-600/12 via-green-500/8 to-transparent",
    ring: "oklch(0.58 0.1 155)",
    icon: LandmarkIcon,
  },
  aviation: {
    accent: "from-sky-600/15 via-blue-400/8 to-transparent",
    ring: "oklch(0.62 0.1 235)",
    icon: PlaneIcon,
  },
  investment: {
    accent: "from-violet-600/12 via-purple-500/8 to-transparent",
    ring: "oklch(0.55 0.12 305)",
    icon: BanknoteIcon,
  },
  development: {
    accent: "from-lime-600/10 via-emerald-500/8 to-transparent",
    ring: "oklch(0.6 0.11 145)",
    icon: Globe2Icon,
  },
};

export function obligationVisual(id: string): ObligationVisual {
  return (
    OBLIGATION_VISUAL[id] ?? {
      accent: "from-primary/10 to-transparent",
      ring: "oklch(0.55 0.05 255)",
      icon: Globe2Icon,
    }
  );
}
