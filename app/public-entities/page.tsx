import Link from "next/link";
import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GOVDIRECTORY_ICELAND,
  getGovdirectoryLedger,
} from "@/lib/govdirectory";
import {
  PUBLIC_ENTITY_CATEGORY_LABELS,
  getPublicEntityCoverage,
  summarizePublicEntityCoverage,
  type PublicEntityCoverageRow,
} from "@/lib/public-entities";

export const metadata: Metadata = {
  title: "Public entities",
  description:
    "An explicit inventory of in-scope public entities and their coverage status: mapped, typed-linked, and office-linked, plus a Govdirectory/Wikidata completeness checklist.",
};

function catalogLabel(row: PublicEntityCoverageRow): string {
  return row.inCatalog ? "yes" : "missing";
}

function mapLabel(row: PublicEntityCoverageRow): string {
  if (row.mapMode === "office-only") return "office-only";
  return row.mapped ? "yes" : "missing";
}

export default function PublicEntitiesPage() {
  const rows = getPublicEntityCoverage();
  const summaries = summarizePublicEntityCoverage(rows);
  const ledger = getGovdirectoryLedger();
  const totalMapped = rows.filter((row) => row.mapped).length;
  const totalTyped = rows.filter((row) => row.typedLinkage).length;
  const totalOffice = rows.filter((row) => row.officeLinked).length;

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description="Every in-scope public entity tracked in this phase appears here with explicit coverage indicators. “Mapped” means it has a geography pin unless marked office-only, “typed links” means at least one schema-typed edge, and “office-linked” means named office records connect through holds-office lines."
        eyebrow={`${rows.length} tracked entities · ${totalMapped} mapped · ${totalTyped} typed-linked`}
        title="Public entities"
      />
      <div className="mx-auto flex w-full max-w-shell flex-col gap-6 px-4 pb-16 pt-10 sm:px-6">
        <section className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader>
              <p className="kicker">Coverage</p>
              <CardDescription>Mapped</CardDescription>
              <CardTitle className="font-serif text-3xl tabular-nums">
                {totalMapped} / {rows.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <p className="kicker">Graph</p>
              <CardDescription>Typed links</CardDescription>
              <CardTitle className="font-serif text-3xl tabular-nums">
                {totalTyped} / {rows.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <p className="kicker">Offices</p>
              <CardDescription>Office-linked</CardDescription>
              <CardTitle className="font-serif text-3xl tabular-nums">
                {totalOffice} / {rows.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Tabs className="gap-6" defaultValue="inventory">
          <TabsList className="h-auto w-full flex-wrap justify-start" variant="line">
            <TabsTrigger value="inventory">In-scope inventory</TabsTrigger>
            <TabsTrigger value="checklist">Govdirectory checklist</TabsTrigger>
          </TabsList>

          <TabsContent className="flex flex-col gap-8" value="inventory">
            {summaries.map((summary) => {
              const categoryRows = rows.filter((row) => row.category === summary.category);
              return (
                <section className="flex flex-col gap-3" key={summary.category}>
                  <h2 className="font-serif text-xl font-medium tracking-tight">
                    {PUBLIC_ENTITY_CATEGORY_LABELS[summary.category]}{" "}
                    <span className="text-muted-foreground">· {summary.total}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {summary.mapped}/{summary.total} mapped · {summary.typedLinked}/
                    {summary.total} typed-linked · {summary.officeLinked}/
                    {summary.total} office-linked
                  </p>
                  <Table>
                    <TableCaption>
                      Coverage for {PUBLIC_ENTITY_CATEGORY_LABELS[summary.category].toLowerCase()}.
                      Counts are not money totals.
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>Catalog</TableHead>
                        <TableHead>Map</TableHead>
                        <TableHead>Typed links</TableHead>
                        <TableHead>Office</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRows.map((row) => (
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
                            <Badge variant={row.inCatalog ? "secondary" : "destructive"}>
                              {catalogLabel(row)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.mapped || row.mapMode === "office-only"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {mapLabel(row)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.typedLinkage ? "secondary" : "destructive"}>
                              {row.directTypedLinks + row.officeLinks}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.officeLinked ? "secondary" : "outline"}>
                              {row.officeLinked ? "yes" : "no"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              );
            })}
          </TabsContent>

          <TabsContent className="flex flex-col gap-4" value="checklist">
            <div className="flex max-w-reading flex-col gap-2">
              <h2 className="font-serif text-xl font-medium tracking-tight">
                Open checklist · Govdirectory
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {GOVDIRECTORY_ICELAND.note} Retrieved {GOVDIRECTORY_ICELAND.retrieved}; Govdirectory
                marked its Iceland page updated {GOVDIRECTORY_ICELAND.govdirectoryUpdated}. This is
                not a source of typed edges. See{" "}
                <Link className="underline underline-offset-4" href="/methodology#open-checklists">
                  Methodology
                </Link>
                .
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Source:{" "}
                <a
                  className="underline underline-offset-4"
                  href={GOVDIRECTORY_ICELAND.source}
                  rel="noreferrer"
                  target="_blank"
                >
                  govdirectory.org/iceland
                </a>
                {" · "}
                <a
                  className="underline underline-offset-4"
                  href={GOVDIRECTORY_ICELAND.wikidataProject}
                  rel="noreferrer"
                  target="_blank"
                >
                  Wikidata Govdirectory/Iceland
                </a>
                . {GOVDIRECTORY_ICELAND.license}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {ledger.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardDescription>{group.label}</CardDescription>
                    <CardTitle className="font-serif text-3xl tabular-nums">
                      {group.matched} / {group.total}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {group.unmatched} unmatched
                      {group.grouped > 0 ? ` · ${group.grouped} grouped` : ""}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
            {ledger.map((group) => {
              const unmatched = group.rows.filter((row) => row.matchKind === "unmatched");
              const grouped = group.rows.filter((row) => row.matchKind === "grouped");
              return (
                <div className="flex flex-col gap-2" key={`${group.id}-detail`}>
                  <h3 className="text-sm font-medium">{group.label}</h3>
                  {grouped.length > 0 ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {grouped.length} district courts are listed separately on Govdirectory and
                      grouped here as{" "}
                      {grouped[0]?.href ? (
                        <Link className="underline underline-offset-4" href={grouped[0].href} lang="is">
                          Héraðsdómstólarnir
                        </Link>
                      ) : (
                        "Héraðsdómstólarnir"
                      )}
                      . That is a modeling choice, not eight extra catalog records.
                    </p>
                  ) : null}
                  {unmatched.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Every listed {group.label.toLowerCase()} row is matched or grouped.
                    </p>
                  ) : (
                    <Table>
                      <TableCaption>
                        Official names not yet in this catalog. Not a source of typed edges.
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Wikidata</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unmatched.map((row) => (
                          <TableRow key={`${group.id}-${row.name}`}>
                            <TableCell className="whitespace-normal" lang={group.id === "municipalities" ? "is" : undefined}>
                              {row.name}
                            </TableCell>
                            <TableCell className="whitespace-normal text-muted-foreground">
                              {row.note ?? "—"}
                            </TableCell>
                            <TableCell>
                              {row.wikidataHref ? (
                                <a
                                  className="underline underline-offset-4"
                                  href={row.wikidataHref}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Wikidata
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
