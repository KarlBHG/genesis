import type { Metadata } from "next";
import Link from "next/link";

import { ConnectionStrips } from "@/components/connection-graph";
import { PageHero } from "@/components/page-hero";
import { SearchPanel } from "@/components/search-panel";
import { getCatalog, getEdges, toSearchDocs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Overview",
  description: "Budget drawing and search for the Iceland system map.",
};

export default function OverviewPage() {
  const entries = getCatalog();
  const edges = getEdges();
  const counts = [
    { label: "Treaties", count: entries.filter((entry) => entry.kind === "treaty").length, href: "/treaties" },
    { label: "Institutions", count: entries.filter((entry) => entry.kind === "institution").length, href: "/institutions" },
    { label: "Events", count: entries.filter((entry) => entry.kind === "event").length, href: "/events" },
    { label: "Business", count: entries.filter((entry) => entry.kind === "sector").length, href: "/business" },
    { label: "Money", count: entries.filter((entry) => entry.kind === "flow").length, href: "/money" },
    { label: "Players", count: entries.filter((entry) => entry.kind === "player").length, href: "/players" },
    { label: "Connections", count: edges.length, href: "/connections" },
  ];

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description={
          <>
            Alþingi passes a budget that funds the ministries. The reading of
            the state, the central bank, and the named trade partners is on{" "}
            <Link className="text-foreground underline underline-offset-4" href="/system">
              System
            </Link>
            .
          </>
        }
        eyebrow="Iceland system map"
        title="Map how Iceland is wired."
      />
      <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-4 py-10 sm:px-6">
        <ConnectionStrips edges={edges} only="budget" />
        <div className="glass-panel p-6 sm:p-8">
          <SearchPanel docs={toSearchDocs(entries)} />
        </div>
        <nav
          aria-label="Sections"
          className="overview-sections grid grid-cols-1 gap-3 lg:grid-cols-4"
        >
          {counts.map((item) => (
            <Link
              className="glass-panel ink-card px-4 py-3"
              href={item.href}
              key={item.href}
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {item.label}
              </span>
              <span className="mt-1 block font-serif text-2xl tabular-nums">
                {item.count}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
