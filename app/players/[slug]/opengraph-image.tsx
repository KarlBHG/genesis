import { notFound } from "next/navigation";

import { getPlayers } from "@/lib/content";
import { ogImageMetadata, renderEntryOgImage } from "@/lib/og-entry-image";

type Params = { slug: string };

export function generateImageMetadata({ params }: { params: Params }) {
  return ogImageMetadata(
    getPlayers().find((entry) => entry.slug === params.slug),
  );
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const player = getPlayers().find((entry) => entry.slug === slug);
  if (!player) notFound();
  return renderEntryOgImage(player);
}
