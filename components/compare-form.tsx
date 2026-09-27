"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
import { kindLabel } from "@/lib/format";
import { kindOrder } from "@/lib/compare";
import type { Kind } from "@/lib/types";

export type CompareOption = {
  slug: string;
  title: string;
  kind: Kind;
};

export function CompareForm({
  options,
  left,
  right,
}: {
  options: CompareOption[];
  left: string;
  right: string;
}) {
  const router = useRouter();
  const groups = new Map<Kind, CompareOption[]>();
  for (const option of options) {
    const list = groups.get(option.kind) ?? [];
    list.push(option);
    groups.set(option.kind, list);
  }
  const kinds = [...groups.keys()].sort((a, b) => kindOrder(a) - kindOrder(b));

  function go(nextLeft: string, nextRight: string) {
    const params = new URLSearchParams({ left: nextLeft, right: nextRight });
    router.push(`/compare?${params.toString()}`);
  }

  function field(id: string, label: string, value: string, other: string, side: "left" | "right") {
    return (
      <label className="flex flex-col gap-1 text-sm" htmlFor={id}>
        {label}
        <Select
          id={id}
          onChange={(event) => {
            const next = event.target.value;
            if (side === "left") go(next, other);
            else go(other, next);
          }}
          value={value}
        >
          {kinds.map((kind) => (
            <optgroup key={kind} label={kindLabel(kind)}>
              {(groups.get(kind) ?? []).map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.title}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </label>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {field("compare-left", "First entry", left, right, "left")}
      {field("compare-right", "Second entry", right, left, "right")}
    </div>
  );
}
