import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AsOfChip } from "@/components/as-of-chip";
import { PageHero } from "@/components/page-hero";
import { ProvenanceEdgeCard } from "@/components/provenance-edge";
import { Badge } from "@/components/ui/badge";
import { AS_OF_BUCKET_HELP, AS_OF_PARAM } from "@/lib/as-of-filter";
import { CONTRADICTION_STATE } from "@/lib/contradictions";
import {
  getCatalog,
  getContradictions,
  getEdges,
  getOffices,
} from "@/lib/content";
import { MAP_ENTRIES } from "@/lib/geo-map";
import { mapSlugHasTypedLinkage } from "@/lib/map-graph";
import {
  AS_OF_BUCKET_ORDER,
  REQUIRED_EDGE_FIELDS,
  methodologyStats,
} from "@/lib/methodology";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "The sourcing contract behind every connection: six required fields, quotation first, as-of buckets, why Article 4 rows are never summed, how contradictions stay unresolved, and what this project refuses to publish.",
};

const SECTIONS = [
  { id: "contract", label: "The contract" },
  { id: "fields", label: "Six required fields" },
  { id: "quotation", label: "Quotation first" },
  { id: "as-of", label: "As-of buckets" },
  { id: "retrieval", label: "Retrieval caveats" },
  { id: "money", label: "Three money stories" },
  { id: "article-four", label: "Why Article 4 is never summed" },
  { id: "contradictions", label: "Contradictions" },
  { id: "pin-only", label: "Pin only · no typed edge" },
  { id: "open-checklists", label: "Open checklists" },
  { id: "refusals", label: "What this refuses to do" },
] as const;

function Section({
  children,
  id,
  lede,
  title,
}: {
  children?: ReactNode;
  id: string;
  lede?: ReactNode;
  title: string;
}) {
  return (
    <section className="flex min-w-0 scroll-mt-24 flex-col gap-4" id={id}>
      <div className="flex max-w-reading flex-col gap-3">
        <h2 className="font-serif text-2xl font-medium tracking-tight">{title}</h2>
        {lede ? (
          <div className="flex flex-col gap-3 text-base leading-7 text-muted-foreground">
            {lede}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function MethodologyPage() {
  const edges = getEdges();
  const stats = methodologyStats(edges);
  const contradictions = getContradictions();
  const offices = getOffices();
  const catalog = getCatalog();
  const pinOnly = MAP_ENTRIES.filter(
    (entry) => !mapSlugHasTypedLinkage(entry.slug, edges, offices),
  );
  const sampleEdge =
    edges.find(
      (edge) => edge.relationship === "funds" && edge.amount != null,
    ) ??
    edges.find((edge) => edge.relationship === "funds") ??
    edges[0];
  const withAmount = edges.filter((edge) => edge.amount != null).length;

  return (
    <main className="dashboard-canvas min-w-0">
      <PageHero
        description={
          <>
            This is the contract you can hold the project to. Every connection in
            the catalog carries six fields and a sentence from a page you can
            open yourself. Where a page is undated, it says undated. Where two
            pages disagree, both stay. Where a figure would have to be invented
            to make a story close, the story does not close.
          </>
        }
        eyebrow={`Methodology · ${stats.edges} connections · ${catalog.length} records`}
        size="dramatic"
        title="How this map is sourced"
        aside={
          <nav
            aria-label="On this page"
            className="glass-panel flex flex-col gap-2 rounded-2xl p-5"
          >
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              On this page
            </p>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <Link
                    className="block rounded-lg px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                    href={`#${section.id}`}
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <div className="mx-auto flex w-full min-w-0 max-w-reading flex-col gap-14 px-4 py-12 sm:px-6">
        <Section
          id="contract"
          lede={
            <>
              <p>
                A connection here is not an assertion by this project. It is a
                pointer at somebody else’s sentence. That is the whole design: if
                the sentence is wrong, the public record is wrong, and you can see
                exactly where to go and check.
              </p>
              <p>
                Three things follow, and they are the reason some obvious
                questions have no answer on this site. A relationship nobody
                printed cannot be stored. A figure nobody printed cannot be
                computed. And two sources that disagree do not get averaged into
                one clean number.
              </p>
            </>
          }
          title="What a connection actually claims"
        >
          {sampleEdge ? (
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                One stored row, rendered the way every sourced line on this site is
                rendered:
              </p>
              <ProvenanceEdgeCard as="div" edge={sampleEdge} />
              <p className="text-sm leading-6 text-muted-foreground">
                Every typed line also has its own address, the way LittleSis treats a
                relationship as a page. Open{" "}
                <Link className="underline underline-offset-4" href="/connections">
                  Connections
                </Link>{" "}
                and follow “Open this connection” for the quotation, the as-of
                bucket, and the program join or the reason the join failed.
              </p>
            </div>
          ) : null}
        </Section>

        <Section
          id="fields"
          lede={
            <p>
              The loader refuses to start if a row in{" "}
              <code className="text-sm">data/edges.json</code> is missing any of
              these. There is no draft state and no partially sourced row: a
              connection either carries all six or it is not in the file.
            </p>
          }
          title="Six required fields"
        >
          <ol className="flex min-w-0 flex-col gap-3">
            {REQUIRED_EDGE_FIELDS.map((field, index) => (
              <li
                className="flex min-w-0 gap-4 rounded-xl border border-border/70 p-4"
                key={field.name}
              >
                <span className="shrink-0 font-serif text-lg tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-baseline gap-2">
                    <code className="text-sm font-medium">{field.name}</code>
                    <span className="text-sm">{field.title}</span>
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {field.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm leading-6 text-muted-foreground">
            {stats.relationshipTypes} relationship types are allowlisted across{" "}
            {stats.edges} rows. A new type is added only when a source class needs
            one, never to accommodate a single interesting page.
          </p>
        </Section>

        <Section
          id="quotation"
          lede={
            <>
              <p>
                The quotation comes first, and the label comes second. A row is
                written by finding a sentence and then deciding which of the
                allowlisted relationships it supports — not by deciding that two
                organisations must be connected and then hunting for a page that
                can be read that way.
              </p>
              <p>
                The practical consequence is that quotations are often longer,
                blander, and more Icelandic than a caption would be. That is the
                trade: you get the sentence, in its own language, rather than this
                project’s summary of it. Icelandic quotations are marked as
                Icelandic so a screen reader pronounces them as Icelandic.
              </p>
            </>
          }
          title="Quotation first, label second"
        />

        <Section
          id="as-of"
          lede={
            <>
              <p>
                Public pages date themselves inconsistently, and pretending
                otherwise is the easiest way to publish a false timeline. Instead
                of normalising everything into one date column, the stored value
                stays as printed and is sorted into one of four buckets. A chip on
                every line tells you which bucket you are looking at.
              </p>
              <p>
                Phrase dates are never sorted as if they were ISO dates. A year
                sorts against other years, a consolidated statute sorts by the
                lagasafn edition it was read in, and an undated row sorts last
                rather than being quietly placed at the start of a century.
              </p>
            </>
          }
          title="Four as-of buckets"
        >
          <ul className="flex min-w-0 flex-col gap-3">
            {AS_OF_BUCKET_ORDER.map((bucket) => (
              <li
                className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4"
                key={bucket}
              >
                <p className="flex flex-wrap items-baseline gap-2">
                  <Badge className="font-normal" variant="outline">
                    {bucket}
                  </Badge>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {stats.buckets[bucket]} of {stats.edges} connections
                  </span>
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {AS_OF_BUCKET_HELP[bucket]}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/30 p-4">
            <p className="text-sm font-medium">Filtering by period</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Any surface with the <span className="font-medium">As of</span> bar
              keeps its selection in the{" "}
              <code className="text-sm">?{AS_OF_PARAM}=</code> parameter, so a
              narrowed view can be shared as a link. Tokens are bucket names and
              year windows, comma separated —{" "}
              <Link
                className="underline underline-offset-4"
                href="/anomalies?asOf=iso,2026"
              >
                <code className="text-sm">?asOf=iso,2026</code>
              </Link>{" "}
              reads as “full dates, in 2026”. Because statute and undated rows
              carry no comparable year, a year window can never include them; the
              bar says how many rows that hides and offers a chip to bring them
              back.
            </p>
            <p className="flex flex-wrap items-center gap-3 text-sm">
              <AsOfChip asOf="2026-01-13" />
              <AsOfChip asOf="2024" />
              <AsOfChip asOf="consolidated statute" />
              <AsOfChip asOf="undated on the registry page" />
            </p>
          </div>
        </Section>

        <Section
          id="retrieval"
          lede={
            <>
              <p>
                Some addresses do not simply hand over their text. Three cases
                come up often enough that a line carrying one of them says so,
                right under the quotation, rather than leaving you to discover it
                when the link disappoints you.
              </p>
              <p>
                {stats.caveatTotal} of {stats.edges} connections carry one of
                these caveats.
              </p>
            </>
          }
          title="Retrieval caveats"
        >
          <ul className="flex min-w-0 flex-col gap-3">
            {[
              {
                label: "Script shell",
                count: stats.caveats["script-shell"],
                body:
                  "The address serves an application shell and the content arrives after its scripts run. The state invoice ledger is the main case: it prints no per-invoice address, so the stored address is the ledger root and the row records what the lookup returned.",
              },
              {
                label: "Bot check",
                count: stats.caveats["bot-check"],
                body:
                  "The address answered with a bot check and no article text on the pass that built the record. Nothing is quoted from it; a different page carries the figure, or the figure is not stored.",
              },
              {
                label: "PDF text extraction",
                count: stats.caveats.pdf,
                body:
                  "The sentence was pulled out of a PDF. Column order, table rules, and footnote placement are not preserved in the stored string, so a figure read this way is worth checking against the page it sits on.",
              },
            ].map((item) => (
              <li
                className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4"
                key={item.label}
              >
                <p className="flex flex-wrap items-baseline gap-2">
                  <Badge className="font-normal" variant="outline">
                    {item.label}
                  </Badge>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {item.count} connections
                  </span>
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="money"
          lede={
            <p>
              Three different things get called “spending” in Icelandic public
              records, and conflating them is how a reader ends up with a number
              nobody printed. They are kept apart in the data and labelled apart
              in the interface — authorisations, invoices, and contracts are
              separate map views, following the Fiscal Data Package split of
              budget packages from spending packages. Power-purchase and Hagstofa
              commodity rows sit with contracts, not with invoices.
            </p>
          }
          title="Authorisation, expenditure, invoice"
        >
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            {[
              {
                title: "Authorisation",
                source: "Article 4 of the budget bill",
                body:
                  "What Alþingi permits a ministry or policy area to spend. It is a ceiling set in advance, per policy area and subcategory. It is not a record that money moved.",
              },
              {
                title: "Expenditure",
                source: "Treasury and fiscal documents",
                body:
                  "What the Treasury reports as total expenditure or revenue for a year. It is an aggregate published by one body and it does not decompose into the authorisation rows.",
              },
              {
                title: "Invoice",
                source: "Opnir reikningar",
                body:
                  "One payment a named buyer made to a named vendor on a named day. It is the only one of the three that records money actually moving, and the stored sample is a sample — not the year.",
              },
            ].map((item) => (
              <article
                className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4"
                key={item.title}
              >
                <h3 className="text-base font-medium">{item.title}</h3>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  {item.source}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Where a cited page prints a figure, the row stores that figure with its
            own unit — m.kr., ma.kr., ISK — and the kind of document it came from.
            Nothing converts between units, nets a credit note, or adds two rows
            together, and the loader rejects a figure whose digits are not in the
            quotation beside it. {withAmount} of {stats.edges} connections carry a
            figure that way.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            An invoice is joined to a policy area only when the buyer’s ledger
            prints a budget heading that maps to it. Where it does not, the row
            stores the reason the join failed and the interface says so, instead of
            guessing from the vendor’s line of business. The joined rows are on the{" "}
            <Link className="underline underline-offset-4" href="/money#government-programs">
              policy-area pages
            </Link>
            .
          </p>
        </Section>

        <Section
          id="article-four"
          lede={
            <>
              <p>
                Article 4 lists an authorisation per policy area. Adding those
                rows together looks like arithmetic and is actually a claim — and
                the budget bill itself shows why. Its own Samtals row prints
                Heildarfjárheimild 1.672.186,3, while the row marked “Samtals skv.
                GFS staðli” prints 1.606.582,9, which is the figure Article 1 gives
                as total expenditure.
              </p>
              <p>
                Two different totals over the same table means the rows are not a
                simple partition of one quantity. So the rows are listed, each with
                its own quotation, and no total is derived from them anywhere on
                this site. If you want a total, the source prints two; pick one
                knowingly.
              </p>
            </>
          }
          title="Why Article 4 rows are never summed"
        />

        <Section
          id="contradictions"
          lede={
            <>
              <p>
                When two sourced sentences about the same records cannot both be
                the whole story, the disagreement itself becomes the record. It
                gets an id, both quotations, both as-of values, and links to the
                entries it lands on.
              </p>
              <p>{CONTRADICTION_STATE.explanation}</p>
            </>
          }
          title="Contradictions stay unresolved"
        >
          <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/70 p-4">
            <p className="flex flex-wrap items-baseline gap-2">
              <Badge className="font-normal" variant="destructive">
                {CONTRADICTION_STATE.label}
              </Badge>
              <span className="text-sm tabular-nums text-muted-foreground">
                {contradictions.length} on file
              </span>
            </p>
            <ul className="flex min-w-0 flex-col gap-1.5 text-sm">
              {contradictions.map((record) => (
                <li className="min-w-0 break-words" key={record.id}>
                  <Link
                    className="underline underline-offset-4"
                    href={`/anomalies#contradiction-${record.id}`}
                  >
                    {record.id}
                  </Link>
                  <span className="text-muted-foreground"> — {record.summary}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-6 text-muted-foreground">
              A field change is the other case: the page now prints something the
              stored row did not, and only one reading survives. Those are logged
              rather than applied silently, on{" "}
              <Link className="underline underline-offset-4" href="/anomalies#changes">
                Evidence
              </Link>
              .
            </p>
          </div>
        </Section>

        <Section
          id="pin-only"
          lede={
            <>
              <p>
                The map places a record at a place because a page says it sits
                there. That is a separate claim from being connected to anything.
                A record can be pinned and have no typed edge at all — the source
                gave an address and nothing else this project could type.
              </p>
              <p>
                Those pins are labelled{" "}
                <span className="font-medium">Pin only · no typed edge</span> in
                the map interface. The label is the honest version of an empty
                panel: the geography is sourced, the relationships are not there
                yet, and a reader should not infer them from proximity on a map.
              </p>
            </>
          }
          title="Pin only · no typed edge"
        >
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 p-4">
            <p className="flex flex-wrap items-baseline gap-2 text-sm">
              <Badge className="font-normal" variant="outline">
                Pin only · no typed edge
              </Badge>
              <span className="tabular-nums text-muted-foreground">
                {pinOnly.length} of {MAP_ENTRIES.length} map pins
              </span>
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              The reverse gap is recorded too: endpoints that carry typed edges but
              have no pin, because no page places them anywhere in Iceland. Trade
              partners, foreign vendors, and pension funds sit in that set. They are
              on{" "}
              <Link className="underline underline-offset-4" href="/connections">
                Connections
              </Link>{" "}
              and not on the{" "}
              <Link className="underline underline-offset-4" href="/map">
                map
              </Link>
              .
            </p>
          </div>
        </Section>

        <Section
          id="open-checklists"
          lede={
            <>
              <p>
                Govdirectory and Wikidata publish open lists of Icelandic ministries,
                courts, and municipalities. AlltÍkerfi stores a dated snapshot of that
                country page as a completeness checklist on{" "}
                <Link className="underline underline-offset-4" href="/public-entities">
                  Public entities
                </Link>
                . The snapshot is not loaded as typed edges. A Govdirectory title that
                does not match a catalog title is left unmatched rather than forced
                onto a nearby ministry.
              </p>
              <p>
                Wikidata is CC0. Using it as a checklist does not make it a primary
                source for an owns, regulates, or funds line.
              </p>
            </>
          }
          title="Open checklists"
        />

        <Section
          id="refusals"
          lede={
            <p>
              These are not features waiting to be built. They are things this
              project will not publish, because doing so would put a number or a
              judgement on the page that no source prints.
            </p>
          }
          title="What this refuses to do"
        >
          <ul className="flex min-w-0 flex-col gap-3">
            {[
              {
                title: "No influence scores",
                body:
                  "No ranking of people or institutions by power, centrality, or degree. Counting edges measures how much has been catalogued, not how much anybody matters.",
              },
              {
                title: "No unsourced figures",
                body:
                  "No Icelandic figure appears unless a page prints it. Where a release names a trade partner but prints no bilateral value, the line says the release prints no value rather than deriving one from a neighbouring table.",
              },
              {
                title: "No derived totals",
                body:
                  "Authorisation rows are not summed, invoices are not summed, and a sample of invoices is never presented as a year of spending.",
              },
              {
                title: "No waste or fraud labels",
                body:
                  "A row is not called waste, fraud, or abuse unless the source page uses that word. Repetition, size, and a familiar vendor name are not findings.",
              },
              {
                title: "No resolved contradictions",
                body:
                  "Disagreeing sources are not reconciled, averaged, or quietly deduplicated down to the more convenient sentence.",
              },
              {
                title: "No inferred relationships",
                body:
                  "Reading suggestions between entries are labelled as reading suggestions. They are not drawn as connections, and family, club, or school ties are not collected at all.",
              },
              {
                title: "No unsourced identifiers",
                body:
                  "A kennitala appears on a record only when a cited page prints it. The public checksum is used to refuse a mistyped stored id, not to mint one.",
              },
              {
                title: "No Wikidata edges",
                body:
                  "Open checklists from Govdirectory and Wikidata are not turned into owns, regulates, or parent-ministry lines. They only show which public bodies this phase chose to track.",
              },
            ].map((item) => (
              <li
                className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/70 p-4"
                key={item.title}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-6 text-muted-foreground">
            Where the record disagrees with itself, that is visible rather than
            resolved:{" "}
            <Link className="underline underline-offset-4" href="/anomalies">
              Evidence
            </Link>
            . Where a reading changed, the change is logged. Where the graph is
            thin, it looks thin.
          </p>
        </Section>
      </div>
    </main>
  );
}
