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
  PARENT_MINISTRY_STATUS_LABELS,
  parentMinistryCaption,
  relationshipLabel,
  type ParentMinistryRow,
  type ParentMinistryStatus,
} from "@/lib/parent-ministry";
import { PUBLIC_ENTITY_CATEGORY_LABELS } from "@/lib/public-entities";

function statusVariant(
  status: ParentMinistryStatus,
): "secondary" | "outline" {
  return status === "sourced" ? "secondary" : "outline";
}

export function ParentMinistryChecklist({ rows }: { rows: ParentMinistryRow[] }) {
  const holes = rows.filter((row) => row.status === "empty");
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">Parent ministry</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Each stored <span className="font-medium">regulates</span>,{" "}
          <span className="font-medium">appoints</span>, or{" "}
          <span className="font-medium">owns</span> line here is a cited parent:
          a ministry, a statute parent such as Alþingi or Seðlabanki, the
          Treasury or the republic, or a municipal owner. Empty parent stays
          empty. MFA <span className="font-medium">represents</span> does not
          count, and neither does a Govdirectory or Wikidata Q-id.
        </p>
      </header>
      <Table>
        <TableCaption>{parentMinistryCaption(rows)}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Parent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.slug}>
              <TableCell className="whitespace-normal">
                <div className="flex flex-col gap-0.5">
                  {row.href ? (
                    <Link
                      className="font-medium underline underline-offset-4"
                      href={row.href}
                    >
                      {row.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{row.title}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{row.slug}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">
                {PUBLIC_ENTITY_CATEGORY_LABELS[row.category]}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status)}>
                  {PARENT_MINISTRY_STATUS_LABELS[row.status]}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-normal">
                {row.statements.length === 0 ? (
                  <span className="text-muted-foreground">none</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {row.statements.map((statement) => (
                      <li key={statement.href}>
                        <Link
                          className="underline underline-offset-4"
                          href={statement.href}
                        >
                          {statement.fromTitle}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          · {relationshipLabel(statement.relationship)} · {statement.asOf}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {holes.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Every in-scope agency, regulator, court, university, and public
          company has a sourced parent.
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Empty parent stays empty until a cited ministry, statute, or about
          page prints one. A union seat on a board, or MFA represents, is a
          different type.
        </p>
      )}
    </div>
  );
}
