import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getEvents } from "@/lib/content";

type Params = { slug: string };

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
  if (!event) return { title: "Not found" };
  return { title: event.title, description: event.summary };
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
