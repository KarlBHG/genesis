import type { Metadata } from "next";

import { InstitutionBrowser } from "@/components/institution-browser";
import { getInstitutions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Institutions",
  description: "Institutions in the Iceland system map.",
};

export default function InstitutionsPage() {
  const items = getInstitutions()
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "en"))
    .map((institution) => ({
      title: institution.title,
      href: `/institutions/${institution.slug}`,
      summary: institution.summary,
      role: institution.role,
      founded: institution.founded,
    }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Institutions</h1>
        <p className="text-muted-foreground">
          Public bodies, grouped by role. Seðlabanki Íslands keeps its name.
        </p>
      </header>
      <InstitutionBrowser items={items} />
    </main>
  );
}
