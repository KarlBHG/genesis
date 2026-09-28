import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AsOfChip } from "@/components/as-of-chip";
import { getEdges, resolveSlug } from "@/lib/content";
import { paysEdgesForProgram } from "@/lib/invoice-budget";
import type { Edge } from "@/lib/types";
import { icelandicLang } from "@/lib/lang";

function InvoiceRow({ edge }: { edge: Edge }) {
  const buyer = resolveSlug(edge.from);
  const vendor = resolveSlug(edge.to);
  return (
    <li className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <p className="text-sm">
        {buyer ? (
          <Link className="underline underline-offset-4" href={buyer.href}>
            {edge.fromTitle}
          </Link>
        ) : (
          edge.fromTitle
        )}
        {" → "}
        {vendor ? (
          <Link className="underline underline-offset-4" href={vendor.href}>
            {edge.toTitle}
          </Link>
        ) : (
          edge.toTitle
        )}
        <span className="text-muted-foreground">
          {" "}
          · <AsOfChip asOf={edge.asOf} />
        </span>
        {edge.year ? (
          <Badge className="ml-2" variant="outline">
            Fiscal {edge.year}
          </Badge>
        ) : null}
      </p>
      <p className="text-sm text-muted-foreground" lang={icelandicLang(edge.quotation)}>
        {edge.quotation}
      </p>
      {edge.programQuotation ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Program link: </span>
          <span lang={icelandicLang(edge.programQuotation)}>“{edge.programQuotation}”</span>
          {edge.programSource ? (
            <>
              {" "}
              <a
                className="break-all underline underline-offset-4"
                href={edge.programSource}
                rel="noreferrer"
                target="_blank"
              >
                Source
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      <a
        className="text-sm break-all text-muted-foreground underline underline-offset-4"
        href={edge.source}
        rel="noreferrer"
        target="_blank"
      >
        {edge.source}
      </a>
    </li>
  );
}

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
          the buyer ledger prints a budget heading that maps to this policy area.
        </p>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground">
            No joined invoices are on file for this program in the pilot subset.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invoices.map((edge) => (
              <InvoiceRow
                edge={edge}
                key={`${edge.from}-${edge.to}-${edge.asOf}-${edge.quotation}`}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
