import type { Metadata } from "next";

import { EntryIndex } from "@/components/entry-index";
import { getSectors, hrefFor } from "@/lib/content";
import { labelize } from "@/lib/format";

export const metadata: Metadata = {
  title: "Business",
  description: "Main sectors of the Icelandic economy, with sources.",
};

export default function BusinessPage() {
  const items = getSectors()
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "en"))
    .map((sector) => ({
      title: sector.title,
      href: hrefFor(sector),
      summary: sector.summary,
      meta: labelize(sector.area),
    }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Business</h1>
        <p className="text-muted-foreground">
          How the main sectors are structured. Figures are only those a cited release or report states, with the year on the figure.
        </p>
      </header>
      <EntryIndex items={items} />
    </main>
  );
}
