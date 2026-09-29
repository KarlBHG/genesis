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
    accent: "theme-wash-security",
    ring: "var(--theme-security)",
    icon: ShieldIcon,
  },
  europe: {
    accent: "theme-wash-europe",
    ring: "var(--theme-europe)",
    icon: Globe2Icon,
  },
  "bilateral-trade": {
    accent: "theme-wash-bilateral-trade",
    ring: "var(--theme-bilateral-trade)",
    icon: HandshakeIcon,
  },
  multilateral: {
    accent: "theme-wash-multilateral",
    ring: "var(--theme-multilateral)",
    icon: Ship,
  },
  financial: {
    accent: "theme-wash-financial",
    ring: "var(--theme-financial)",
    icon: TrendingUpIcon,
  },
  budget: {
    accent: "theme-wash-budget",
    ring: "var(--theme-budget)",
    icon: LandmarkIcon,
  },
  aviation: {
    accent: "theme-wash-aviation",
    ring: "var(--theme-aviation)",
    icon: PlaneIcon,
  },
  investment: {
    accent: "theme-wash-investment",
    ring: "var(--theme-investment)",
    icon: BanknoteIcon,
  },
  development: {
    accent: "theme-wash-development",
    ring: "var(--theme-development)",
    icon: Globe2Icon,
  },
};

export function obligationVisual(id: string): ObligationVisual {
  return (
    OBLIGATION_VISUAL[id] ?? {
      accent: "theme-wash-fallback",
      ring: "var(--theme-fallback)",
      icon: Globe2Icon,
    }
  );
}
