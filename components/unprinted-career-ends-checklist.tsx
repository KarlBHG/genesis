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
  NO_END_STORED,
  UNPRINTED_CAREER_ANCHOR,
  UNPRINTED_CAREER_HREF,
  isUnprintedCareerEnd,
  unlabeledCareerCaption,
  type UnprintedCareerRow,
} from "@/lib/connection-tenure";
import type { Edge } from "@/lib/types";

function Endpoint({
  href,
  title,
}: {
  href: string | null;
  title: string;
}) {
  if (!href) return <>{title}</>;
  return (
    <Link className="underline underline-offset-4" href={href}>
      {title}
    </Link>
  );
}

export function UnprintedCareerEndsChecklist({
  rows,
}: {
  rows: UnprintedCareerRow[];
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4" id={UNPRINTED_CAREER_ANCHOR}>
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">No end date stored</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Board seats and disclosed holdings whose cited page prints no end.
          They stay listed. The end field is {NO_END_STORED}, never “current.”
          Current membership is only a{" "}
          <span className="font-medium">holds-office</span> row with an empty
          end and a cited as-of. Missing ends are not filled from as-of,
          retrieval day, or a neighbouring term.
        </p>
      </header>
      <Table className="pocket-ledger">
        <TableCaption>{unlabeledCareerCaption(rows)}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>To</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Permalink</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell className="p-0" colSpan={5}>
                <Empty className="border-0 py-8">
                  <EmptyHeader>
                    <EmptyTitle>No leftover unlabeled career ends</EmptyTitle>
                    <EmptyDescription>
                      Every career line either prints an end date or is current
                      membership.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow className="pocket-ledger-row" key={row.href}>
                <TableCell className="whitespace-normal" data-label="From">
                  <Endpoint href={row.fromHref} title={row.fromTitle} />
                </TableCell>
                <TableCell className="whitespace-normal" data-label="Type">
                  <code className="text-xs">{row.relationship}</code>
                </TableCell>
                <TableCell className="whitespace-normal" data-label="To">
                  <Endpoint href={row.toHref} title={row.toTitle} />
                </TableCell>
                <TableCell className="whitespace-normal" data-label="End">
                  <Badge variant="outline">{row.label}</Badge>
                </TableCell>
                <TableCell className="whitespace-normal" data-label="Permalink">
                  <Link
                    className="underline underline-offset-4"
                    href={row.href}
                  >
                    Open this connection
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

export function UnprintedCareerCallout({ edge }: { edge: Edge }) {
  if (!isUnprintedCareerEnd(edge)) return null;
  return (
    <aside className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/20 p-4">
      <p className="text-sm font-medium">{NO_END_STORED}</p>
      <p className="text-sm leading-6 text-muted-foreground">
        The cited page prints no end. This line is not current membership. The
        end is not filled from as-of or a neighbouring term.
      </p>
      <p className="text-sm leading-6">
        <Link className="underline underline-offset-4" href={UNPRINTED_CAREER_HREF}>
          Open the checklist
        </Link>
        . Listed, not filled.
      </p>
    </aside>
  );
}
