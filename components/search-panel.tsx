"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { searchEntries } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";

export function SearchPanel({ docs }: { docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchEntries(docs, query), [docs, query]);
  const trimmed = query.trim();

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="map-search">Search the map</FieldLabel>
          <Input
            id="map-search"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try EEA, króna, Alþingi, Schengen"
            type="search"
            value={query}
          />
          <FieldDescription>
            Matches titles, summaries, topics, and the text of each entry.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {trimmed && results.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing matches “{trimmed}”</EmptyTitle>
            <EmptyDescription>
              Try a treaty, an institution, or a year. Only written entries are indexed.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((result) => (
            <li key={result.href}>
              <Link
                className="flex flex-col gap-1 rounded-lg border px-3 py-3 hover:bg-muted"
                href={result.href}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{result.title}</span>
                  <Badge variant="secondary">{labelize(result.kind)}</Badge>
                </span>
                <span className="text-sm text-muted-foreground">
                  {result.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
