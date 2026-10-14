import { notFound } from "next/navigation";

import { getFlows } from "@/lib/content";
import { ogImageMetadata, renderEntryOgImage } from "@/lib/og-entry-image";

type Params = { slug: string };

export function generateImageMetadata({ params }: { params: Params }) {
  return ogImageMetadata(getFlows().find((entry) => entry.slug === params.slug));
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const flow = getFlows().find((entry) => entry.slug === slug);
  if (!flow) notFound();
  return renderEntryOgImage(flow);
}
