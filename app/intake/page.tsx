import type { Metadata } from "next";
import Link from "next/link";

import { HashScroll } from "@/components/hash-scroll";
import { PasteIntakeForm } from "@/components/paste-intake-form";
import { PageHero } from "@/components/page-hero";
import { QuotedNameForm } from "@/components/quoted-name-ledger";
import { getCatalog, getOffices, getPolicyAreas } from "@/lib/content";
import { intakePersistAllowed } from "@/lib/edge-intake";
import { readQuotedNameQueue } from "@/lib/quoted-names";

export const metadata: Metadata = {
  title: "Paste a sourced line",
  description:
    "Propose a typed edge from an official URL, a verbatim quotation, an allowlisted relationship, and two existing records. Nothing is scraped. Nothing is invented.",
};

export default function IntakePage() {
  const endpoints = [
    ...getCatalog().map((entry) => ({
      id: entry.slug,
      title: entry.title,
      kind: entry.kind,
      playerType: entry.kind === "player" ? entry.playerType : undefined,
    })),
    ...getOffices().map((office) => ({
      id: office.id,
      title: office.title,
      kind: "office" as const,
    })),
  ];
  const policyAreas = getPolicyAreas().map((area) => ({
    slug: area.slug,
    title: area.title,
  }));

  const quotedNames = readQuotedNameQueue();

  return (
    <main className="dashboard-canvas min-w-0">
      <HashScroll />
      <PageHero
        description={
          <>
            A connection here is a pointer at somebody else’s sentence. Paste
            the address, the sentence, the allowlisted relationship, and two
            records that already exist. The contract is the same as{" "}
            <Link className="underline underline-offset-4" href="/methodology">
              Methodology
            </Link>
            : six fields, no invented type, no figure that is not in the
            quotation, no summed total. A name the sentence prints that is not
            in the catalog is filed as an unmatched placeholder — not a stub
            player.
          </>
        }
        eyebrow="Local review · not a scraper"
        title="Paste a sourced line"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-reading flex-col gap-8 px-4 py-10 sm:px-6">
        <ul className="flex min-w-0 flex-col gap-2 text-sm leading-6 text-muted-foreground">
          <li>This page does not fetch the URL you paste.</li>
          <li>It does not call a language model, local or remote.</li>
          <li>
            It never writes <code className="text-sm">data/edges.json</code>{" "}
            for you. A passing check can be queued in{" "}
            <code className="text-sm">data/intake-queue.json</code> on a
            local/dev tree.
          </li>
          <li>
            Official Opnir invoice rows have their own review step at{" "}
            <Link className="underline underline-offset-4" href="/intake/opnir">
              Review official Opnir rows
            </Link>
            , because a pays line still needs a human program join or a null
            reason.
          </li>
          <li>
            A cited name with no catalog slug and no office id goes on the{" "}
            <a className="underline underline-offset-4" href="#quoted-names">
              quoted-name ledger
            </a>
            . Unmatched stays unmatched.
          </li>
        </ul>
        <PasteIntakeForm
          endpoints={endpoints}
          persistAllowed={intakePersistAllowed()}
          policyAreas={policyAreas}
        />
        <QuotedNameForm
          initialItems={quotedNames.items}
          persistAllowed={intakePersistAllowed()}
        />
      </div>
    </main>
  );
}
