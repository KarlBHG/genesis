import type { Metadata } from "next";
import Link from "next/link";

import { SearchPanel } from "@/components/search-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCatalog, getEdges, getOffices, toSearchDocs } from "@/lib/content";
import { labelize } from "@/lib/format";
import { LANDING_CHAINS, resolveChain } from "@/lib/landing";

export const metadata: Metadata = {
  title: "AlltÍkerfi",
  description:
    "A sourced atlas of how Iceland is wired: the budget, power and exports, the state and its bank.",
};

export default function HomePage() {
  const entries = getCatalog();
  const edges = getEdges();
  const offices = getOffices();

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="text-sm tracking-wide text-muted-foreground uppercase">
          AlltÍkerfi · a sourced atlas of Iceland
        </p>
        <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
          How Iceland is wired.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Every line below is a sentence from a public record: a budget law, a
          company report, a statute, or an invoice. Nothing is an influence
          score.{" "}
          <Link className="underline underline-offset-4" href="/system">
            How to read this map
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/map" />}>
            Open the map
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/programs" />}
            variant="outline"
          >
            Budget programs
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/connections" />}
            variant="outline"
          >
            All connections
          </Button>
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-xl font-medium">Five chains to start from</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LANDING_CHAINS.map((chain) => (
            <Card key={chain.id}>
              <CardHeader>
                <CardTitle>
                  <Link
                    className="underline underline-offset-4"
                    href={chain.href}
                  >
                    {chain.title}
                  </Link>
                </CardTitle>
                <CardDescription>{chain.blurb}</CardDescription>
                <ol className="flex flex-col gap-2 pt-2">
                  {resolveChain(chain).map((step, index) => (
                    <li
                      className="text-sm leading-6"
                      key={`${step.fromTitle}-${step.toTitle}-${index}`}
                    >
                      {step.fromHref ? (
                        <Link
                          className="font-medium underline underline-offset-4"
                          href={step.fromHref}
                        >
                          {step.fromTitle}
                        </Link>
                      ) : (
                        <span className="font-medium">{step.fromTitle}</span>
                      )}{" "}
                      <span className="text-muted-foreground">
                        {labelize(step.relationship).toLowerCase()}
                        {step.year ? ` · ${step.year}` : ""}
                      </span>{" "}
                      {step.toHref ? (
                        <Link
                          className="font-medium underline underline-offset-4"
                          href={step.toHref}
                        >
                          {step.toTitle}
                        </Link>
                      ) : (
                        <span className="font-medium">{step.toTitle}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-xl font-medium">Search the records</h2>
        <SearchPanel docs={toSearchDocs(entries)} />
      </section>

      <nav
        aria-label="Catalog totals"
        className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
      >
        <span>
          {entries.length} entries · {edges.length} typed connections ·{" "}
          {offices.length} offices
        </span>
      </nav>
    </main>
  );
}
