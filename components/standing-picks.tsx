"use client";

import { usePathname, useRouter } from "next/navigation";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import type { StandingBoard } from "@/lib/standing";

export function StandingPicks({
  board,
  programSlug,
  municipalitySlug,
}: {
  board: StandingBoard;
  programSlug: string;
  municipalitySlug: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const stay = pathname === "/standing" || pathname === "/";

  function go(nextProgram: string, nextMunicipality: string) {
    const params = new URLSearchParams();
    params.set("program", nextProgram);
    if (nextMunicipality) params.set("municipality", nextMunicipality);
    const href = `${stay ? pathname : "/standing"}?${params.toString()}`;
    if (stay) {
      router.replace(href, { scroll: false });
      return;
    }
    router.push(href);
  }

  return (
    <div className="standing-picks grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="standing-municipality">Municipality</FieldLabel>
        <Select
          id="standing-municipality"
          onChange={(event) => go(programSlug, event.target.value)}
          value={municipalitySlug ?? ""}
        >
          <option value="">Catalog pick — not a postcode</option>
          {board.municipalities.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.title}
            </option>
          ))}
        </Select>
        <FieldDescription>
          Where you live, from the public-entity catalog. This is not a
          postcode lookup and it does not invent a constituency.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="standing-program">Policy area</FieldLabel>
        <Select
          id="standing-program"
          onChange={(event) => go(event.target.value, municipalitySlug ?? "")}
          value={programSlug}
        >
          {board.programs.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.title}
            </option>
          ))}
        </Select>
        <FieldDescription>
          Article 4 authorisation already stored for 2026. The invoice hop
          stays empty unless a pays row is joined to that area.
        </FieldDescription>
      </Field>
    </div>
  );
}
