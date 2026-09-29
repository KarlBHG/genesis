import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export function FiscalPhasesNav() {
  return (
    <section className="fiscal-phases grid gap-3 lg:grid-cols-3">
      {PHASES.map((phase) => (
        <Card className="ink-card" key={phase.href}>
          <CardHeader>
            <p className="kicker">{phase.kicker}</p>
            <CardTitle>
              <a className="underline-offset-4 hover:underline" href={phase.href}>
                {phase.title}
              </a>
            </CardTitle>
            <CardDescription className="text-sm leading-6">{phase.body}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}
