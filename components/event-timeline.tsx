"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { dateSortKey } from "@/lib/format";
import { foldedIncludes } from "@/lib/search";

export type TimelineRelated = {
  slug: string;
  title: string;
  href: string;
};

export type TimelineEvent = {
  slug: string;
  title: string;
  date: string;
  dateLabel: string;
  yearOnly: boolean;
  year: string;
  type: string;
  typeLabel: string;
  summary: string;
  connectionCount: number;
  related: TimelineRelated[];
};

const TYPE_ORDER = [
  "founding",
  "treaty-entry",
  "agreement",
  "crisis",
  "program",
  "referendum",
  "judgment",
  "election",
];

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const type = params.get("type") ?? "all";
  const query = params.get("q") ?? "";
  const newestFirst = params.get("sort") === "newest";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const types = useMemo(() => {
    const present = new Set(events.map((event) => event.type));
    const ordered = TYPE_ORDER.filter((item) => present.has(item));
    for (const item of present) {
      if (!ordered.includes(item)) ordered.push(item);
    }
    return ordered.map((item) => ({
      id: item,
      label: events.find((event) => event.type === item)?.typeLabel ?? item,
      count: events.filter((event) => event.type === item).length,
    }));
  }, [events]);

  const visible = useMemo(() => {
    const filtered = events.filter((event) => {
      if (type !== "all" && event.type !== type) return false;
      return foldedIncludes(
        `${event.title} ${event.summary} ${event.typeLabel} ${event.dateLabel}`,
        query,
      );
    });
    return filtered.sort((a, b) => {
      const order = dateSortKey(a.date).localeCompare(dateSortKey(b.date));
      return newestFirst ? -order : order;
    });
  }, [events, newestFirst, query, type]);

  const groups = useMemo(() => {
    const grouped = new Map<string, TimelineEvent[]>();
    for (const event of visible) {
      const list = grouped.get(event.year) ?? [];
      list.push(event);
      grouped.set(event.year, list);
    }
    return [...grouped.entries()];
  }, [visible]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 print:hidden">
        <label className="flex w-full flex-col gap-1.5 sm:max-w-sm">
          <span className="text-sm text-muted-foreground">Find an event</span>
          <Input
            onChange={(event) => setParam("q", event.target.value)}
            placeholder="Type a name or a word from the record"
            type="search"
            value={query}
          />
        </label>
        <div
          aria-label="Filter events by type"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          role="group"
        >
          <Button
            aria-pressed={type === "all"}
            className="shrink-0"
            onClick={() => setParam("type", "")}
            size="sm"
            variant={type === "all" ? "secondary" : "outline"}
          >
            All
            <Badge variant="outline">{events.length}</Badge>
          </Button>
          {types.map((item) => (
            <Button
              aria-pressed={type === item.id}
              className="shrink-0"
              key={item.id}
              onClick={() => setParam("type", item.id)}
              size="sm"
              variant={type === item.id ? "secondary" : "outline"}
            >
              {item.label}
              <Badge variant="outline">{item.count}</Badge>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div aria-label="Sort events" className="flex gap-2" role="group">
            <Button
              aria-pressed={!newestFirst}
              onClick={() => setParam("sort", "")}
              size="sm"
              variant={newestFirst ? "outline" : "secondary"}
            >
              Oldest first
            </Button>
            <Button
              aria-pressed={newestFirst}
              onClick={() => setParam("sort", "newest")}
              size="sm"
              variant={newestFirst ? "secondary" : "outline"}
            >
              Newest first
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {visible.length} of {events.length} events
          </span>
          {type !== "all" || query || newestFirst ? (
            <Button
              nativeButton={false}
              render={<Link href={pathname} scroll={false} />}
              size="sm"
              variant="outline"
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No events match</EmptyTitle>
            <EmptyDescription>
              {query
                ? `No dated entry contains “${query}”. Search folds Icelandic accents, so “Althingi” and “Alþingi” are the same query.`
                : "Choose another type, or show all events."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        groups.map(([year, group]) => (
          <section className="flex flex-col gap-3" key={year}>
            <h2 className="text-lg font-medium">{year}</h2>
            <ol className="flex flex-col gap-3">
              {group.map((event) => {
                const open = openSlug === event.slug;
                return (
                  <li key={event.slug}>
                    <Card>
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{event.dateLabel}</Badge>
                          {event.yearOnly ? (
                            <Badge variant="outline">Year only</Badge>
                          ) : null}
                          <Badge variant="outline">{event.typeLabel}</Badge>
                          {event.connectionCount > 0 ? (
                            <Badge variant="outline">
                              {event.connectionCount} typed{" "}
                              {event.connectionCount === 1 ? "edge" : "edges"}
                            </Badge>
                          ) : null}
                        </div>
                        <CardTitle>
                          <button
                            aria-expanded={open}
                            className="text-left underline underline-offset-4"
                            data-print-keep
                            onClick={() =>
                              setOpenSlug(open ? null : event.slug)
                            }
                            type="button"
                          >
                            {event.title}
                          </button>
                        </CardTitle>
                        <CardDescription>{event.summary}</CardDescription>
                      </CardHeader>
                      {open ? (
                        <CardContent className="flex flex-col gap-3">
                          {event.connectionCount > 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {event.connectionCount} sourced connection
                              {event.connectionCount === 1 ? "" : "s"} in{" "}
                              <code className="text-xs">data/edges.json</code>
                              . Open the entry for the full list with quotations.
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No typed edges yet — only Markdown{" "}
                              <code className="text-xs">related</code> links below.
                            </p>
                          )}
                          <h3 className="text-sm font-medium">Related</h3>
                          {event.related.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              None recorded.
                            </p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {event.related.map((item) =>
                                item.href ? (
                                  <li key={item.slug}>
                                    <Link
                                      className="underline underline-offset-4"
                                      href={item.href}
                                    >
                                      {item.title}
                                    </Link>
                                  </li>
                                ) : (
                                  <li key={item.slug}>
                                    <Badge variant="outline">
                                      Unresolved reference: {item.slug}
                                    </Badge>
                                  </li>
                                ),
                              )}
                            </ul>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              nativeButton={false}
                              render={<Link href={`/events/${event.slug}`} />}
                              size="sm"
                              variant="outline"
                            >
                              Open event
                            </Button>
                            {event.connectionCount > 0 ? (
                              <Button
                                nativeButton={false}
                                render={
                                  <Link
                                    href={`/connections?entry=${event.slug}`}
                                  />
                                }
                                size="sm"
                                variant="outline"
                              >
                                Typed connections
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}
