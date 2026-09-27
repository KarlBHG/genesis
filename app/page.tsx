import Link from "next/link";

import { ConnectionStrips } from "@/components/connection-graph";
import { SearchPanel } from "@/components/search-panel";
import { getCatalog, getEdges, toSearchDocs } from "@/lib/content";

export default function HomePage() {
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
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <section className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm text-muted-foreground">Iceland system map</p>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Map how Iceland is wired.
        </h1>
        <p className="text-lg text-muted-foreground">
          Alþingi passes a budget that funds the ministries. The constitution calls Iceland a republic. The central-bank act puts the bank in the state’s ownership, under a minister the act defines as the Prime Minister except where it names the finance minister. Statistics Iceland names the largest goods-import countries and does not name the selling companies.
        </p>
      </section>
      <ConnectionStrips edges={edges} only="budget" />
      <SearchPanel docs={toSearchDocs(entries)} />
      <nav aria-label="Sections" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {counts.map((item) => (
          <Link className="underline underline-offset-4" href={item.href} key={item.href}>
            {item.label} {item.count}
          </Link>
        ))}
      </nav>
    </main>
  );
}
