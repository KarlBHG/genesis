/** Curated index of international commitments — each item links to a sourced entry. */

export type ObligationLink = {
  label: string;
  href: string;
  note: string;
};

export type ObligationSection = {
  id: string;
  title: string;
  lead: string;
  items: ObligationLink[];
  footnote?: string;
};

export const OBLIGATION_SECTIONS: ObligationSection[] = [
  {
    id: "security",
    title: "Security and defence",
    lead:
      "Collective defence through NATO, the 1951 bilateral defence agreement with the United States, and host-nation support after the permanent US presence at Keflavík ended in 2006.",
    items: [
      {
        label: "North Atlantic Treaty",
        href: "/treaties/nato",
        note:
          "Founding member since 4 April 1949. NATO describes Iceland as the only Ally without its own military forces.",
      },
      {
        label: "1951 defence agreement",
        href: "/events/1951-defense-agreement",
        note:
          "Bilateral agreement with the United States; NATO’s history ties it to facilities and land for Alliance installations.",
      },
      {
        label: "Keflavík after 2006",
        href: "/events/2006-keflavik-base",
        note:
          "No permanent foreign military presence since 2006; NATO radar and host-nation support continue on the pages used in the map.",
      },
    ],
  },
  {
    id: "europe",
    title: "European market, EFTA, and Schengen",
    lead:
      "The EEA extends the EU single market to Iceland, Norway, and Liechtenstein. EFTA is the intergovernmental framework; Schengen is a separate association agreement on border cooperation.",
    items: [
      {
        label: "EEA Agreement",
        href: "/treaties/eea-agreement",
        note:
          "In force from 1 January 1994. Free movement of goods, services, capital, and persons; EEA-relevant EU law incorporated via the Joint Committee.",
      },
      {
        label: "1994 EEA entry",
        href: "/events/1994-eea-entry",
        note: "Government page records Iceland’s participation when the agreement entered into force.",
      },
      {
        label: "EEA Joint Committee",
        href: "/institutions/eea-joint-committee",
        note: "Incorporates new EEA-relevant EU legislation by decision.",
      },
      {
        label: "EFTA Convention",
        href: "/treaties/efta",
        note: "Iceland joined in 1970; revised convention in force from 1 June 2002.",
      },
      {
        label: "Schengen association",
        href: "/treaties/schengen",
        note: "Association agreement signed in December 1996 with Denmark, Finland, Norway, and Sweden.",
      },
      {
        label: "Icesave judgment (2013)",
        href: "/events/2013-icesave-judgment",
        note:
          "EFTA Court case on deposit-guarantee obligations under the EEA; application dismissed.",
      },
    ],
  },
  {
    id: "bilateral-trade",
    title: "Bilateral and protocol trade terms",
    lead:
      "Ministry for Foreign Affairs lists these alongside the EEA and EFTA frameworks. Tariff terms for fish and agriculture also sit on sector entries.",
    items: [
      {
        label: "Iceland–China FTA",
        href: "/treaties/iceland-china-fta",
        note: "Entered into force 1 July 2014.",
      },
      {
        label: "Hoyvík Agreement (Faroe Islands)",
        href: "/treaties/hoyvik-agreement",
        note: "In force 1 November 2006; abolition of tariffs on originating goods.",
      },
      {
        label: "Iceland–Greenland trade",
        href: "/treaties/iceland-greenland-trade",
        note: "Agreement with Denmark; certain tariff preferences (dates not on the page used).",
      },
      {
        label: "Protocol 6 (1972 fish)",
        href: "/treaties/eu-fish-protocol-1972",
        note: "Fish preferences into the EU where better than EEA Protocol 9.",
      },
      {
        label: "Iceland–EU agriculture (2018)",
        href: "/treaties/iceland-eu-agriculture-2018",
        note: "Unprocessed agricultural preferences; replaced the 2007 agreement.",
      },
      {
        label: "Fisheries and quotas",
        href: "/business/fisheries-and-quotas",
        note: "Sector entry for quota and trade context; not a separate treaty file.",
      },
    ],
  },
  {
    id: "multilateral",
    title: "Multilateral trade",
    lead:
      "Government trade policy page describes WTO support and EFTA’s third-country FTA network without printing Iceland’s WTO accession year on that page.",
    items: [
      {
        label: "WTO and multilateral trade",
        href: "/treaties/multilateral-trade-system",
        note: "Rules-based system and Permanent Mission work in Geneva.",
      },
      {
        label: "EFTA third-country FTAs",
        href: "/treaties/efta",
        note: "EFTA States’ worldwide FTA network is described on the same government page; individual partner agreements are not all separate map entries.",
      },
    ],
  },
  {
    id: "financial",
    title: "Financial crisis commitments",
    lead:
      "2008 stand-by arrangement, capital-movement rules, and later easing — recorded as events and money flows, not as treaties.",
    items: [
      {
        label: "IMF Stand-By (2008)",
        href: "/events/imf-program-2008",
        note: "Two-year arrangement requested November 2008 (SDR 1.4 billion in the staff report).",
      },
      {
        label: "Capital controls (2008)",
        href: "/events/2008-capital-controls",
        note: "Foreign Exchange Act amendments; central bank authorisation to limit capital movements.",
      },
      {
        label: "Capital controls eased (2017)",
        href: "/events/2017-capital-controls",
        note: "Later lifting for residents linked in the crisis chain on the homepage.",
      },
      {
        label: "Banking after 2008",
        href: "/business/banking-after-2008",
        note: "Restructuring and supervision lines tied to the crisis entries.",
      },
    ],
  },
  {
    id: "budget",
    title: "Domestic budget and programs",
    lead:
      "Alþingi authorises annual expenditure by policy area. This is not a treaty obligation, but it is where contribution levels for ministries and programs are printed.",
    items: [
      {
        label: "2026 government programs",
        href: "/programs",
        note: "35 policy areas and Article 4 authorisations from the budget bill.",
      },
      {
        label: "Treasury budget 2026",
        href: "/money/treasury-budget-2026",
        note: "Aggregate expenditure and revenue lines from the fiscal documents.",
      },
      {
        label: "Treasury debt strategy",
        href: "/money/treasury-debt",
        note: "Medium-term debt management; gross debt and liability framing.",
      },
    ],
    footnote:
      "NATO common funding, EU budget contributions, and EFTA Secretariat assessments are not printed as totals on the entries opened for this index.",
  },
];
