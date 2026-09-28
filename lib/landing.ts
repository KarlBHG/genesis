import { getEdges, resolveSlug } from "@/lib/content";
import { yearOf } from "@/lib/format";

export type ChainStep = {
  from: string;
  relationship: string;
  to: string;
};

export type LandingChain = {
  id: string;
  title: string;
  blurb: string;
  href: string;
  steps: ChainStep[];
};

export type ResolvedStep = {
  fromTitle: string;
  fromHref: string | null;
  relationship: string;
  toTitle: string;
  toHref: string | null;
  year: string;
};

export const LANDING_CHAINS: LandingChain[] = [
  {
    id: "budget",
    title: "The budget funds the ministries",
    blurb: "Alþingi passes the budget as law. The budget authorises each policy area.",
    href: "/programs",
    steps: [
      { from: "althingi", relationship: "funds", to: "treasury-budget-2026" },
      {
        from: "treasury-budget-2026",
        relationship: "funds",
        to: "policy-area-23-sjukrahusthjonusta",
      },
    ],
  },
  {
    id: "power",
    title: "Power flows to the smelters",
    blurb: "The state appoints the power company. Its contracts feed the export line.",
    href: "/overview",
    steps: [
      { from: "ministry-of-finance", relationship: "appoints", to: "landsvirkjun" },
      { from: "landsvirkjun", relationship: "sells-power-to", to: "nordural" },
      {
        from: "aluminium-exports-2024",
        relationship: "export-of",
        to: "power-and-aluminium",
      },
    ],
  },
  {
    id: "state-bank",
    title: "The state owns the central bank",
    blurb: "Ownership, appointment, and supervision are three separate recorded lines.",
    href: "/system",
    steps: [
      { from: "republic-of-iceland", relationship: "owns", to: "sedlabanki" },
      {
        from: "sedlabanki",
        relationship: "regulates",
        to: "financial-supervisory-authority",
      },
    ],
  },
  {
    id: "hospital-money",
    title: "Hospital money and responsibility",
    blurb: "Budget authorisation, the health policy area, and who runs Landspítali.",
    href: "/programs",
    steps: [
      {
        from: "treasury-budget-2026",
        relationship: "funds",
        to: "policy-area-23-sjukrahusthjonusta",
      },
      { from: "ministry-of-health", relationship: "regulates", to: "healthcare" },
      { from: "ministry-of-health", relationship: "regulates", to: "landspitali" },
    ],
  },
  {
    id: "crisis-2008",
    title: "Crisis, IMF, and capital controls",
    blurb: "Stand-By Arrangement, foreign-exchange restrictions, and the 2017 lifting for residents.",
    href: "/events/2008-financial-crisis",
    steps: [
      {
        from: "2008-financial-crisis",
        relationship: "represents",
        to: "imf-program-2008",
      },
      {
        from: "2008-financial-crisis",
        relationship: "represents",
        to: "2008-capital-controls",
      },
      {
        from: "2008-capital-controls",
        relationship: "represents",
        to: "2017-capital-controls",
      },
    ],
  },
];

export function resolveChain(chain: LandingChain): ResolvedStep[] {
  const edges = getEdges();
  return chain.steps.map((step) => {
    const edge = edges.find(
      (item) =>
        item.from === step.from &&
        item.relationship === step.relationship &&
        item.to === step.to,
    );
    const from = resolveSlug(step.from);
    const to = resolveSlug(step.to);
    const year = edge ? yearOf(edge.asOf) : "Undated";
    return {
      fromTitle: from?.title ?? edge?.fromTitle ?? step.from,
      fromHref: from?.href ?? null,
      relationship: step.relationship,
      toTitle: to?.title ?? edge?.toTitle ?? step.to,
      toHref: to?.href ?? null,
      year: year === "Undated" ? "" : year,
    };
  });
}
