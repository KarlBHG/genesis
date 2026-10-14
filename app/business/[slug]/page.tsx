import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getSectors } from "@/lib/content";
import { entryMetadata, notFoundMetadata } from "@/lib/entry-metadata";

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
  if (!sector) return notFoundMetadata;
  return entryMetadata(sector);
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
