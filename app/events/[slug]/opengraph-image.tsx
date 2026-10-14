import { notFound } from "next/navigation";

import { getEvents } from "@/lib/content";
import { ogImageMetadata, renderEntryOgImage } from "@/lib/og-entry-image";

type Params = { slug: string };

export function generateImageMetadata({ params }: { params: Params }) {
  return ogImageMetadata(
    getEvents().find((entry) => entry.slug === params.slug),
  );
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const event = getEvents().find((entry) => entry.slug === slug);
  if (!event) notFound();
  return renderEntryOgImage(event);
}
