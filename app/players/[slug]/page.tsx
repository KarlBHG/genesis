import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getPlayers } from "@/lib/content";
import { entryMetadata, notFoundMetadata } from "@/lib/entry-metadata";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getPlayers().map((player) => ({ slug: player.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const player = getPlayers().find((entry) => entry.slug === slug);
  if (!player) return notFoundMetadata;
  return entryMetadata(player);
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const player = getPlayers().find((entry) => entry.slug === slug);
  if (!player) notFound();
  return <EntryDetail entry={player} />;
}
