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
import { labelize } from "@/lib/format";

export type InstitutionItem = {
  title: string;
  href: string;
  summary: string;
  role: string;
  founded: string;
};

function unique(values: string[]) {
  return [...new Set(values)].sort();
}

function institutionMeta(item: InstitutionItem): string {
  return item.founded ? `Founded ${item.founded}` : "Founded not stated";
}

export function InstitutionBrowser({ items }: { items: InstitutionItem[] }) {
  const [roles, setRoles] = useState<string[]>([]);
  const roleOptions = unique(items.map((item) => item.role));
  const filtered = useMemo(
    () =>
      items.filter((item) => roles.length === 0 || roles.includes(item.role)),
    [items, roles],
  );

  const groups = new Map<string, InstitutionItem[]>();
  for (const item of filtered) {
    const list = groups.get(item.role) ?? [];
    list.push(item);
    groups.set(item.role, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="folio-facet">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Role</p>
          <ToggleGroup
            className="flex max-w-full flex-wrap"
            multiple
            onValueChange={setRoles}
            size="sm"
            spacing={1}
            value={roles}
            variant="outline"
          >
            {roleOptions.map((role) => (
              <ToggleGroupItem key={role} value={role}>
                {labelize(role)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No institutions match</EmptyTitle>
            <EmptyDescription>
              Clear the role filter to see the full list.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        [...groups.entries()].map(([role, groupItems]) => (
          <section className="flex flex-col gap-3" key={role}>
            <h2 className="font-serif text-xl font-medium tracking-tight">
              {labelize(role)}
            </h2>
            <ul className="folio-index">
              {groupItems.map((item) => (
                <li className="folio-index-row" key={item.href}>
                  <p className="folio-index-meta">{institutionMeta(item)}</p>
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
