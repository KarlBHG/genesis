import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { TreatyBrowser } from "@/components/treaty-browser";
import { getTreaties } from "@/lib/content";
import { dateSortKey } from "@/lib/format";

export const metadata: Metadata = {
  title: "Treaties",
  description: "Treaties in the Iceland system map.",
};

export default function TreatiesPage() {
  const treaties = getTreaties();
  const items = treaties
    .slice()
    .sort((a, b) => dateSortKey(a.signed).localeCompare(dateSortKey(b.signed)))
    .map((treaty) => ({
      title: treaty.title,
      href: `/treaties/${treaty.slug}`,
      summary: treaty.summary,
      status: treaty.status,
      topics: treaty.topics,
      signed: treaty.signed,
    }));

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description={
          <>
            Agreements Iceland is party to, grouped by status. Topics can be
            combined. For security, EEA/EFTA, trade, and crisis commitments by
            theme, see{" "}
            <Link className="text-foreground underline underline-offset-4" href="/obligations">
              Obligations
            </Link>
            .
          </>
        }
        eyebrow={`${treaties.length} records · sourced`}
        size="dramatic"
        title="Treaties"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <TreatyBrowser items={items} />
      </div>
    </main>
  );
}
