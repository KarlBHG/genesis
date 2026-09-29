"use client";

import { useMemo, useState } from "react";
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
      <div className="glass-panel flex flex-col gap-5 p-5 sm:p-6">
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {groupItems.map((item) => (
                <Card
                  className="glass-panel border-border/60 bg-card/50 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  key={item.href}
                >
                  <CardHeader>
                    <CardTitle>
                      <Link className="underline underline-offset-4" href={item.href}>{item.title}</Link>
                    </CardTitle>
                    <CardDescription>{item.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    <Badge variant="secondary">Signed {formatDate(item.signed)}</Badge>
                    {item.topics.map((topic) => (
                      <Badge key={topic} variant="outline">
                        {labelize(topic)}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
