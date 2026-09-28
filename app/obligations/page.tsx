import type { Metadata } from "next";
import Link from "next/link";

import { getTreaties } from "@/lib/content";
import { OBLIGATION_SECTIONS } from "@/lib/obligations";

export const metadata: Metadata = {
  title: "Obligations and contributions",
  description:
    "Security, European integration, trade agreements, crisis-era financial commitments, and where the domestic budget records spending.",
};

export default function ObligationsPage() {
  const treatyCount = getTreaties().length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-medium tracking-tight">
          Obligations and contributions
        </h1>
        <p className="text-muted-foreground">
          Iceland’s international commitments grouped by theme. Each line links to
          a map entry with primary-source quotations. Open{" "}
          <Link className="underline underline-offset-4" href="/treaties">
            Treaties
          </Link>{" "}
          for the full {treatyCount} agreement records, or{" "}
          <Link className="underline underline-offset-4" href="/connections">
            Connections
          </Link>{" "}
          to filter the evidence graph.
        </p>
      </header>

      {OBLIGATION_SECTIONS.map((section) => (
        <section
          className="flex max-w-3xl flex-col gap-4 scroll-mt-20"
          id={section.id}
          key={section.id}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium">{section.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{section.lead}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {section.items.map((item) => (
              <li className="rounded-xl border p-4" key={item.href}>
                <Link
                  className="font-medium underline underline-offset-4"
                  href={item.href}
                >
                  {item.label}
                </Link>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
          {section.footnote ? (
            <p className="text-sm text-muted-foreground">{section.footnote}</p>
          ) : null}
        </section>
      ))}
    </main>
  );
}
