import type { Metadata } from "next";

import { HomeDashboard } from "@/components/home-dashboard";
import {
  getCatalog,
  getEdges,
  getOffices,
  getTreaties,
  toSearchDocs,
} from "@/lib/content";
import { MAP_ENTRIES } from "@/lib/geo-map";
import { OBLIGATION_SECTIONS } from "@/lib/obligations";

export const metadata: Metadata = {
  title: "AlltÍkerfi",
  description:
    "A sourced atlas of how Iceland is wired: the budget, power and exports, the state and its bank.",
};

export default function HomePage() {
  const entries = getCatalog();
  const edges = getEdges();
  const offices = getOffices();
  const treaties = getTreaties();

  return (
    <main className="min-w-0">
      <HomeDashboard
        edgeCount={edges.length}
        entries={entries}
        mapPinCount={MAP_ENTRIES.length}
        obligationThemeCount={OBLIGATION_SECTIONS.length}
        officeCount={offices.length}
        searchDocs={toSearchDocs(entries)}
        treatyCount={treaties.length}
      />
    </main>
  );
}
