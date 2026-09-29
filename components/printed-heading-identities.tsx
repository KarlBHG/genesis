import Link from "next/link";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
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
import {
  IDENTITY_STATUS_LABELS,
  uniqueMatchForHeading,
  type IdentityCatalogHint,
  type IdentityStatus,
  type PrintedHeadingIdentity,
} from "@/lib/identities";
import { icelandicLang } from "@/lib/lang";

function statusVariant(
  status: IdentityStatus,
): "secondary" | "outline" | "ghost" {
  if (status === "sitting") return "secondary";
  if (status === "refused") return "outline";
  return "ghost";
}

export function PrintedHeadingIdentityTable({
  identities,
  names,
}: {
  identities: readonly PrintedHeadingIdentity[];
  names: readonly IdentityCatalogHint[];
}) {
  const sittingOrRefused = identities.filter(
    (row) => row.status !== "unmatched",
  );
  const unmatched = identities.filter((row) => row.status === "unmatched");

  return (
    <div className="flex min-w-0 scroll-mt-24 flex-col gap-6" id="printed-headings">
      <header className="flex max-w-reading flex-col gap-2">
        <h3 className="font-serif text-xl font-medium">Printed heading = endpoint</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          When the heading an invoice ledger prints is not a unique match for the
          catalog title the row sits on, that fact is a statement — not a silent
          rename. Re-parenting a <span lang="is">pays</span> row waits until this
          Identity is one heading → one slug. Unmatched names are not turned
          into stub players.
        </p>
      </header>

      {sittingOrRefused.length === 0 ? (
        <p className="text-muted-foreground">
          No sitting or refused heading identities are on file.
        </p>
      ) : (
        <Table className="pocket-ledger">
          <TableCaption>
            {sittingOrRefused.length}{" "}
            {sittingOrRefused.length === 1 ? "identity" : "identities"} where the
            printed heading and the catalog title are not the same thing. Row
            counts, not krónur.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Printed heading</TableHead>
              <TableHead>Sits on</TableHead>
              <TableHead>Unique catalog match</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sittingOrRefused.map((row) => {
              const sits = row.catalogSlug ? resolveSlug(row.catalogSlug) : null;
              const uniqueSlug = uniqueMatchForHeading(row.printedHeading, names);
              const unique = uniqueSlug ? resolveSlug(uniqueSlug) : null;
              const uniqueDiffers = Boolean(
                uniqueSlug && uniqueSlug !== row.catalogSlug,
              );
              return (
                <TableRow className="pocket-ledger-row" key={row.id}>
                  <TableCell
                    className="whitespace-normal font-medium"
                    data-label="Printed heading"
                    lang={icelandicLang(row.printedHeading) ?? "is"}
                  >
                    {row.printedHeading}
                  </TableCell>
                  <TableCell
                    className="whitespace-normal"
                    data-label="Sits on"
                  >
                    {sits ? (
                      <Link className="underline underline-offset-4" href={sits.href}>
                        {sits.title}
                      </Link>
                    ) : (
                      row.catalogSlug ?? "—"
                    )}
                    {row.catalogSlug ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {row.catalogSlug}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell
                    className="whitespace-normal"
                    data-label="Unique catalog match"
                  >
                    {unique ? (
                      <>
                        <Link className="underline underline-offset-4" href={unique.href}>
                          {unique.title}
                        </Link>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {uniqueSlug}
                          {uniqueDiffers
                            ? ". Invoices were not moved here."
                            : null}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        No unique catalog title
                      </span>
                    )}
                  </TableCell>
                  <TableCell data-label="Status">
                    <Badge className="font-normal" variant={statusVariant(row.status)}>
                      {IDENTITY_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium">Unmatched headings</h4>
        {unmatched.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>None on file</EmptyTitle>
              <EmptyDescription>
                Unmatched vendor strings stay unmatched. This map does not mint a
                stub player to clear a heading.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className="pocket-ledger">
            <TableCaption>
              {unmatched.length} unmatched{" "}
              {unmatched.length === 1 ? "heading" : "headings"}. Not catalogued.
              Not stubbed.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Printed heading</TableHead>
                <TableHead>Quoted on</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatched.map((row) => (
                <TableRow className="pocket-ledger-row" key={row.id}>
                  <TableCell
                    className="whitespace-normal"
                    data-label="Printed heading"
                    lang={icelandicLang(row.printedHeading) ?? "is"}
                  >
                    {row.printedHeading}
                  </TableCell>
                  <TableCell
                    className="max-w-md whitespace-normal text-muted-foreground"
                    data-label="Quoted on"
                  >
                    {row.quotation}
                  </TableCell>
                  <TableCell data-label="Status">
                    <Badge className="font-normal" variant="ghost">
                      Unmatched
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
