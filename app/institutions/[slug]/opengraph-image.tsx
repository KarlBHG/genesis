import { notFound } from "next/navigation";

import { getInstitutions } from "@/lib/content";
import { ogImageMetadata, renderEntryOgImage } from "@/lib/og-entry-image";

type Params = { slug: string };

export function generateImageMetadata({ params }: { params: Params }) {
  return ogImageMetadata(
    getInstitutions().find((entry) => entry.slug === params.slug),
  );
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const institution = getInstitutions().find((entry) => entry.slug === slug);
  if (!institution) notFound();
  return renderEntryOgImage(institution);
}
