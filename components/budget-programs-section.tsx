import Link from "next/link";

import { BudgetPolicyMagnitude } from "@/components/budget-policy-magnitude";
import { ProvenanceCard } from "@/components/provenance-card";
import { EntryIndex } from "@/components/entry-index";
import { getPolicyAreas, hrefFor } from "@/lib/content";

const INTRO = [
  "Hér á eftir fer umfjöllun um stefnumið, áform og aðgerðir næsta fjárlagaárs fyrir þau 35 málefnasvið og 105 málaflokka sem frumvarpið tekur til. Í umfjölluninni er gerð grein fyrir ábyrgð á einstökum sviðum, fjárhagslegri þróun á málefnasviði og einstökum málaflokkum á tímabilinu 2024–2026. Þá eru breytingar sundurliðaðar á útgjaldaramma málefnasviðs eftir helstu tilefnum og helstu tillögum um breytingar á fjárheimildum málaflokka frá gildandi fjárlögum.",
  "Greinargerðin felur í sér nánari útfærslu á þeirri stefnumörkun sem samþykkt var með ályktun Alþingis 14. júlí sl. um fjármálaáætlun fyrir árin 2026–2030. Einnig er tekið tillit til breytinga sem orðið hafa á útgjöldum málefnasviða við undirbúning fjárlagafrumvarpsins, s.s. af völdum breyttra reikniforsendna og ákvarðana ríkisstjórnarinnar um tiltekin málefni. Í fjármálaáætlun fyrir árin 2026–2030 var fjallað um þróun innan einstakra málefnasviða til næstu fimm ára ásamt helstu áherslum, framtíðarsýn og meginmarkmiðum á málefnasviðinu. Í þeirri greinargerð sem hér fer á eftir er gerð grein fyrir þeim verkefnum og aðgerðum sem taka til næsta fjárlagaárs og sundurliðun fjárheimilda eins og hún birtist í frumvarpinu.",
  "Með kynningu á stefnum fyrir málefnasvið í árlegri fjármálaáætlun er leitast við að tryggja að Alþingi hafi greinargóðar upplýsingar um meginlínur og áherslur þegar það fjallar um áætlun sem er stefnumarkandi fyrir ríkisstarfsemina í heild sinni til meðallangs tíma. Til viðbótar eru birt mælanleg markmið fyrir einstaka málaflokka í mælaborði árangurs. Þar er jafnframt birt staða einstaka mælikvarða og viðmið um árangur á tímabili fjármálaáætlunar. Upplýsingar um árangur má einnig finna í ársskýrslum ráðherra ásamt upplýsingum um stöðu verkefna úr fjárlagafrumvarpi sl. árs. Þannig gefst Alþingi tækifæri til að fylgja eftir árangri af ráðstöfun fjármuna og leggja mat á hvort þær aðgerðir sem gerð er grein fyrir í ársskýrslum ráðherra hafi skilað tilætluðum árangri. Sömuleiðis hvort þær ráðstafanir sem lagðar eru til í fjárlagafrumvarpinu séu líklegar til að stuðla að þeim árangri sem lagt er upp með.",
];

const ARTICLE_FOUR =
  "Árið 2026 er gert ráð fyrir að framlög úr ríkissjóði (A1-hluta) og fjárheimildir fyrir heildargjöldum, án rekstrartekna, sundurliðaðar eftir málefnasviðum, málaflokkum og ráðuneytum verði eins og tilgreint er í þessari grein.";

/** Same inngangur page already cited on every policy-area record. */
export const BUDGET_INTRO_SOURCE =
  "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/fjarlog-fyrir-arid-2026/greinargerdir-raduneyta/greinargerd/inngangur-greinargerd-raduneyta-um-malefnasvid-og-malaflokka/";

/** Same lagagreinar page already cited on every policy-area record. */
export const ARTICLE_FOUR_SOURCE =
  "https://www.stjornarradid.is/verkefni/opinber-fjarmal/fjarlog/fjarlog-fyrir-arid-2026/lagagreinar/";

export function BudgetProgramsSection() {
  const areas = getPolicyAreas();
  const items = areas.map((flow) => ({
    title: flow.title,
    href: hrefFor(flow),
    summary: flow.summary,
    meta: flow.year,
  }));

  return (
    <section
      className="flex min-w-0 flex-col gap-8 scroll-mt-24"
      id="government-programs"
    >
      <BudgetPolicyMagnitude />
      <div className="flex max-w-folio flex-col gap-5">
        <header className="flex max-w-reading flex-col gap-2">
          <h2 className="font-serif text-xl font-medium">Government programs, 2026</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {areas.length} policy areas. Each card quotes the spending line that area’s
            ministry report prints for 2026. Article 4 authorisation rows are listed on
            each area page. Rows are not added together.
          </p>
        </header>
        <h3 className="text-lg font-medium">What the introduction says</h3>
        <ul className="flex min-w-0 flex-col gap-3">
          {INTRO.map((quote) => (
            <ProvenanceCard
              as="li"
              asOf="2026"
              key={quote.slice(0, 40)}
              quotation={quote}
              source={BUDGET_INTRO_SOURCE}
              title="Ministry-report introduction"
            />
          ))}
        </ul>
        <h3 className="text-lg font-medium">How Article 4 says the money is set</h3>
        <ProvenanceCard
          asOf="2026"
          quotation={ARTICLE_FOUR}
          source={ARTICLE_FOUR_SOURCE}
          title="Article 4 of the 2026 budget law"
        />
        <p className="max-w-reading text-sm text-muted-foreground">
          Compare two policy areas side by side on{" "}
          <Link className="underline underline-offset-4" href="/compare">
            Compare
          </Link>{" "}
          (pick any two <span lang="is">málefnasvið</span> entries). Article 4’s{" "}
          <span lang="is">Samtals</span> row prints{" "}
          <span lang="is">Heildar-fjárheimild</span> 1.672.186,3. The row{" "}
          <span lang="is">“Samtals skv. GFS staðli”</span> prints 1.606.582,9. Article 1 prints that same
          1.606.582,9 as total expenditure. Area rows are not added together. Ledger
          display names for{" "}
          <Link className="underline underline-offset-4" href="/players/on-power">
            ON Power
          </Link>{" "}
          and{" "}
          <Link className="underline underline-offset-4" href="/players/orka-natturunnar">
            <span lang="is">Orka náttúrunnar</span>
          </Link>{" "}
          are called out in the budget materials.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No policy areas are on file.</p>
      ) : (
        <EntryIndex items={items} />
      )}
    </section>
  );
}
