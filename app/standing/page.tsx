import type { Metadata } from "next";
import Link from "next/link";

import { HashScroll } from "@/components/hash-scroll";
import { PageHero } from "@/components/page-hero";
import { ResidentStanding } from "@/components/resident-standing";
import { getCatalog, getEdges } from "@/lib/content";
import {
  buildStandingBoard,
  isValidMunicipality,
  isValidProgram,
  standingQuestions,
} from "@/lib/standing";

export const metadata: Metadata = {
  title: "Resident standing",
  description:
    "Three questions a resident can ask of the public record: as a taxpayer, as a depositor in a state-owned bank, and as a voter after 30 November 2024. Each hop is a stored edge with a permalink, or no sourced line.",
};

export default async function StandingPage({
  searchParams,
}: {
  searchParams: Promise<{ municipality?: string; program?: string }>;
}) {
  const params = await searchParams;
  const catalog = getCatalog();
  const edges = getEdges();
  const board = buildStandingBoard(catalog);
  const municipality = isValidMunicipality(
    params.municipality,
    board.municipalities,
  )
    ? params.municipality
    : null;
  const program = isValidProgram(params.program, board.programs)
    ? params.program
    : board.defaultProgramSlug;
  const questions = standingQuestions(program, municipality, edges, catalog);

  return (
    <main className="dashboard-canvas min-w-0">
      <HashScroll />
      <PageHero
        description={
          <>
            TheyWorkForYou started from a question a resident can answer without
            the org chart. These three walks use only typed edges already on
            file. A missing hop prints{" "}
            <span className="text-foreground">no sourced line</span>. The
            contract is on{" "}
            <Link className="underline underline-offset-4" href="/methodology#standing">
              Methodology
            </Link>
            . How to read the map is on{" "}
            <Link className="underline underline-offset-4" href="/system">
              System
            </Link>
            .
          </>
        }
        eyebrow="Resident standing · not a postcode"
        folio="Standing"
        title="See their standing"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-8 px-4 py-10 sm:px-6">
        <ResidentStanding
          board={board}
          municipalitySlug={municipality}
          programSlug={program}
          questions={questions}
        />
      </div>
    </main>
  );
}
