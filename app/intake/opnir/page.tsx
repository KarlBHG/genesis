import type { Metadata } from "next";
import Link from "next/link";

import { OpnirReviewFeed } from "@/components/opnir-review-feed";
import { PageHero } from "@/components/page-hero";
import { getCatalog, getOffices, getPolicyAreas } from "@/lib/content";
import { intakePersistAllowed } from "@/lib/edge-intake";
import { readOpnirReviewQueue } from "@/lib/opnir-review";

export const metadata: Metadata = {
  title: "Review official Opnir rows",
  description:
    "Take official opnirreikningar.is invoice rows — from a paste, a fixture, or already-stored pays — into a review queue. A human confirms the program join. Nothing is scraped. No málaflok is invented.",
};

export default function OpnirIntakePage() {
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
  const queuedItems = intakePersistAllowed()
    ? readOpnirReviewQueue().items
    : [];

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description={
          <>
            An Opnir row is one payment a named buyer made to a named vendor on
            a named day. Put official CSV, JSON, or ledger lines into review,
            then confirm a policy-area join from a cited page — or store why the
            join was not made. The live ledger is not fetched. Amounts are not
            added together. The contract is the same as{" "}
            <Link className="underline underline-offset-4" href="/methodology">
              Methodology
            </Link>
            .
          </>
        }
        eyebrow="Local review · not a scraper"
        title="Review official Opnir rows"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-reading flex-col gap-8 px-4 py-10 sm:px-6">
        <ul className="flex min-w-0 flex-col gap-2 text-sm leading-6 text-muted-foreground">
          <li>
            This page does not crawl opnirreikningar.is. Use a paste, the
            bundled fixture, or already-stored pays quotations.
          </li>
          <li>
            A printed málaflokkur stays printed text. Vendor line of business is
            not a program. No language model is called.
          </li>
          <li>
            Saving review writes{" "}
            <code className="text-sm">data/opnir-review-queue.json</code>. A
            confirmed row can be queued to{" "}
            <code className="text-sm">data/intake-queue.json</code>.{" "}
            <code className="text-sm">data/edges.json</code> is never written
            here. Promote by hand after{" "}
            <Link className="underline underline-offset-4" href="/intake">
              Paste a sourced line
            </Link>{" "}
            would still pass.
          </li>
        </ul>
        <OpnirReviewFeed
          endpoints={endpoints}
          persistAllowed={intakePersistAllowed()}
          policyAreas={policyAreas}
          queuedItems={queuedItems}
        />
      </div>
    </main>
  );
}
