import type { ReactNode } from "react";
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
import { formatDate } from "@/lib/format";
import {
  boardSeatCaption,
  displayCareerDate,
  officeMembershipCaption,
  type MembershipRow,
  type OfficeMembershipView,
} from "@/lib/office-membership";

function PersonCell({ row }: { row: MembershipRow }) {
  if (row.personHref) {
    return (
      <Link className="font-medium underline underline-offset-4" href={row.personHref}>
        {row.personTitle}
      </Link>
    );
  }
  return <span className="font-medium">{row.personTitle}</span>;
}

function MembershipRows({
  rows,
  emptyTitle,
  emptyDescription,
}: {
  rows: MembershipRow[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return (
      <TableRow>
        <TableCell className="p-0" colSpan={5}>
          <Empty className="border-0 py-8">
            <EmptyHeader>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TableCell>
      </TableRow>
    );
  }
  return (
    <>
      {rows.map((row) => (
        <TableRow className="pocket-ledger-row" key={row.href}>
          <TableCell className="whitespace-normal" data-label="Person">
            <div className="flex flex-wrap items-center gap-2">
              <PersonCell row={row} />
              <Badge variant={row.current ? "secondary" : "outline"}>
                {row.current ? "current" : "ended"}
              </Badge>
            </div>
          </TableCell>
          <TableCell className="whitespace-normal" data-label="Start">
            {formatDate(displayCareerDate(row.start))}
          </TableCell>
          <TableCell className="whitespace-normal" data-label="End">
            {formatDate(displayCareerDate(row.end))}
          </TableCell>
          <TableCell className="whitespace-normal" data-label="As of">
            {formatDate(row.asOf)}
          </TableCell>
          <TableCell data-label="Permalink">
            <Link className="underline underline-offset-4" href={row.href}>
              permalink
            </Link>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function MembershipTableFrame({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <Table className="pocket-ledger">
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Person</TableHead>
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead>As of</TableHead>
          <TableHead>Permalink</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}

export function OfficeMembershipTable({ view }: { view: OfficeMembershipView }) {
  return (
    <section className="flex min-w-0 flex-col gap-4" id="membership">
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">Membership</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Time-bounded <span className="font-medium">holds-office</span> rows for
          this post. Current means the end field is empty and the as-of is cited.
          Ended rows stay listed. Start is the date the cited page printed — not
          copied from as-of.
        </p>
      </header>
      <MembershipTableFrame caption={officeMembershipCaption(view)}>
        <MembershipRows
          emptyDescription="The act may print the appointment rule. The opened pages do not print a holds-office membership for this post. The post is not filled from the holder field."
          emptyTitle="No sourced membership"
          rows={view.memberships}
        />
      </MembershipTableFrame>
    </section>
  );
}

export function OfficeBoardSeatTable({ view }: { view: OfficeMembershipView }) {
  return (
    <section className="flex min-w-0 flex-col gap-4" id="board-seats">
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">Board seats</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Sourced <span className="font-medium">sits-on-board</span> rows at{" "}
          {view.organizationHref ? (
            <Link
              className="underline underline-offset-4"
              href={view.organizationHref}
            >
              {view.organizationTitle}
            </Link>
          ) : (
            view.organizationTitle
          )}
          . They are not memberships of this post, and they do not occupy it.
        </p>
      </header>
      <MembershipTableFrame caption={boardSeatCaption(view)}>
        <MembershipRows
          emptyDescription={`No sourced sits-on-board row points at ${view.organizationTitle} or at this post.`}
          emptyTitle="No sourced board seat"
          rows={view.boardSeats}
        />
      </MembershipTableFrame>
    </section>
  );
}
