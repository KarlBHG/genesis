import {
  LAYERS,
  MAP_LAYERS,
  MAP_VIEWS,
  PLACES,
  type LayerId,
  type PlaceId,
  type ViewId,
} from "@/lib/geo-map";

export const DEFAULT_LAYERS: readonly LayerId[] = MAP_LAYERS.map(
  (layer) => layer.id,
);

export const DEFAULT_VIEWS: readonly ViewId[] = [
  "ownership",
  "authority",
  "trade",
];

export const DEFAULT_LAYER: LayerId = "state";

export type MapQuery = {
  layers: LayerId[];
  views: ViewId[];
  layer: LayerId | null;
  place: PlaceId | null;
  focus: string | null;
};

export function defaultQuery(): MapQuery {
  return {
    layers: [...DEFAULT_LAYERS],
    views: [...DEFAULT_VIEWS],
    layer: DEFAULT_LAYER,
    place: null,
    focus: null,
  };
}

const LAYER_IDS = new Set<LayerId>(LAYERS.map((layer) => layer.id));
const VIEW_IDS = new Set<ViewId>(MAP_VIEWS.map((view) => view.id));
const PLACE_IDS = new Set<PlaceId>(PLACES.map((place) => place.id));
/** Older share links used a single “money” view for funds, power, and commodity lines. */
const VIEW_ALIASES: Record<string, ViewId> = { money: "authorisations" };

function listParam(
  raw: string | null,
  valid: Set<string>,
): string[] | null {
  if (raw == null) return null;
  if (raw.trim() === "") return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",").map((item) => item.trim())) {
    const mapped = valid === VIEW_IDS ? VIEW_ALIASES[part] ?? part : part;
    if (!valid.has(mapped) || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  return out;
}

export function parseMapQuery(
  get: (key: string) => string | null,
  slugs: Set<string>,
): MapQuery {
  const layers = listParam(get("layers"), LAYER_IDS);
  const views = listParam(get("views"), VIEW_IDS);
  const layerRaw = get("layer");
  const placeRaw = get("place");
  const focusRaw = get("focus");

  return {
    layers: (layers ?? [...DEFAULT_LAYERS]) as LayerId[],
    views: (views ?? [...DEFAULT_VIEWS]) as ViewId[],
    layer:
      layerRaw == null
        ? DEFAULT_LAYER
        : layerRaw === "none"
          ? null
          : LAYER_IDS.has(layerRaw as LayerId)
            ? (layerRaw as LayerId)
            : DEFAULT_LAYER,
    place:
      placeRaw != null && PLACE_IDS.has(placeRaw as PlaceId)
        ? (placeRaw as PlaceId)
        : null,
    focus:
      focusRaw != null && focusRaw !== "" && slugs.has(focusRaw)
        ? focusRaw
        : null,
  };
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((item) => right.includes(item))
  );
}

export function serializeMapQuery(query: MapQuery): string {
  const params = new URLSearchParams();
  if (!sameSet(query.layers, DEFAULT_LAYERS)) {
    params.set("layers", query.layers.join(","));
  }
  if (!sameSet(query.views, DEFAULT_VIEWS)) {
    params.set("views", query.views.join(","));
  }
  if (query.layer !== DEFAULT_LAYER) {
    params.set("layer", query.layer ?? "none");
  }
  if (query.place) params.set("place", query.place);
  if (query.focus) params.set("focus", query.focus);
  return params.toString();
}
