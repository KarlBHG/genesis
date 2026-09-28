import placesJson from "@/data/places.json";

export const LAYERS = [
  { id: "state", label: "State", swatch: "var(--layer-state)" },
  { id: "companies", label: "Companies", swatch: "var(--layer-companies)" },
  { id: "multinationals", label: "Multinationals", swatch: "var(--layer-multinationals)" },
  { id: "ngos", label: "NGOs", swatch: "var(--layer-ngos)" },
  { id: "societies", label: "Societies", swatch: "var(--layer-societies)" },
  { id: "family", label: "Family", swatch: "var(--layer-family)" },
] as const;

export type LayerId = (typeof LAYERS)[number]["id"];

export type PlaceId =
  | "reykjavik"
  | "straumsvik"
  | "grundartangi"
  | "reydarfjordur"
  | "keflavik"
  | "reykjanesbaer"
  | "blonduos"
  | "kopavogur"
  | "hafnarfjordur"
  | "akureyri"
  | "gardabaer"
  | "mosfellsbaer"
  | "arborg"
  | "akranes"
  | "fjardabyggd"
  | "vestmannaeyjar"
  | "seltjarnarnes"
  | "hvanneyri";

export type Place = {
  id: PlaceId;
  name: string;
  lat: number;
  lon: number;
};

// Coordinates are Nominatim results for the named places, September 2026.
// Reykjavík is one cluster. Door addresses in the city are not separate dots.
export const PLACES: Place[] = placesJson as Place[];

export const MAP_VIEWS = [
  { id: "ownership", label: "Ownership", relationships: ["owns"] },
  { id: "investments", label: "Investments", relationships: ["invests-in"] },
  {
    id: "money",
    label: "Money flows",
    relationships: ["funds", "sells-power-to", "export-of", "import-line-of"],
  },
  {
    id: "careers",
    label: "Careers",
    relationships: ["holds-office", "sits-on-board"],
  },
  { id: "spending", label: "Spending", relationships: ["pays"] },
  {
    id: "authority",
    label: "Authority",
    relationships: ["appoints", "elects", "regulates", "incorporates", "represents"],
  },
  {
    id: "trade",
    label: "Trade partners",
    relationships: ["imported-from", "exported-to", "tariff-terms"],
  },
] as const;

export type ViewId = (typeof MAP_VIEWS)[number]["id"];

export function viewOf(relationship: string): ViewId | null {
  const view = MAP_VIEWS.find((item) =>
    (item.relationships as readonly string[]).includes(relationship),
  );
  return view?.id ?? null;
}

export type MapEntryRef = {
  slug: string;
  layer: LayerId;
  place: PlaceId;
  /** Geographic pin with no typed edge yet; map UI must say so explicitly. */
  pinOnly?: boolean;
};

export const MAP_ENTRIES: MapEntryRef[] = [
  { slug: "althingi", layer: "state", place: "reykjavik" },
  { slug: "republic-of-iceland", layer: "state", place: "reykjavik" },
  { slug: "rikissjodur", layer: "state", place: "reykjavik" },
  { slug: "sedlabanki", layer: "state", place: "reykjavik" },
  { slug: "prime-ministers-office", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-finance", layer: "state", place: "reykjavik" },
  { slug: "ministry-for-foreign-affairs", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-justice", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-infrastructure", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-health", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-education-and-children", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-culture-innovation-and-higher-education", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-social-affairs-and-housing", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-the-environment-energy-and-climate", layer: "state", place: "reykjavik" },
  { slug: "ministry-of-industries", layer: "state", place: "reykjavik" },
  { slug: "landsbankinn", layer: "companies", place: "reykjavik" },
  { slug: "arion-banki", layer: "companies", place: "reykjavik" },
  { slug: "islandsbanki", layer: "companies", place: "reykjavik" },
  { slug: "landsvirkjun", layer: "companies", place: "reykjavik" },
  { slug: "frimurarareglan", layer: "societies", place: "reykjavik", pinOnly: true },
  { slug: "oddfellowreglan", layer: "societies", place: "reykjavik", pinOnly: true },
  { slug: "nordural", layer: "companies", place: "grundartangi" },
  { slug: "isavia", layer: "companies", place: "keflavik" },
  { slug: "borealis-data-center", layer: "companies", place: "blonduos" },
  { slug: "isal", layer: "multinationals", place: "straumsvik" },
  { slug: "alcoa-fjardaal", layer: "multinationals", place: "reydarfjordur" },
  { slug: "kristrun-frostadottir", layer: "state", place: "reykjavik" },
  { slug: "dadi-mar-kristofersson", layer: "state", place: "reykjavik" },
  { slug: "alma-d-moller", layer: "state", place: "reykjavik" },
  { slug: "hanna-katrin-fridriksson", layer: "state", place: "reykjavik" },
  { slug: "eyjolfur-armannsson", layer: "state", place: "reykjavik" },
  { slug: "ragnar-thor-ingolfsson", layer: "state", place: "reykjavik" },
  { slug: "inga-saeland", layer: "state", place: "reykjavik" },
  { slug: "thorgerdur-katrin-gunnarsdottir", layer: "state", place: "reykjavik" },
  { slug: "logi-einarsson", layer: "state", place: "reykjavik" },
  { slug: "thorbjorg-sigurdur-gunnlaugsdottir", layer: "state", place: "reykjavik" },
  { slug: "johann-pall-johannsson", layer: "state", place: "reykjavik" },
  { slug: "asgeir-jonsson", layer: "state", place: "reykjavik" },
  { slug: "hordur-arnarson", layer: "companies", place: "reykjavik" },
  { slug: "lilja-bjork-einarsdottir", layer: "companies", place: "reykjavik" },
  { slug: "jon-gudni-omarsson", layer: "companies", place: "reykjavik" },
  { slug: "ruv", layer: "companies", place: "reykjavik" },
  { slug: "landsnet", layer: "companies", place: "reykjavik" },
  { slug: "il-sjodur", layer: "state", place: "reykjavik" },
  { slug: "orkuveita-reykjavikur", layer: "companies", place: "reykjavik" },
  { slug: "orka-natturunnar", layer: "companies", place: "reykjavik" },
  { slug: "on-power", layer: "companies", place: "reykjavik" },
  { slug: "competition-authority", layer: "state", place: "reykjavik" },
  { slug: "personuvernd", layer: "state", place: "reykjavik" },
  { slug: "fjarskiptastofa", layer: "state", place: "reykjavik" },
  { slug: "umhverfis-og-orkustofnun", layer: "state", place: "reykjavik" },
  { slug: "natturuverndarstofnun", layer: "state", place: "reykjavik" },
  { slug: "hagstofa-islands", layer: "state", place: "reykjavik" },
  { slug: "skatturinn", layer: "state", place: "reykjavik" },
  { slug: "fiskistofa", layer: "state", place: "hafnarfjordur" },
  { slug: "rikisendurskodun", layer: "state", place: "reykjavik" },
  { slug: "courts", layer: "state", place: "reykjavik" },
  { slug: "haestirettur", layer: "state", place: "reykjavik" },
  { slug: "landsrettur", layer: "state", place: "reykjavik" },
  { slug: "heradsdomstolar", layer: "state", place: "reykjavik" },
  { slug: "domstolasyslan", layer: "state", place: "reykjavik" },
  { slug: "haskoli-islands", layer: "state", place: "reykjavik" },
  { slug: "haskolinn-a-akureyri", layer: "state", place: "akureyri" },
  { slug: "landbunadarhaskoli-islands", layer: "state", place: "hvanneyri" },
  { slug: "embaetti-landlaeknis", layer: "state", place: "reykjavik" },
  { slug: "samband-islenskra-sveitarfelaga", layer: "state", place: "reykjavik" },
  { slug: "reykjavikurborg", layer: "state", place: "reykjavik" },
  { slug: "kopavogsbær", layer: "state", place: "kopavogur" },
  { slug: "hafnarfjordurbær", layer: "state", place: "hafnarfjordur" },
  { slug: "reykjanesbær", layer: "state", place: "reykjanesbaer" },
  { slug: "akureyrarbær", layer: "state", place: "akureyri" },
  { slug: "gardabær", layer: "state", place: "gardabaer" },
  { slug: "mosfellsbær", layer: "state", place: "mosfellsbaer" },
  { slug: "sveitarfelagid-arborg", layer: "state", place: "arborg" },
  { slug: "akraneskaupstaður", layer: "state", place: "akranes" },
  { slug: "fjardabyggd", layer: "state", place: "fjardabyggd" },
  { slug: "vestmannaeyjabær", layer: "state", place: "vestmannaeyjar" },
  { slug: "seltjarnarnesbær", layer: "state", place: "seltjarnarnes" },
  { slug: "samfylkingin", layer: "state", place: "reykjavik" },
  { slug: "vidreisn", layer: "state", place: "reykjavik" },
  { slug: "flokkur-folksins", layer: "state", place: "reykjavik" },
  { slug: "sa-confederation", layer: "companies", place: "reykjavik" },
  { slug: "asi", layer: "ngos", place: "reykjavik" },
  { slug: "bsrb", layer: "ngos", place: "reykjavik" },
  { slug: "bhm", layer: "ngos", place: "reykjavik" },
  { slug: "efling", layer: "ngos", place: "reykjavik" },
  { slug: "vr", layer: "ngos", place: "reykjavik" },
  { slug: "landssamband-verslunarmanna", layer: "ngos", place: "reykjavik" },
  { slug: "virk-starfsendurhaefing", layer: "ngos", place: "reykjavik" },
  { slug: "bjarg-ibudafelag", layer: "ngos", place: "reykjavik" },
  { slug: "fisheries-iceland", layer: "companies", place: "reykjavik" },
  { slug: "helga-jonsdottir", layer: "companies", place: "reykjavik" },
  { slug: "brynja-baldursdottir", layer: "companies", place: "reykjavik" },
  { slug: "eirikur-s-johannsson", layer: "companies", place: "reykjavik" },
  { slug: "1951-defense-agreement", layer: "state", place: "keflavik" },
  { slug: "2006-keflavik-base", layer: "state", place: "keflavik" },
  { slug: "2008-financial-crisis", layer: "state", place: "reykjavik" },
  { slug: "imf-program-2008", layer: "state", place: "reykjavik" },
  { slug: "1994-eea-entry", layer: "state", place: "reykjavik" },
  { slug: "2008-capital-controls", layer: "state", place: "reykjavik" },
  { slug: "2017-capital-controls", layer: "state", place: "reykjavik" },
  { slug: "financial-supervisory-authority", layer: "state", place: "reykjavik" },
  { slug: "treasury-budget-2026", layer: "state", place: "reykjavik" },
  { slug: "landspitali", layer: "state", place: "reykjavik" },
  { slug: "treasury-debt", layer: "state", place: "reykjavik" },
  { slug: "healthcare", layer: "state", place: "reykjavik" },
  { slug: "nato", layer: "state", place: "reykjavik" },
  { slug: "eea-agreement", layer: "state", place: "reykjavik" },
  { slug: "fisheries-and-quotas", layer: "state", place: "reykjavik" },
  { slug: "agriculture", layer: "state", place: "reykjavik" },
  { slug: "goods-imports-2024", layer: "state", place: "reykjavik" },
  { slug: "goods-exports-2024", layer: "state", place: "reykjavik" },
  { slug: "marine-products-exports-2024", layer: "state", place: "reykjavik" },
  { slug: "aluminium-exports-2024", layer: "state", place: "reykjavik" },
  { slug: "power-and-aluminium", layer: "state", place: "reykjavik" },
  { slug: "jon-thorvardur-sigurgeirsson", layer: "companies", place: "reykjavik" },
  { slug: "heidar-gudjonsson", layer: "companies", place: "reykjavik" },
  { slug: "greta-maria-gretarsdottir", layer: "companies", place: "keflavik" },
  { slug: "harpa-thuridur-bodvarsdottir", layer: "companies", place: "reykjavik" },
  { slug: "stefan-jon-hafstein", layer: "companies", place: "reykjavik" },
  { slug: "paul-horner", layer: "companies", place: "reykjavik" },
  { slug: "syn", layer: "companies", place: "reykjavik" },
  { slug: "arvakur", layer: "companies", place: "reykjavik" },
  { slug: "morgunbladid", layer: "companies", place: "reykjavik" },
  { slug: "visir", layer: "companies", place: "reykjavik" },
  { slug: "siminn", layer: "companies", place: "reykjavik" },
  { slug: "birta", layer: "companies", place: "reykjavik" },
  { slug: "hagar", layer: "companies", place: "reykjavik" },
  { slug: "vinnumalastofnun", layer: "state", place: "reykjavik" },
  { slug: "bru", layer: "companies", place: "reykjavik" },
  { slug: "stapi", layer: "companies", place: "reykjavik" },
  { slug: "lsr", layer: "companies", place: "reykjavik" },
  { slug: "advania-island", layer: "companies", place: "reykjavik" },
  { slug: "hreyfill", layer: "companies", place: "reykjavik" },
  { slug: "nova", layer: "companies", place: "reykjavik" },
  { slug: "bilaleiga-flugleida", layer: "companies", place: "reykjavik" },
  { slug: "policy-area-01-althingi-og-eftirlitsstofnanir-thess", layer: "state", place: "reykjavik" },
  { slug: "policy-area-02-domstolar", layer: "state", place: "reykjavik" },
  { slug: "policy-area-03-aedsta-stjornsysla", layer: "state", place: "reykjavik" },
  { slug: "policy-area-04-utanrikismal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-05-skatta-eigna-og-fjarmalaumsysla", layer: "state", place: "reykjavik" },
  { slug: "policy-area-06-hagskyrslugerd-og-grunnskrar", layer: "state", place: "reykjavik" },
  { slug: "policy-area-07-nyskopun-rannsoknir-og-thekkingargreinar", layer: "state", place: "reykjavik" },
  { slug: "policy-area-08-sveitarfelog-og-byggdamal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-09-almanna-og-rettaroryggi", layer: "state", place: "reykjavik" },
  { slug: "policy-area-10-rettindi-einstaklinga-trumal-og-stjornsysla-domsmala", layer: "state", place: "reykjavik" },
  { slug: "policy-area-11-samgongu-og-fjarskiptamal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-12-landbunadur", layer: "state", place: "reykjavik" },
  { slug: "policy-area-13-sjavarutvegur-og-fiskeldi", layer: "state", place: "reykjavik" },
  { slug: "policy-area-14-ferdathjonusta", layer: "state", place: "reykjavik" },
  { slug: "policy-area-15-orkumal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-16-markadseftirlit-og-neytendamal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-17-umhverfismal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-18-menning-listir-ithrotta-og-aeskulydsmal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-19-fjolmidlun", layer: "state", place: "reykjavik" },
  { slug: "policy-area-20-framhaldsskolastig", layer: "state", place: "reykjavik" },
  { slug: "policy-area-21-haskolastig", layer: "state", place: "reykjavik" },
  { slug: "policy-area-22-onnur-skolastig-og-stjornsysla-mennta-og-barnamala", layer: "state", place: "reykjavik" },
  { slug: "policy-area-23-sjukrahusthjonusta", layer: "state", place: "reykjavik" },
  { slug: "policy-area-24-heilbrigdisthjonusta-utan-sjukrahusa", layer: "state", place: "reykjavik" },
  { slug: "policy-area-25-hjukrunar-og-endurhaefingarthjonusta", layer: "state", place: "reykjavik" },
  { slug: "policy-area-26-lyf-og-laekningavorur", layer: "state", place: "reykjavik" },
  { slug: "policy-area-27-ororka-og-malefni-fatlads-folks", layer: "state", place: "reykjavik" },
  { slug: "policy-area-28-malefni-aldradra", layer: "state", place: "reykjavik" },
  { slug: "policy-area-29-fjolskyldumal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-30-vinnumarkadur-og-atvinnuleysi", layer: "state", place: "reykjavik" },
  { slug: "policy-area-31-husnaedis-og-skipulagsmal", layer: "state", place: "reykjavik" },
  { slug: "policy-area-32-lydheilsa-og-stjornsysla-velferdarmala", layer: "state", place: "reykjavik" },
  { slug: "policy-area-33-fjarmagnskostnadur-abyrgdir-og-lifeyrisskuldbindingar", layer: "state", place: "reykjavik" },
  { slug: "policy-area-34-almennur-varasjodur-og-sertaekar-fjarradstafanir", layer: "state", place: "reykjavik" },
  { slug: "policy-area-35-althjodleg-throunarsamvinna-islands", layer: "state", place: "reykjavik" },
];

/** Layers that have at least one map pin (empty NGO/Family toggles stay hidden). */
export const MAP_LAYERS = LAYERS.filter((layer) =>
  MAP_ENTRIES.some((entry) => entry.layer === layer.id),
);

