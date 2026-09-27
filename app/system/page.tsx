import type { Metadata } from "next";
import Link from "next/link";

import { getBySlug, getEdges, hrefFor } from "@/lib/content";
import { labelize } from "@/lib/format";

export const metadata: Metadata = {
  title: "System",
  description: "How the Icelandic state, the central bank, trade, and outside arrangements are recorded.",
};

const CHAIN = ["owns", "appoints", "elects", "incorporates", "imported-from", "exported-to"] as const;

export default function SystemPage() {
  const republic = getBySlug("republic-of-iceland");
  const treasury = getBySlug("rikissjodur");
  const bank = getBySlug("sedlabanki");
  const imports = getBySlug("goods-imports-2024");
  const edges = getEdges().filter(
    (edge) =>
      (CHAIN as readonly string[]).includes(edge.relationship) &&
      (edge.to === "sedlabanki" ||
        edge.from === "goods-imports-2024" ||
        edge.from === "goods-exports-2024" ||
        edge.relationship === "incorporates"),
  );

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">How the system operates</h1>
        <p className="text-muted-foreground">
          The records below are sentences from pages opened for this pass. A country named as a trade partner is not a company, and a legal form on the registry is not an influence score.
        </p>
      </header>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">The state</h2>
        {republic ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(republic)}>
              {republic.title}
            </Link>
            . {republic.summary}
          </p>
        ) : null}
        {treasury ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(treasury)}>
              {treasury.title}
            </Link>
            . {treasury.summary}
          </p>
        ) : null}
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Central bank</h2>
        {bank ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(bank)}>
              {bank.title}
            </Link>
            . The lines below are the ownership, appointment, and election sentences from the consolidated act. The act does not print Ásgeir Jónsson’s appointment date.
          </p>
        ) : null}
        <ul className="flex min-w-0 flex-col gap-3">
          {edges
            .filter((edge) => edge.to === "sedlabanki")
            .map((edge) => (
              <li className="min-w-0 rounded-lg border p-4" key={`${edge.relationship}-${edge.from}`}>
                <p className="break-words font-medium">
                  {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {edge.toTitle}
                </p>
                <p className="mt-1 break-words text-sm leading-6">{edge.quotation}</p>
              </li>
            ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Outside arrangements</h2>
        <p className="break-words">
          The EEA page says the agreement extends the EU single market to Iceland, and that new EEA-relevant EU legislation is incorporated by the EEA Joint Committee. That is not a statement that the European Union governs Icelandic territory. Schengen is a separate association agreement. NATO’s history says Iceland has no military forces of its own, signed a bilateral defence agreement with the United States in 1951, and hosted a permanent US defence force at Keflavík until 2006. The same page says Iceland now operates the NATO radar there and provides host-nation support.
        </p>
        <ul className="flex min-w-0 flex-col gap-3">
          {edges
            .filter((edge) => edge.relationship === "incorporates")
            .map((edge) => (
              <li className="min-w-0 rounded-lg border p-4" key={edge.relationship}>
                <p className="break-words font-medium">
                  {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {edge.toTitle}
                </p>
                <p className="mt-1 break-words text-sm leading-6">{edge.quotation}</p>
              </li>
            ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium">Goods, and from where</h2>
        {imports ? (
          <p className="break-words">
            <Link className="font-medium underline underline-offset-4" href={hrefFor(imports)}>
              {imports.title}
            </Link>
            . {imports.summary}
          </p>
        ) : null}
        <ul className="flex min-w-0 flex-col gap-2">
          {edges
            .filter((edge) => edge.relationship === "imported-from" || edge.relationship === "exported-to")
            .map((edge) => (
              <li className="min-w-0 break-words text-sm leading-6" key={`${edge.relationship}-${edge.to}`}>
                {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {edge.toTitle}
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
