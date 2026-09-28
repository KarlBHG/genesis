import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryDetail } from "@/components/entry-detail";
import { ProgramInvoiceBridge } from "@/components/program-invoice-bridge";
import { getFlows } from "@/lib/content";
import { entryMetadata, notFoundMetadata } from "@/lib/entry-metadata";

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
  if (!flow) return notFoundMetadata;
  return entryMetadata(flow);
}

export default async function FlowPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const flow = getFlows().find((entry) => entry.slug === slug);
  if (!flow) notFound();
  const isPolicyArea = flow.slug.startsWith("policy-area-");
  return (
    <>
      <EntryDetail entry={flow} />
      {isPolicyArea ? (
        <div className="mx-auto -mt-4 mb-8 flex w-full max-w-reading flex-col gap-4 px-4 sm:px-6">
          <ProgramInvoiceBridge programSlug={flow.slug} />
        </div>
      ) : null}
    </>
  );
}
