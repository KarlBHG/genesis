import Link from "next/link";

import { edgeKey } from "@/components/connection-graph";
import { ProvenanceEdgeCard } from "@/components/provenance-edge";
import { getEdges } from "@/lib/content";
import { paysEdgesForProgram } from "@/lib/invoice-budget";

export function ProgramInvoiceBridge({ programSlug }: { programSlug: string }) {
  const invoices = paysEdgesForProgram(programSlug, getEdges());
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      data-program-invoices=""
    >
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head text-lg">
          Opnir reikningar joined to this program
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Each line is one invoice from the state ledger. Amounts are not added
          together, and the line is not called waste. Rows appear here only when
          a cited page supports this policy area — the difference between an
          authorisation and a payment is set out on{" "}
          <Link className="underline underline-offset-4" href="/methodology#money">
            Methodology
          </Link>
          .
        </p>
      </header>
      {invoices.length === 0 ? (
        <p className="max-w-reading text-sm text-muted-foreground">
          No joined invoices are on file for this program.
        </p>
      ) : (
        <ul className="flex min-w-0 flex-col gap-3">
          {invoices.map((edge) => (
            <ProvenanceEdgeCard
              edge={edge}
              key={edgeKey(edge)}
              showProgramQuotation
              showRelationship={false}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
