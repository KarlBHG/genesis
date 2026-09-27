import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getSectors } from "@/lib/content";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getSectors().map((sector) => ({ slug: sector.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = getSectors().find((entry) => entry.slug === slug);
  if (!sector) return { title: "Not found" };
  return { title: sector.title, description: sector.summary };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const sector = getSectors().find((entry) => entry.slug === slug);
  if (!sector) notFound();
  return <EntryDetail entry={sector} />;
}
