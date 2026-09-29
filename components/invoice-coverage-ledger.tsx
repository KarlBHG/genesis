import Link from "next/link";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { edgeHref } from "@/lib/edge-id";
import {
  buyerGroupCaption,
  coverageCaption,
  COVERAGE_STATUS_LABELS,
  type CoverageStatus,
  type InvoiceCoverageLedger,
} from "@/lib/invoice-coverage";
import { icelandicLang } from "@/lib/lang";

function statusVariant(status: CoverageStatus): "secondary" | "outline" | "ghost" {
  if (status === "joined") return "secondary";
  if (status === "explicit-null") return "outline";
  return "ghost";
}

export function InvoiceCoverageLedgerTable({
  ledger,
}: {
  ledger: InvoiceCoverageLedger;
}) {
  return (
    <div className="flex min-w-0 scroll-mt-24 flex-col gap-4" id="invoice-coverage">
      <header className="flex max-w-reading flex-col gap-2">
        <h3 className="font-serif text-xl font-medium">Invoice coverage</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Every stored <span lang="is">pays</span> row, grouped by the buyer it
          sits on. Joined means a cited page supports one policy area. Explicit
          null means the join was refused with a stored reason. Unreviewed means
          neither. A printed <span lang="is">málaflokkur</span> is never mapped
          from the vendor’s line of business. Amounts are not shown and not
          added together.
        </p>
      </header>
      {ledger.total === 0 ? (
        <p className="text-muted-foreground">No invoice rows are on file.</p>
      ) : (
        <Table>
          <TableCaption>{coverageCaption(ledger)}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>As of</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Program or reason</TableHead>
              <TableHead className="text-right">Line</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.groups.map((group) => {
              const buyer = resolveSlug(group.buyerSlug);
              return (
                <BuyerGroupRows
                  buyerHref={buyer?.href ?? null}
                  group={group}
                  key={group.buyerSlug}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function BuyerGroupRows({
  group,
  buyerHref,
}: {
  group: InvoiceCoverageLedger["groups"][number];
  buyerHref: string | null;
}) {
  const program = (slug: string | null) => (slug ? resolveSlug(slug) : null);
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell className="whitespace-normal" colSpan={5}>
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3">
            <span className="font-medium">
              {buyerHref ? (
                <Link className="underline underline-offset-4" href={buyerHref}>
                  {group.buyerTitle}
                </Link>
              ) : (
                group.buyerTitle
              )}
            </span>
            {group.printedBuyer &&
            group.printedBuyer !== group.buyerTitle ? (
              <span
                className="text-muted-foreground"
                lang={icelandicLang(group.printedBuyer) ?? "is"}
              >
                printed {group.printedBuyer}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {buyerGroupCaption(group)}
            </span>
          </div>
        </TableCell>
      </TableRow>
      {group.rows.map((row) => {
        const vendor = resolveSlug(row.vendorSlug);
        const joined = program(row.programSlug);
        return (
          <TableRow key={edgeHref(row.edge)}>
            <TableCell className="whitespace-normal">
              {vendor ? (
                <Link className="underline underline-offset-4" href={vendor.href}>
                  {row.vendorTitle}
                </Link>
              ) : (
                row.vendorTitle
              )}
            </TableCell>
            <TableCell>{row.edge.asOf}</TableCell>
            <TableCell>
              <Badge
                className="font-normal"
                variant={statusVariant(row.status)}
              >
                {COVERAGE_STATUS_LABELS[row.status]}
              </Badge>
            </TableCell>
            <TableCell className="max-w-md whitespace-normal text-muted-foreground">
              {row.status === "joined" && joined ? (
                <Link className="text-foreground underline underline-offset-4" href={joined.href}>
                  {row.programTitle ?? joined.title}
                </Link>
              ) : row.status === "explicit-null" ? (
                row.programNullReason
              ) : (
                "Not yet reviewed"
              )}
            </TableCell>
            <TableCell className="text-right">
              <Link className="underline underline-offset-4" href={edgeHref(row.edge)}>
                Open
              </Link>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
