export const LAYERS = [
  { id: "state", label: "State", swatch: "#d7c4a3" },
  { id: "companies", label: "Companies", swatch: "#8fb59a" },
  { id: "multinationals", label: "Multinationals", swatch: "#d08b62" },
  { id: "ngos", label: "NGOs", swatch: "#8eabcc" },
  { id: "societies", label: "Societies", swatch: "#c6b06a" },
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
export const PLACES: Place[] = [
  { id: "reykjavik", name: "Reykjavík", lat: 64.145981, lon: -21.9422367 },
  { id: "straumsvik", name: "Straumsvík", lat: 64.0434623, lon: -22.0442726 },
  { id: "grundartangi", name: "Grundartangi", lat: 64.3601585, lon: -21.7841266 },
  { id: "reydarfjordur", name: "Reyðarfjörður", lat: 65.0340671, lon: -14.2084678 },
  { id: "keflavik", name: "Keflavík", lat: 63.9850119, lon: -22.6266959 },
  { id: "blonduos", name: "Blönduós", lat: 65.6601344, lon: -20.280998 },
];

export type MapEntryRef = {
  slug: string;
  layer: LayerId;
  place: PlaceId;
};

export const MAP_ENTRIES: MapEntryRef[] = [
  { slug: "althingi", layer: "state", place: "reykjavik" },
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
];

export type PowerString = {
  fromSlug: string;
  toSlug: string;
  fromPlace: PlaceId;
  toPlace: PlaceId;
  year: string;
  bend: number;
};

export const POWER_STRINGS: PowerString[] = [
  { fromSlug: "landsvirkjun", toSlug: "isal", fromPlace: "reykjavik", toPlace: "straumsvik", year: "2021", bend: 0 },
  { fromSlug: "landsvirkjun", toSlug: "nordural", fromPlace: "reykjavik", toPlace: "grundartangi", year: "2024", bend: -14 },
  { fromSlug: "landsvirkjun", toSlug: "nordural", fromPlace: "reykjavik", toPlace: "grundartangi", year: "2026", bend: 14 },
  { fromSlug: "landsvirkjun", toSlug: "alcoa-fjardaal", fromPlace: "reykjavik", toPlace: "reydarfjordur", year: "2025", bend: 0 },
  { fromSlug: "landsvirkjun", toSlug: "borealis-data-center", fromPlace: "reykjavik", toPlace: "blonduos", year: "2026", bend: 0 },
];
