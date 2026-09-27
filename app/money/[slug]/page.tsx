import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { getFlows } from "@/lib/content";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getFlows().map((flow) => ({ slug: flow.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const flow = getFlows().find((entry) => entry.slug === slug);
  if (!flow) return { title: "Not found" };
  return { title: flow.title, description: flow.summary };
}

export default async function FlowPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const flow = getFlows().find((entry) => entry.slug === slug);
  if (!flow) notFound();
  return <EntryDetail entry={flow} />;
}
