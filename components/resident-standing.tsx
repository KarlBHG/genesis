import Link from "next/link";

import { StandingPicks } from "@/components/standing-picks";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { labelize } from "@/lib/format";
import {
  article4Caption,
  invoiceRowCaption,
  NO_SOURCED_LINE,
  standingFolioHref,
  type StandingBoard,
  type StandingEmptyHop,
  type StandingHop,
  type StandingQuestionView,
  type StandingSourcedHop,
} from "@/lib/standing";

const HOME_INVOICE_CAP = 3;

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

function Endpoint({ href, title }: { href: string | null; title: string }) {
  if (!href) return <span className="font-medium">{title}</span>;
  return (
    <Link className="font-medium underline-offset-4 hover:underline" href={href}>
      {title}
    </Link>
  );
}

function SourcedHopRow({ hop }: { hop: StandingSourcedHop }) {
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      <span
        aria-hidden
        className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full border border-primary/40 bg-background"
      />
      <p className="min-w-0 text-sm leading-6">
        <Endpoint href={hop.fromHref} title={hop.fromTitle} />{" "}
        <span className="text-muted-foreground">
          {labelize(hop.relationship).toLowerCase()}
        </span>{" "}
        <Endpoint href={hop.toHref} title={hop.toTitle} />
        {hop.asOf ? (
          <span className="text-muted-foreground"> · {hop.asOf}</span>
        ) : null}{" "}
        <Link
          className="whitespace-nowrap text-muted-foreground underline underline-offset-4"
          href={hop.href}
        >
          permalink
        </Link>
      </p>
    </div>
  );
}

function EmptyHopRow({ hop }: { hop: StandingEmptyHop }) {
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      <span
        aria-hidden
        className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full border border-dashed border-muted-foreground/50 bg-background"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium">{NO_SOURCED_LINE}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hop.want}</p>
      </div>
    </div>
  );
}

function HopList({ hops }: { hops: StandingHop[] }) {
  return (
    <ol className="relative m-0 flex list-none flex-col gap-0 p-0">
      {hops.map((hop, index) => {
        const connector = index < hops.length - 1;
        const key =
          hop.status === "sourced"
            ? hop.href
            : `${hop.status}-${hop.want}-${index}`;
        return (
          <li className="relative" key={key}>
            {connector ? (
              <span
                aria-hidden
                className="absolute top-3 left-[0.4375rem] h-[calc(100%-0.25rem)] w-px bg-border"
              />
            ) : null}
            {hop.status === "sourced" ? (
              <SourcedHopRow hop={hop} />
            ) : (
              <EmptyHopRow hop={hop} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function splitTaxpayerHops(hops: StandingHop[]) {
  const law: StandingHop[] = [];
  const article4: StandingHop[] = [];
  const invoices: StandingHop[] = [];
  for (const hop of hops) {
    if (hop.status === "sourced" && hop.relationship === "pays") {
      invoices.push(hop);
      continue;
    }
    if (
      hop.status === "empty" &&
      hop.want === "an invoice joined to this policy area"
    ) {
      invoices.push(hop);
      continue;
    }
    if (law.length === 0) {
      law.push(hop);
      continue;
    }
    article4.push(hop);
  }
  return { law, article4, invoices };
}

function QuestionCard({
  question,
  index,
  compact,
  programSlug,
  municipalitySlug,
}: {
  question: StandingQuestionView;
  index: number;
  compact: boolean;
  programSlug: string;
  municipalitySlug: string | null;
}) {
  const parts = question.id === "taxpayer" ? splitTaxpayerHops(question.hops) : null;
  const invoiceSourced =
    parts?.invoices.filter((hop) => hop.status === "sourced").length ?? 0;
  const article4Sourced =
    parts?.article4.filter((hop) => hop.status === "sourced").length ?? 0;
  const shownInvoices =
    compact && parts
      ? parts.invoices.slice(0, HOME_INVOICE_CAP)
      : (parts?.invoices ?? question.hops);

  return (
    <article className="folio-question flex flex-col gap-4" id={question.id}>
      <header className="flex flex-col gap-1">
        <p className="toc-num">{padIndex(index)}</p>
        <h3 className="font-serif text-lg font-medium tracking-tight">
          {question.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {question.blurb}
        </p>
      </header>
      {parts ? (
        <div className="flex flex-col gap-5">
          <HopList hops={[...parts.law, ...parts.article4]} />
          {article4Sourced > 0 ? (
            <p className="text-xs text-muted-foreground">
              {article4Caption(article4Sourced)}
            </p>
          ) : null}
          {invoiceSourced === 0 ? (
            <HopList hops={parts.invoices} />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {invoiceRowCaption(invoiceSourced)}
              </p>
              <HopList hops={shownInvoices} />
              {compact && invoiceSourced > HOME_INVOICE_CAP ? (
                <p className="text-sm text-muted-foreground">
                  <Link
                    className="underline underline-offset-4"
                    href={standingFolioHref(
                      programSlug,
                      municipalitySlug,
                      question.id,
                    )}
                  >
                    {invoiceSourced - HOME_INVOICE_CAP} more invoice rows on
                    the standing folio
                  </Link>
                  . Amounts are not shown.
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <HopList hops={question.hops} />
      )}
    </article>
  );
}

export function ResidentStanding({
  board,
  questions,
  programSlug,
  municipalitySlug,
  compact = false,
}: {
  board: StandingBoard;
  questions: StandingQuestionView[];
  programSlug: string;
  municipalitySlug: string | null;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6" id="standing">
      <StandingPicks
        board={board}
        municipalitySlug={municipalitySlug}
        programSlug={programSlug}
      />

      {board.municipalities.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No municipalities in the catalog</EmptyTitle>
            <EmptyDescription>
              A standing pick needs a catalog page. None are invented from a
              postcode file.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <div
        className={
          compact
            ? "standing-questions standing-questions-spread grid grid-cols-1 gap-0 xl:grid-cols-3"
            : "standing-questions grid grid-cols-1 gap-0"
        }
      >
        {questions.map((question, index) => (
          <QuestionCard
            compact={compact}
            index={index + 1}
            key={question.id}
            municipalitySlug={municipalitySlug}
            programSlug={programSlug}
            question={question}
          />
        ))}
      </div>
    </div>
  );
}
