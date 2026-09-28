import type { Metadata } from "next";

import { EventTimeline } from "@/components/event-timeline";
import { PageHero } from "@/components/page-hero";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { edgesFor, getEvents, resolveSlug } from "@/lib/content";
import { formatDate, labelize, yearOf } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events",
  description: "A chronological list of events in the Iceland system map.",
};

export default function EventsPage() {
  const events = getEvents().map((event) => {
    const graph = edgesFor(event.slug);
    const connectionCount = graph.inn.length + graph.out.length;
    return {
    slug: event.slug,
    title: event.title,
    date: event.date,
    dateLabel: formatDate(event.date),
    yearOnly: /^\d{4}$/.test(event.date),
    year: yearOf(event.date),
    type: event.type,
    typeLabel: labelize(event.type),
    summary: event.summary,
    connectionCount,
    related: event.related.map((slug) => {
      const target = resolveSlug(slug);
      return target
        ? { slug, title: target.title, href: target.href }
        : { slug, title: slug, href: "" };
    }),
  };
  });

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="Oldest first. Filter by type, or reverse the order. Open a title to see what it links to. A full date is shown when the source gave one; otherwise the year."
        eyebrow={`${events.length} dated entries`}
        title="Events"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
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
        <EventTimeline events={events} />
      )}
      </div>
    </main>
  );
}
