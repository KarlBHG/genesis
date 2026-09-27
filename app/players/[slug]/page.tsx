import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getPlayers } from "@/lib/content";

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
  if (!player) return { title: "Not found" };
  return { title: player.title, description: player.summary };
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
