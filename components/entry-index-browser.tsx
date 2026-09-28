"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { foldedIncludes, highlightParts } from "@/lib/search";

export type IndexItem = {
  slug: string;
  title: string;
  href: string;
  /** Authored lede when there is one, otherwise the extracted summary. */
  lead: string;
  authoredLede: boolean;
  /** Facet id → the values this item carries. */
  facets: Record<string, string[]>;
  /** Sortable date key, `00000000` when the record is undated. */
  dateKey: string;
  dateLabel: string;
  degree: number;
  sources: number;
  /** Extra text the query should match, beyond title and lead. */
  keywords: string;
};

export type IndexFacet = {
  id: string;
  label: string;
  /** `all` requires every selected value; `any` accepts one of them. */
  match: "any" | "all";
  options: { value: string; label: string }[];
};

export type SortId = "title" | "date" | "date-desc" | "connections";

const SORT_LABELS: Record<SortId, string> = {
  title: "A–Z",
  date: "Oldest",
  "date-desc": "Newest",
  connections: "Most connected",
};

const DEGREE_LABELS = {
  linked: "Has typed edges",
  unlinked: "No typed edges yet",
} as const;

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw.split(",").map((part) => part.trim()).filter(Boolean);
}

function matchesQuery(item: IndexItem, query: string): boolean {
  if (!query.trim()) return true;
  return foldedIncludes(
    `${item.title} ${item.lead} ${item.keywords}`,
    query,
  );
}

function matchesFacets(
  item: IndexItem,
  facets: IndexFacet[],
  selected: Record<string, string[]>,
  skip?: string,
): boolean {
  for (const facet of facets) {
    if (facet.id === skip) continue;
    const chosen = selected[facet.id] ?? [];
    if (chosen.length === 0) continue;
    const have = item.facets[facet.id] ?? [];
    const ok =
      facet.match === "all"
        ? chosen.every((value) => have.includes(value))
        : chosen.some((value) => have.includes(value));
    if (!ok) return false;
  }
  return true;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark className="rounded-sm bg-primary/15 px-0.5" key={index}>
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function EntryIndexBrowser({
  items,
  facets,
  sorts,
  defaultSort,
  groupBy,
  groupLabels,
  searchLabel,
  noun,
}: {
  items: IndexItem[];
  facets: IndexFacet[];
  sorts: SortId[];
  defaultSort: SortId;
  /** Facet id to group results under headings, when a facet is single-valued. */
  groupBy?: string;
  groupLabels?: Record<string, string>;
  searchLabel: string;
  /** Plural noun for counts and empty states, e.g. "institutions". */
  noun: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const query = params.get("q") ?? "";
  const sort = (params.get("sort") as SortId | null) ?? defaultSort;
  const degree = params.get("degree") ?? "";
  const selected = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const facet of facets) map[facet.id] = readList(params, facet.id);
    return map;
  }, [facets, params]);

  const setParam = useCallback(
    (key: string, value: string | string[]) => {
      const next = new URLSearchParams(params.toString());
      const flat = Array.isArray(value) ? value.join(",") : value;
      if (flat) next.set(key, flat);
      else next.delete(key);
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const activeCount =
    (query ? 1 : 0) +
    (degree ? 1 : 0) +
    facets.reduce((total, facet) => total + (selected[facet.id]?.length ?? 0), 0);

  const matchesDegree = useCallback(
    (item: IndexItem) => {
      if (degree === "linked") return item.degree > 0;
      if (degree === "unlinked") return item.degree === 0;
      return true;
    },
    [degree],
  );

  const visible = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        matchesQuery(item, query) &&
        matchesFacets(item, facets, selected) &&
        matchesDegree(item),
    );
    return filtered.sort((a, b) => {
      switch (sort) {
        case "date":
          return (
            a.dateKey.localeCompare(b.dateKey) ||
            a.title.localeCompare(b.title, "is")
          );
        case "date-desc":
          return (
            b.dateKey.localeCompare(a.dateKey) ||
            a.title.localeCompare(b.title, "is")
          );
        case "connections":
          return b.degree - a.degree || a.title.localeCompare(b.title, "is");
        default:
          return a.title.localeCompare(b.title, "is");
      }
    });
  }, [facets, items, matchesDegree, query, selected, sort]);

  /** Counts reflect every other active filter, so a zero option is honest. */
  const optionCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    for (const facet of facets) {
      const pool = items.filter(
        (item) =>
          matchesQuery(item, query) &&
          matchesFacets(item, facets, selected, facet.id) &&
          matchesDegree(item),
      );
      counts[facet.id] = {};
      for (const option of facet.options) {
        counts[facet.id]![option.value] = pool.filter((item) =>
          (item.facets[facet.id] ?? []).includes(option.value),
        ).length;
      }
    }
    return counts;
  }, [facets, items, matchesDegree, query, selected]);

  const groups = useMemo(() => {
    if (!groupBy) return [["", visible]] as [string, IndexItem[]][];
    const map = new Map<string, IndexItem[]>();
    for (const item of visible) {
      const key = item.facets[groupBy]?.[0] ?? "";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [groupBy, visible]);

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel flex flex-col gap-5 rounded-2xl p-5 sm:p-6 print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex w-full flex-col gap-1.5 sm:max-w-sm">
            <span className="text-sm text-muted-foreground">{searchLabel}</span>
            <Input
              onChange={(event) => setParam("q", event.target.value)}
              placeholder="Type a name or a word from the record"
              type="search"
              value={query}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Sort</span>
            <ToggleGroup
              className="flex max-w-full flex-wrap"
              onValueChange={(value: string[]) => {
                const next = value[0] ?? defaultSort;
                setParam("sort", next === defaultSort ? "" : next);
              }}
              size="sm"
              spacing={1}
              value={[sort]}
              variant="outline"
            >
              {sorts.map((option) => (
                <ToggleGroupItem key={option} value={option}>
                  {SORT_LABELS[option]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        {facets.map((facet) => (
          <div className="flex flex-col gap-1.5" key={facet.id}>
            <span className="text-sm text-muted-foreground">
              {facet.label}
              {facet.match === "all" ? ", matched together" : null}
            </span>
            <ToggleGroup
              className="flex max-w-full flex-wrap"
              multiple
              onValueChange={(value: string[]) => setParam(facet.id, value)}
              size="sm"
              spacing={1}
              value={selected[facet.id] ?? []}
              variant="outline"
            >
              {facet.options.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                  <Badge variant="outline">
                    {optionCounts[facet.id]?.[option.value] ?? 0}
                  </Badge>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">
            Typed connections
          </span>
          <ToggleGroup
            className="flex max-w-full flex-wrap"
            onValueChange={(value: string[]) => setParam("degree", value[0] ?? "")}
            size="sm"
            spacing={1}
            value={degree ? [degree] : []}
            variant="outline"
          >
            {(["linked", "unlinked"] as const).map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {DEGREE_LABELS[value]}
                <Badge variant="outline">
                  {
                    items.filter(
                      (item) =>
                        matchesQuery(item, query) &&
                        matchesFacets(item, facets, selected) &&
                        (value === "linked"
                          ? item.degree > 0
                          : item.degree === 0),
                    ).length
                  }
                </Badge>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            {visible.length} of {items.length} {noun}
          </span>
          {activeCount > 0 ? (
            <Button
              nativeButton={false}
              render={<Link href={pathname} scroll={false} />}
              size="sm"
              variant="outline"
            >
              Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
            </Button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No {noun} match</EmptyTitle>
            <EmptyDescription>
              {query
                ? `Nothing in the catalog contains “${query}”. Search folds Icelandic accents, so “Sedlabanki” and “Seðlabanki” are the same query.`
                : "Every record was filtered out. Facets combine, so two that never appear together return nothing."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        groups.map(([key, groupItems]) => (
          <section className="flex flex-col gap-3" key={key || "all"}>
            {groupBy && key ? (
              <h2 className="font-serif text-xl font-medium tracking-tight">
                {groupLabels?.[key] ?? key}{" "}
                <span className="text-muted-foreground">
                  · {groupItems.length}
                </span>
              </h2>
            ) : null}
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {groupItems.map((item) => (
                <li className="flex" key={item.href}>
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>
                        <Link
                          className="underline underline-offset-4"
                          href={item.href}
                        >
                          <Highlighted query={query} text={item.title} />
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {item.lead || "No summary recorded yet."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{item.dateLabel}</Badge>
                      <Badge variant="outline">
                        {item.degree === 0
                          ? "No typed edges"
                          : `${item.degree} typed ${item.degree === 1 ? "edge" : "edges"}`}
                      </Badge>
                      <Badge variant="outline">
                        {item.sources === 0
                          ? "No sources"
                          : `${item.sources} ${item.sources === 1 ? "source" : "sources"}`}
                      </Badge>
                      {item.authoredLede ? null : (
                        <Badge
                          title="No authored lede yet — this is the record's opening paragraph."
                          variant="outline"
                        >
                          Auto summary
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
