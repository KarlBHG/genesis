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
    ring: "var(--theme-security)",
    icon: ShieldIcon,
  },
  europe: {
    accent: "from-blue-600/7 via-violet-500/4 to-transparent",
    ring: "var(--theme-europe)",
    icon: Globe2Icon,
  },
  "bilateral-trade": {
    accent: "from-amber-600/7 via-orange-500/4 to-transparent",
    ring: "var(--theme-bilateral-trade)",
    icon: HandshakeIcon,
  },
  multilateral: {
    accent: "from-teal-600/6 via-cyan-500/4 to-transparent",
    ring: "var(--theme-multilateral)",
    icon: Ship,
  },
  financial: {
    accent: "from-rose-600/6 via-red-500/4 to-transparent",
    ring: "var(--theme-financial)",
    icon: TrendingUpIcon,
  },
  budget: {
    accent: "from-emerald-600/6 via-green-500/4 to-transparent",
    ring: "var(--theme-budget)",
    icon: LandmarkIcon,
  },
  aviation: {
    accent: "from-sky-600/7 via-blue-400/4 to-transparent",
    ring: "var(--theme-aviation)",
    icon: PlaneIcon,
  },
  investment: {
    accent: "from-violet-600/6 via-purple-500/4 to-transparent",
    ring: "var(--theme-investment)",
    icon: BanknoteIcon,
  },
  development: {
    accent: "from-lime-600/5 via-emerald-500/4 to-transparent",
    ring: "var(--theme-development)",
    icon: Globe2Icon,
  },
};

export function obligationVisual(id: string): ObligationVisual {
  return (
    OBLIGATION_VISUAL[id] ?? {
      accent: "from-primary/6 to-transparent",
      ring: "var(--theme-fallback)",
      icon: Globe2Icon,
    }
  );
}
