import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
  officeIndexCaption,
  type OfficeMembershipView,
} from "@/lib/office-membership";

export function OfficePostsIndex({
  views,
}: {
  views: OfficeMembershipView[];
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4" id="posts">
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">Posts</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Each row is a Post (title, organization). Membership is the typed table
          on the office page. Vacant means no current holds-office row — the
          holder field does not fill it.
        </p>
      </header>
      <Table className="pocket-ledger">
        <TableCaption>{officeIndexCaption(views)}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Post</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Memberships</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {views.map((view) => {
            const currentNames = view.current
              .map((row) => row.personTitle)
              .filter((title, index, all) => all.indexOf(title) === index);
            return (
              <TableRow className="pocket-ledger-row" key={view.office.id}>
                <TableCell className="whitespace-normal" data-label="Post">
                  <Link
                    className="font-medium underline underline-offset-4"
                    href={`/offices/${view.office.id}`}
                  >
                    {view.office.title}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal" data-label="Organization">
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
                </TableCell>
                <TableCell className="whitespace-normal" data-label="Status">
                  {view.vacant ? (
                    <Badge variant="outline">vacant</Badge>
                  ) : (
                    <span>{currentNames.join(", ")}</span>
                  )}
                </TableCell>
                <TableCell data-label="Memberships">{view.memberships.length}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
