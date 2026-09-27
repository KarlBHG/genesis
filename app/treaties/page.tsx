import type { Metadata } from "next";

import { TreatyBrowser } from "@/components/treaty-browser";
import { getTreaties } from "@/lib/content";
import { dateSortKey } from "@/lib/format";

export const metadata: Metadata = {
  title: "Treaties",
  description: "Treaties in the Iceland system map.",
};

export default function TreatiesPage() {
  const items = getTreaties()
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Treaties</h1>
        <p className="text-muted-foreground">
          Agreements Iceland is party to, grouped by status. Topics can be combined.
        </p>
      </header>
      <TreatyBrowser items={items} />
    </main>
  );
}
