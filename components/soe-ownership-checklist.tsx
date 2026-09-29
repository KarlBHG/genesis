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
  SOE_OWNERSHIP_STATUS_LABELS,
  soeOwnershipCaption,
  type SoeOwnershipRow,
  type SoeOwnershipStatus,
} from "@/lib/ownership";

function statusVariant(
  status: SoeOwnershipStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "sourced") return "secondary";
  if (status === "contradiction-only") return "outline";
  return "destructive";
}

export function SoeOwnershipChecklist({ rows }: { rows: SoeOwnershipRow[] }) {
  const holes = rows.filter((row) => row.status !== "sourced");
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex max-w-reading flex-col gap-2">
        <h2 className="reading-head">Ownership statements</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Each stored <span className="font-medium">owns</span> line is one dated
          statement: subject, interested party, as-of, quotation, source. It is
          not a timeless “X owns Y,” a vote total, or a merge with{" "}
          <span className="font-medium">appoints</span> or{" "}
          <span className="font-medium">regulates</span>. Completeness here is
          which inventory public companies and funds lack a sourced owns
          statement — or have only a contradiction. Percentages are not added.
        </p>
      </header>
      <Table>
        <TableCaption>{soeOwnershipCaption(rows)}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Statements</TableHead>
            <TableHead>Contradiction</TableHead>
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
              <TableCell>
                <Badge variant={statusVariant(row.status)}>
                  {SOE_OWNERSHIP_STATUS_LABELS[row.status]}
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
                          {statement.interestedPartyTitle}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          · {statement.asOf}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">
                {row.contradictions.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <Link
                    className="underline underline-offset-4"
                    href="/anomalies#contradictions"
                  >
                    {row.contradictions.length === 1
                      ? "both sides"
                      : `${row.contradictions.length} on file`}
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {holes.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Every inventory public company and fund has at least one sourced owns
          statement.
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Holes stay empty until a cited sentence can carry an owns row. A
          ministry that appoints a board, or a regulator that supervises a fund,
          is a different type.
        </p>
      )}
    </div>
  );
}
