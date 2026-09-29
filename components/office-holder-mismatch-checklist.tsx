import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import {
  HOLDER_MISMATCH_LABEL,
  holderMismatchCaption,
  type HolderMismatch,
  type OfficeMembershipView,
} from "@/lib/office-membership";

export function OfficeHolderMismatchChecklist({
  rows,
}: {
  rows: HolderMismatch[];
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4" id="holder-mismatch">
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">Holder field vs typed membership</h2>
        <p className="text-base leading-7 text-muted-foreground">
          <code className="text-sm">offices.json</code> still names one holder.
          Membership is the typed <span className="font-medium">holds-office</span>{" "}
          table. When those disagree, the row stays a checklist — not a rewritten
          succession, and not a start date copied from as-of.
        </p>
      </header>
      <Table>
        <TableCaption>{holderMismatchCaption(rows)}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Post</TableHead>
            <TableHead>Holder field</TableHead>
            <TableHead>Current membership</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell className="p-0" colSpan={4}>
                <Empty className="border-0 py-8">
                  <EmptyHeader>
                    <EmptyTitle>No holder-field mismatches</EmptyTitle>
                    <EmptyDescription>
                      Every office record’s holder is the current holds-office
                      membership.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.officeId}>
                <TableCell className="whitespace-normal">
                  <Link
                    className="font-medium underline underline-offset-4"
                    href={row.officeHref}
                  >
                    {row.officeTitle}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {row.holderHref ? (
                    <Link
                      className="underline underline-offset-4"
                      href={row.holderHref}
                    >
                      {row.holderTitle}
                    </Link>
                  ) : (
                    row.holderTitle
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {row.currentPeople.length === 0 ? (
                    <span className="text-muted-foreground">none (vacant)</span>
                  ) : (
                    row.currentPeople
                      .map((person) => person.title)
                      .join(", ")
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <Badge variant="destructive">{row.label}</Badge>
                    <span className="text-xs leading-5 text-muted-foreground">
                      {row.detail}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

export function OfficeMismatchCallout({
  view,
}: {
  view: OfficeMembershipView;
}) {
  if (!view.mismatch) return null;
  const row = view.mismatch;
  return (
    <aside
      className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      id="holder-mismatch"
    >
      <p className="text-sm font-medium">{HOLDER_MISMATCH_LABEL}</p>
      <p className="text-sm leading-6 text-muted-foreground">{row.detail}</p>
      <p className="text-sm leading-6">
        <Link className="underline underline-offset-4" href="/offices#holder-mismatch">
          Open the checklist
        </Link>
        . The post is not filled from the holder field.
      </p>
    </aside>
  );
}
