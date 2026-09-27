import type { Metadata } from "next";

import { EntryIndex } from "@/components/entry-index";
import { getFlows, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Money",
  description: "Published money-flow aggregates for Iceland, each labeled with a year.",
};

export default function MoneyPage() {
  const items = getFlows()
    .slice()
    .sort((a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title, "en"))
    .map((flow) => ({
      title: flow.title,
      href: hrefFor(flow),
      summary: flow.summary,
      meta: flow.year,
    }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Money</h1>
        <p className="text-muted-foreground">
          Published aggregates only. Each entry names the year on the source. A figure that was not on a page opened for this map is not here.
        </p>
      </header>
      <EntryIndex items={items} />
    </main>
  );
}
