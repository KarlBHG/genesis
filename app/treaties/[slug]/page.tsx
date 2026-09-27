import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getTreaties } from "@/lib/content";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getTreaties().map((treaty) => ({ slug: treaty.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const treaty = getTreaties().find((entry) => entry.slug === slug);
  if (!treaty) return { title: "Not found" };
  return { title: treaty.title, description: treaty.summary };
}

export default async function TreatyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const treaty = getTreaties().find((entry) => entry.slug === slug);
  if (!treaty) notFound();
  return <EntryDetail entry={treaty} />;
}
