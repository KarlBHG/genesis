import Link from "next/link";

import { SearchPanel } from "@/components/search-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCatalog, getEdges, hrefFor, toSearchDocs } from "@/lib/content";

const FEATURED = ["eea-agreement", "sedlabanki", "1994-eea-entry"];

export default function HomePage() {
  const entries = getCatalog();
  const treaties = entries.filter((entry) => entry.kind === "treaty").length;
  const institutions = entries.filter(
    (entry) => entry.kind === "institution",
  ).length;
  const events = entries.filter((entry) => entry.kind === "event").length;
  const sectors = entries.filter((entry) => entry.kind === "sector").length;
  const flows = entries.filter((entry) => entry.kind === "flow").length;
  const players = entries.filter((entry) => entry.kind === "player").length;
  const connections = getEdges().length;
  const featured = FEATURED.map((slug) =>
    entries.find((entry) => entry.slug === slug),
  ).filter((entry) => entry != null);

  const counts = [
    {
      label: "Treaties",
      count: treaties,
      href: "/treaties",
      text: "EEA, EFTA, NATO, Schengen.",
    },
    {
      label: "Institutions",
      count: institutions,
      href: "/institutions",
      text: "Alþingi, Seðlabanki Íslands, the finance ministry.",
    },
    {
      label: "Events",
      count: events,
      href: "/events",
      text: "A dated list, from EEA entry to the 2008 program.",
    },
    {
      label: "Business",
      count: sectors,
      href: "/business",
      text: "Fisheries, agriculture, power, tourism, banking after 2008, and healthcare.",
    },
    {
      label: "Money",
      count: flows,
      href: "/money",
      text: "Goods exports and imports, and other published aggregates, each labeled with its year.",
    },
    {
      label: "Players",
      count: players,
      href: "/players",
      text: "Organizations and people in a public office.",
    },
    {
      label: "Connections",
      count: connections,
      href: "/connections",
      text: "Typed links taken from entry frontmatter.",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">Iceland system map</p>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Map how Iceland is wired.
        </h1>
        <p className="text-lg text-muted-foreground">
          Treaties, institutions, events, and a public-record layer for sectors, money flows, and office-holders. Icelandic names stay in Icelandic: Alþingi, Seðlabanki Íslands, the króna.
        </p>
      </section>
      <SearchPanel docs={toSearchDocs(entries)} />
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.count}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{item.text}</p>
            </CardContent>
            <CardFooter>
              <Button
                nativeButton={false}
                render={<Link href={item.href} />}
                variant="outline"
              >
                Open {item.label.toLowerCase()}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Start here</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {featured.map((entry) => (
            <Card key={entry.slug}>
              <CardHeader>
                <CardTitle>
                  <Link className="underline underline-offset-4" href={hrefFor(entry)}>{entry.title}</Link>
                </CardTitle>
                <CardDescription>{entry.summary}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
