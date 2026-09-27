"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { labelize } from "@/lib/format";
import { highlightParts, searchEntries, snippetText } from "@/lib/search";
import type { SearchDoc, SearchKind } from "@/lib/types";

const FACETS: { id: SearchKind; label: string }[] = [
  { id: "treaty", label: "Treaties" },
  { id: "institution", label: "Institutions" },
  { id: "sector", label: "Business" },
  { id: "flow", label: "Money" },
  { id: "player", label: "Players" },
  { id: "event", label: "Events" },
  { id: "edge", label: "Connections" },
];

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = highlightParts(text, query);
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            className="rounded-sm bg-amber-200 px-0.5 font-medium text-foreground dark:bg-amber-400/40"
            key={`${index}-${part.text}`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${index}-${part.text}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function SearchPanel({ docs }: { docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const [facet, setFacet] = useState<SearchKind | "all">("all");
  const results = useMemo(() => searchEntries(docs, query), [docs, query]);
  const trimmed = query.trim();
  const counts = useMemo(() => {
    const tally = new Map<SearchKind, number>();
    for (const result of results) {
      tally.set(result.kind, (tally.get(result.kind) ?? 0) + 1);
    }
    return tally;
  }, [results]);
  const visible =
    facet === "all" ? results : results.filter((result) => result.kind === facet);

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="map-search">Search the map</FieldLabel>
          <Input
            id="map-search"
            autoComplete="off"
            onValueChange={(next) => setQuery(next)}
            placeholder="Try EEA, Landsvirkjun, sells power, regulates"
            type="search"
            value={query}
          />
          <FieldDescription>
            Matches titles, summaries, topics, entry text, and typed connections.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {trimmed ? (
        <div
          aria-label="Filter results by type"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          role="group"
        >
          <Button
            aria-pressed={facet === "all"}
            className="shrink-0"
            onClick={() => setFacet("all")}
            size="sm"
            variant={facet === "all" ? "secondary" : "outline"}
          >
            All
            <Badge variant="outline">{results.length}</Badge>
          </Button>
          {FACETS.map((item) => (
            <Button
              aria-pressed={facet === item.id}
              className="shrink-0"
              key={item.id}
              onClick={() => setFacet(item.id)}
              size="sm"
              variant={facet === item.id ? "secondary" : "outline"}
            >
              {item.label}
              <Badge variant="outline">{counts.get(item.id) ?? 0}</Badge>
            </Button>
          ))}
        </div>
      ) : null}
      {trimmed && visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing matches “{trimmed}”</EmptyTitle>
            <EmptyDescription>
              {facet === "all"
                ? "Try a treaty, a sector, a bank, a year, or a connection such as regulates."
                : "No results in this type. Choose another filter or clear it."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {visible.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {visible.map((result) => (
            <li key={result.slug}>
              <Link
                className="flex flex-col gap-1 rounded-lg border px-3 py-3 hover:bg-muted"
                href={result.href}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    <Highlighted query={trimmed} text={result.title} />
                  </span>
                  <Badge variant="secondary">{labelize(result.kind)}</Badge>
                </span>
                <span className="text-sm text-muted-foreground">
                  <Highlighted
                    query={trimmed}
                    text={snippetText(result, trimmed)}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
