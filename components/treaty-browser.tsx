"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDate, labelize } from "@/lib/format";

export type TreatyItem = {
  title: string;
  href: string;
  summary: string;
  status: string;
  topics: string[];
  signed: string;
};

function unique(values: string[]) {
  return [...new Set(values)].sort();
}

function treatyMeta(item: TreatyItem): string {
  const parts = [`Signed ${formatDate(item.signed)}`];
  for (const topic of item.topics) parts.push(labelize(topic));
  return parts.join(" · ");
}

export function TreatyBrowser({ items }: { items: TreatyItem[] }) {
  const [status, setStatus] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const statuses = unique(items.map((item) => item.status));
  const topicOptions = unique(items.flatMap((item) => item.topics));

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (status.length > 0 && !status.includes(item.status)) return false;
        if (topics.length > 0 && !topics.every((topic) => item.topics.includes(topic))) {
          return false;
        }
        return true;
      }),
    [items, status, topics],
  );

  const groups = new Map<string, TreatyItem[]>();
  for (const item of filtered) {
    const list = groups.get(item.status) ?? [];
    list.push(item);
    groups.set(item.status, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="folio-facet">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Status</p>
          <ToggleGroup
            className="flex max-w-full flex-wrap"
            onValueChange={setStatus}
            size="sm"
            spacing={1}
            value={status}
            variant="outline"
          >
            {statuses.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {labelize(value)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Topics, matched together
          </p>
          <ToggleGroup
            className="flex max-w-full flex-wrap"
            multiple
            onValueChange={setTopics}
            size="sm"
            spacing={1}
            value={topics}
            variant="outline"
          >
            {topicOptions.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {labelize(value)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No treaties match</EmptyTitle>
            <EmptyDescription>
              Clear a topic or status. Topics are combined, so two topics that never appear on the same treaty return nothing.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        [...groups.entries()].map(([group, groupItems]) => (
          <section className="flex flex-col gap-3" key={group}>
            <h2 className="font-serif text-xl font-medium tracking-tight">
              {labelize(group)}
            </h2>
            <ul className="folio-index">
              {groupItems.map((item) => (
                <li className="folio-index-row" key={item.href}>
                  <p className="folio-index-meta">{treatyMeta(item)}</p>
                  <Link className="folio-index-title" href={item.href}>
                    {item.title}
                  </Link>
                  <p className="folio-index-summary">{item.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
