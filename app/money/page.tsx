import type { Metadata } from "next";
import Link from "next/link";

import { EntryIndex } from "@/components/entry-index";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOtherFlows, getPolicyAreas, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Money",
  description:
    "Trade, pensions, power sales, and Treasury totals. The 2026 budget policy areas live under Programs.",
};

export default function MoneyPage() {
  const areas = getPolicyAreas();
  const items = getOtherFlows().map((flow) => ({
    title: flow.title,
    href: hrefFor(flow),
    summary: flow.summary,
    meta: flow.year,
  }));

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Money</h1>
        <p className="text-muted-foreground">
          Trade, pensions, power sales, and Treasury totals. Published
          aggregates only. Each entry names the year on the source. A figure
          that was not on a page opened for this map is not here.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>
            <Link className="underline underline-offset-4" href="/programs">
              Government programs, 2026
            </Link>
          </CardTitle>
          <CardDescription className="flex flex-col gap-2">
            <Badge className="w-fit" variant="outline">
              {areas.length} policy areas
            </Badge>
            <span>
              The 2026 budget&apos;s policy areas, what their ministry reports
              say they do, and the Article 4 authorisation rows. Rows are not
              added together.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Other money flows</h2>
        <EntryIndex items={items} />
      </section>
    </main>
  );
}
