import Link from "next/link";

import { ProvenanceEdgeCard } from "@/components/provenance-edge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEdges } from "@/lib/content";
import { paysEdgesForProgram } from "@/lib/invoice-budget";

export function ProgramInvoiceBridge({ programSlug }: { programSlug: string }) {
  const invoices = paysEdgesForProgram(programSlug, getEdges());
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opnir reikningar joined to this program</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Each line is one invoice from the state ledger. Amounts are not added
          together, and the line is not called waste. Rows appear here only when
          the buyer ledger prints a budget heading that maps to this policy area —
          the difference between an authorisation and a payment is set out on{" "}
          <Link className="underline underline-offset-4" href="/methodology#money">
            Methodology
          </Link>
          .
        </p>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground">
            No joined invoices are on file for this program in the pilot subset.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invoices.map((edge) => (
              <ProvenanceEdgeCard
                edge={edge}
                key={`${edge.from}-${edge.to}-${edge.asOf}-${edge.quotation}`}
                showProgramQuotation
                showRelationship={false}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
