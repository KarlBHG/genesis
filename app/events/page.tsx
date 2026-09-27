import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getEvents } from "@/lib/content";
import { dateSortKey, formatDate, labelize, yearOf } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events",
  description: "A chronological list of events in the Iceland system map.",
};

export default function EventsPage() {
  const events = getEvents()
    .slice()
    .sort((a, b) => dateSortKey(a.date).localeCompare(dateSortKey(b.date)));

  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const year = yearOf(event.date);
    const list = groups.get(year) ?? [];
    list.push(event);
    groups.set(year, list);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          A chronological list, earliest first. This is not a chart.
        </p>
      </header>
      {events.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No events yet</EmptyTitle>
            <EmptyDescription>
              Dated entries will show here, earliest first.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        [...groups.entries()].map(([year, group]) => (
          <section className="flex flex-col gap-3" key={year}>
            <h2 className="text-lg font-medium">{year}</h2>
            <ol className="flex flex-col gap-3">
              {group.map((event) => (
                <li key={event.slug}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Link className="underline underline-offset-4" href={`/events/${event.slug}`}>{event.title}</Link>
                      </CardTitle>
                      <CardDescription>{event.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{formatDate(event.date)}</Badge>
                      <Badge variant="outline">{labelize(event.type)}</Badge>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </main>
  );
}
