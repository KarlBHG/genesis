import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getInstitutions } from "@/lib/content";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getInstitutions().map((institution) => ({ slug: institution.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const institution = getInstitutions().find((entry) => entry.slug === slug);
  if (!institution) return { title: "Not found" };
  return { title: institution.title, description: institution.summary };
}

export default async function InstitutionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const institution = getInstitutions().find((entry) => entry.slug === slug);
  if (!institution) notFound();
  return <EntryDetail entry={institution} />;
}
