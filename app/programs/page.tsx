import type { Metadata } from "next";
import Link from "next/link";

import { EntryIndex } from "@/components/entry-index";
import { getFlows, hrefFor } from "@/lib/content";

export const metadata: Metadata = {
  title: "Programs",
  description: "The 35 policy areas in the 2026 Icelandic budget, with what the ministry reports say they do, the spending change they print, and the Article 4 authorisations.",
};

const INTRO = [
  "Hér á eftir fer umfjöllun um stefnumið, áform og aðgerðir næsta fjárlagaárs fyrir þau 35 málefnasvið og 105 málaflokka sem frumvarpið tekur til. Í umfjölluninni er gerð grein fyrir ábyrgð á einstökum sviðum, fjárhagslegri þróun á málefnasviði og einstökum málaflokkum á tímabilinu 2024–2026. Þá eru breytingar sundurliðaðar á útgjaldaramma málefnasviðs eftir helstu tilefnum og helstu tillögum um breytingar á fjárheimildum málaflokka frá gildandi fjárlögum.",
  "Greinargerðin felur í sér nánari útfærslu á þeirri stefnumörkun sem samþykkt var með ályktun Alþingis 14. júlí sl. um fjármálaáætlun fyrir árin 2026–2030. Einnig er tekið tillit til breytinga sem orðið hafa á útgjöldum málefnasviða við undirbúning fjárlagafrumvarpsins, s.s. af völdum breyttra reikniforsendna og ákvarðana ríkisstjórnarinnar um tiltekin málefni. Í fjármálaáætlun fyrir árin 2026–2030 var fjallað um þróun innan einstakra málefnasviða til næstu fimm ára ásamt helstu áherslum, framtíðarsýn og meginmarkmiðum á málefnasviðinu. Í þeirri greinargerð sem hér fer á eftir er gerð grein fyrir þeim verkefnum og aðgerðum sem taka til næsta fjárlagaárs og sundurliðun fjárheimilda eins og hún birtist í frumvarpinu.",
  "Með kynningu á stefnum fyrir málefnasvið í árlegri fjármálaáætlun er leitast við að tryggja að Alþingi hafi greinargóðar upplýsingar um meginlínur og áherslur þegar það fjallar um áætlun sem er stefnumarkandi fyrir ríkisstarfsemina í heild sinni til meðallangs tíma. Til viðbótar eru birt mælanleg markmið fyrir einstaka málaflokka í mælaborði árangurs. Þar er jafnframt birt staða einstaka mælikvarða og viðmið um árangur á tímabili fjármálaáætlunar. Upplýsingar um árangur má einnig finna í ársskýrslum ráðherra ásamt upplýsingum um stöðu verkefna úr fjárlagafrumvarpi sl. árs. Þannig gefst Alþingi tækifæri til að fylgja eftir árangri af ráðstöfun fjármuna og leggja mat á hvort þær aðgerðir sem gerð er grein fyrir í ársskýrslum ráðherra hafi skilað tilætluðum árangri. Sömuleiðis hvort þær ráðstafanir sem lagðar eru til í fjárlagafrumvarpinu séu líklegar til að stuðla að þeim árangri sem lagt er upp með.",
];

const ARTICLE_FOUR = "Árið 2026 er gert ráð fyrir að framlög úr ríkissjóði (A1-hluta) og fjárheimildir fyrir heildargjöldum, án rekstrartekna, sundurliðaðar eftir málefnasviðum, málaflokkum og ráðuneytum verði eins og tilgreint er í þessari grein.";

export default function ProgramsPage() {
  const items = getFlows()
    .filter((flow) => flow.slug.startsWith("policy-area-"))
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((flow) => ({
      title: flow.title,
      href: hrefFor(flow),
      summary: flow.summary,
      meta: flow.year,
    }));

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-medium tracking-tight">Government programs, 2026</h1>
        <p className="text-muted-foreground">
          These are the 35 policy areas in the 2026 budget. Each card quotes the spending line that area’s ministry report prints for 2026. Open an area for the work the report describes, the Article 4 authorisation rows, and why the introduction says the reports exist.
        </p>
        <p>
          Article 4’s Samtals row prints Heildar-fjárheimild 1.672.186,3. The row “Samtals skv. GFS staðli” prints 1.606.582,9 in that column. Article 1 prints that same 1.606.582,9 as total expenditure. Area rows are listed on each page. They are not added together. Where a ministry report prints one figure and Article 4 prints several rows, both stay.
        </p>
        <p>
          The two kennitölur that the ledger prints under one display name are{" "}
          <Link className="underline underline-offset-4" href="/players/on-power">
            ON Power ohf.
          </Link>{" "}
          and{" "}
          <Link className="underline underline-offset-4" href="/players/orka-natturunnar">
            Orka náttúrunnar ohf.
          </Link>
          .
        </p>
      </header>
      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-xl font-medium">What the introduction says</h2>
        {INTRO.map((quote) => (
          <blockquote className="border-l-2 pl-4 text-sm leading-6" key={quote.slice(0, 40)}>
            {quote}
          </blockquote>
        ))}
        <h2 className="text-xl font-medium">How Article 4 says the money is set</h2>
        <blockquote className="border-l-2 pl-4 text-sm leading-6">{ARTICLE_FOUR}</blockquote>
      </section>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No policy areas are on file.</p>
      ) : (
        <EntryIndex items={items} />
      )}
    </main>
  );
}
