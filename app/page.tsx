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
import {
  buildStandingBoard,
  isValidMunicipality,
  isValidProgram,
  standingQuestions,
} from "@/lib/standing";

export const metadata: Metadata = {
  title: "AlltÍkerfi",
  description:
    "A sourced atlas of how Iceland is wired: the budget, power and exports, the state and its bank.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ municipality?: string; program?: string }>;
}) {
  const params = await searchParams;
  const entries = getCatalog();
  const edges = getEdges();
  const offices = getOffices();
  const treaties = getTreaties();
  const board = buildStandingBoard(entries);
  const municipality = isValidMunicipality(
    params.municipality,
    board.municipalities,
  )
    ? params.municipality
    : null;
  const program = isValidProgram(params.program, board.programs)
    ? params.program
    : board.defaultProgramSlug;

  return (
    <main className="min-w-0">
      <HomeDashboard
        edgeCount={edges.length}
        entries={entries}
        mapPinCount={MAP_ENTRIES.length}
        obligationThemeCount={OBLIGATION_SECTIONS.length}
        officeCount={offices.length}
        searchDocs={toSearchDocs(entries)}
        standing={{
          board,
          municipalitySlug: municipality,
          programSlug: program,
          questions: standingQuestions(program, municipality, edges, entries),
        }}
        treatyCount={treaties.length}
      />
    </main>
  );
}
