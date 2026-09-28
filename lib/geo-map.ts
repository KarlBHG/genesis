import placesJson from "@/data/places.json";

export const LAYERS = [
  { id: "state", label: "State", swatch: "#d7c4a3" },
  { id: "companies", label: "Companies", swatch: "#8fb59a" },
  { id: "multinationals", label: "Multinationals", swatch: "#d08b62" },
  { id: "ngos", label: "NGOs", swatch: "#8eabcc" },
  { id: "societies", label: "Societies", swatch: "#c6b06a" },
  { id: "family", label: "Family", swatch: "#b7a3b0" },
] as const;

export type LayerId = (typeof LAYERS)[number]["id"];

export type PlaceId =
  | "reykjavik"
  | "straumsvik"
  | "grundartangi"
  | "reydarfjordur"
  | "keflavik"
  | "blonduos";

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
  { slug: "frimurarareglan", layer: "societies", place: "reykjavik" },
  { slug: "oddfellowreglan", layer: "societies", place: "reykjavik" },
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
  { slug: "orka-natturunnar", layer: "companies", place: "reykjavik" },
  { slug: "on-power", layer: "companies", place: "reykjavik" },
  { slug: "competition-authority", layer: "state", place: "reykjavik" },
  { slug: "personuvernd", layer: "state", place: "reykjavik" },
  { slug: "fjarskiptastofa", layer: "state", place: "reykjavik" },
  { slug: "umhverfis-og-orkustofnun", layer: "state", place: "reykjavik" },
  { slug: "natturuverndarstofnun", layer: "state", place: "reykjavik" },
  { slug: "courts", layer: "state", place: "reykjavik" },
  { slug: "embaetti-landlaeknis", layer: "state", place: "reykjavik" },
  { slug: "samband-islenskra-sveitarfelaga", layer: "state", place: "reykjavik" },
  { slug: "reykjavikurborg", layer: "state", place: "reykjavik" },
  { slug: "samfylkingin", layer: "state", place: "reykjavik" },
  { slug: "vidreisn", layer: "state", place: "reykjavik" },
  { slug: "flokkur-folksins", layer: "state", place: "reykjavik" },
  { slug: "sa-confederation", layer: "companies", place: "reykjavik" },
  { slug: "fisheries-iceland", layer: "companies", place: "reykjavik" },
  { slug: "helga-jonsdottir", layer: "companies", place: "reykjavik" },
  { slug: "brynja-baldursdottir", layer: "companies", place: "reykjavik" },
  { slug: "eirikur-s-johannsson", layer: "companies", place: "reykjavik" },
];

