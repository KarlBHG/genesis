import type { Metadata } from "next";
import Link from "next/link";

import { getCatalog, getContradictions, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contradictions",
  description: "Two public sentences about the same entries, kept side by side.",
};

export default function ContradictionsPage() {
  const bySlug = new Map(getCatalog().map((entry) => [entry.slug, entry]));
  const records = getContradictions();

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Contradictions</h1>
        <p className="text-muted-foreground">
          Each record is two quotations from pages that were opened. The page names the entries they concern. It does not pick a winner, and it does not call the disagreement influence.
        </p>
      </header>
      {records.length === 0 ? (
        <p className="text-muted-foreground">No contradictions are on file.</p>
      ) : (
        <ol className="flex min-w-0 flex-col gap-4">
          {records.map((record) => (
            <li className="flex min-w-0 flex-col gap-3 rounded-lg border p-4" key={record.id}>
              <p className="break-words">{record.summary}</p>
              <p className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm">
                {record.entries.map((slug) => {
                  const entry = bySlug.get(slug);
                  if (!entry) return null;
                  return (
                    <Link className="underline underline-offset-4" href={hrefFor(entry)} key={slug}>
                      {entry.title}
                    </Link>
                  );
                })}
              </p>
              <ul className="flex min-w-0 flex-col gap-3">
                {record.sides.map((side) => (
                  <li className="min-w-0" key={side.quotation}>
                    <blockquote className="break-words border-l-2 pl-3 text-sm leading-6">
                      {side.quotation}
                    </blockquote>
                    <a
                      className="mt-1 block break-all text-sm text-muted-foreground underline underline-offset-4"
                      href={side.source}
                    >
                      {side.source}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
