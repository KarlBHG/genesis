import Link from "next/link";

const PHASES = [
  {
    href: "#authorisations",
    kicker: "Budget · authorisation",
    title: "Authorisations",
    body: (
      <>
        Article 4 ceilings. A permission to spend, not a payment. Typed as{" "}
        <Link className="underline underline-offset-4" href="/connections#authorisations">
          funds
        </Link>
        .
      </>
    ),
  },
  {
    href: "#invoices",
    kicker: "Spending · invoices",
    title: "Invoices",
    body: (
      <>
        One Opnir reikningar row is one payment. Salaries, foreign-currency
        payments, and grants are not on that ledger. Typed as{" "}
        <Link className="underline underline-offset-4" href="/connections#spending">
          pays
        </Link>
        . Coverage of every stored row is the Invoice coverage tab on this page.
        Amounts are not added together.
      </>
    ),
  },
  {
    href: "#contracts",
    kicker: "Contracts · commodities",
    title: "Contracts",
    body: (
      <>
        Power-purchase agreements and Hagstofa import/export commodity rows.
        Not invoices. Typed under{" "}
        <Link className="underline underline-offset-4" href="/connections#contracts">
          Contracts
        </Link>
        .
      </>
    ),
  },
] as const;

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

export function FiscalPhasesNav() {
  return (
    <section
      aria-label="Fiscal phases"
      className="fiscal-phases grid gap-0 lg:grid-cols-3"
    >
      {PHASES.map((phase, index) => (
        <article className="folio-phase" key={phase.href}>
          <p className="toc-num">{padIndex(index + 1)}</p>
          <p className="kicker">{phase.kicker}</p>
          <h2 className="font-serif text-xl font-medium tracking-tight">
            <a className="underline-offset-4 hover:underline" href={phase.href}>
              {phase.title}
            </a>
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{phase.body}</p>
        </article>
      ))}
    </section>
  );
}
