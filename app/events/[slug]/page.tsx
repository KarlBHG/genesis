import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getEvents } from "@/lib/content";
import { entryMetadata, notFoundMetadata } from "@/lib/entry-metadata";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getEvents().map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvents().find((entry) => entry.slug === slug);
  if (!event) return notFoundMetadata;
  return entryMetadata(event);
}

export default async function EventPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const event = getEvents().find((entry) => entry.slug === slug);
  if (!event) notFound();
  return <EntryDetail entry={event} />;
}
