import Link from "next/link";

export function FiscalPhasesNav() {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-xl border bg-card p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Fiscal Data Package · budget
        </p>
        <h2 className="mt-1 font-medium">
          <a className="underline-offset-4 hover:underline" href="#authorisations">
            Authorisations
          </a>
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Article 4 ceilings. A permission to spend, not a payment. Typed as{" "}
          <Link className="underline underline-offset-4" href="/connections#authorisations">
            funds
          </Link>
          .
        </p>
      </article>
      <article className="rounded-xl border bg-card p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Fiscal Data Package · spending
        </p>
        <h2 className="mt-1 font-medium">
          <a className="underline-offset-4 hover:underline" href="#invoices">
            Invoices
          </a>
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          One Opnir reikningar row is one payment. Salaries, foreign-currency
          payments, and grants are not on that ledger. Typed as{" "}
          <Link className="underline underline-offset-4" href="/connections#spending">
            pays
          </Link>
          . Amounts are not added together.
        </p>
      </article>
      <article className="rounded-xl border bg-card p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Contracts · commodity lines
        </p>
        <h2 className="mt-1 font-medium">
          <a className="underline-offset-4 hover:underline" href="#contracts">
            Contracts
          </a>
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Power-purchase agreements and Hagstofa import/export commodity rows.
          Not invoices. Typed under{" "}
          <Link className="underline underline-offset-4" href="/connections#contracts">
            Contracts
          </Link>
          .
        </p>
      </article>
    </section>
  );
}
