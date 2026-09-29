"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import { PrintPlateColophon, PrintPlateHead } from "@/components/print-plate";
import { Button } from "@/components/ui/button";
import coast from "@/data/iceland-coast.json";
import { edgeHref } from "@/lib/edge-id";
import { labelize, yearOf } from "@/lib/format";
import { icelandicLang } from "@/lib/lang";
import {
  LAYERS,
  MAP_LAYERS,
  MAP_VIEWS,
  PLACES,
  type LayerId,
  type PlaceId,
  type ViewId,
} from "@/lib/geo-map";
import {
  parseMapQuery,
  serializeMapQuery,
  type MapQuery,
} from "@/lib/map-query";
import type { Relationship } from "@/lib/types";

export type MapFlowLink = {
  title: string;
  href: string;
};

export type MapOffMapEndpointLink = {
  slug: string;
  title: string;
  href: string;
  count: number;
};

export type MapEntryView = {
  slug: string;
  title: string;
  href: string;
  fact: string;
  asOf: string;
  layer: LayerId;
  place: PlaceId;
  person: boolean;
  flows: MapFlowLink[];
  pinOnly: boolean;
};

export type MapEdgeView = {
  from: string;
  to: string;
  fromTitle: string;
  toTitle: string;
  relationship: Relationship;
  asOf: string;
  quotation: string;
  source: string;
  start: string | null;
  end: string | null;
  channel: "political" | "business" | null;
  organizationTitle: string | null;
  note: string | null;
  view: ViewId | null;
  fromPlace: PlaceId | null;
  toPlace: PlaceId | null;
};

const LAYER_LABEL = Object.fromEntries(LAYERS.map((layer) => [layer.id, layer.label])) as Record<
  LayerId,
  string
>;

const MAP_CONTROL = "map-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--geo-accent)";

/** Label offsets keep neighbouring Nominatim pins readable without moving the dots. */
const LABEL_AT: Record<PlaceId, { dx: number; dy: number; anchor: "start" | "end" | "middle" }> = {
  reykjavik: { dx: -16, dy: -18, anchor: "end" },
  straumsvik: { dx: 14, dy: 16, anchor: "start" },
  grundartangi: { dx: 12, dy: -16, anchor: "start" },
  reydarfjordur: { dx: 14, dy: -12, anchor: "start" },
  keflavik: { dx: -16, dy: -8, anchor: "end" },
  reykjanesbaer: { dx: 14, dy: 16, anchor: "start" },
  blonduos: { dx: 4, dy: -16, anchor: "middle" },
  kopavogur: { dx: 16, dy: 6, anchor: "start" },
  hafnarfjordur: { dx: -14, dy: 18, anchor: "end" },
  akureyri: { dx: 12, dy: -16, anchor: "start" },
  gardabaer: { dx: 16, dy: 18, anchor: "start" },
  mosfellsbaer: { dx: 16, dy: -10, anchor: "start" },
  arborg: { dx: 8, dy: 16, anchor: "start" },
  akranes: { dx: -16, dy: -8, anchor: "end" },
  fjardabyggd: { dx: 10, dy: 16, anchor: "start" },
  vestmannaeyjar: { dx: 10, dy: 16, anchor: "start" },
  seltjarnarnes: { dx: -18, dy: 8, anchor: "end" },
  hvanneyri: { dx: 14, dy: -12, anchor: "start" },
  thingvellir: { dx: 14, dy: -12, anchor: "start" },
};

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

const STROKE: Record<string, string> = {
  owns: "var(--layer-companies)",
  "invests-in": "var(--layer-societies)",
  funds: "var(--layer-state)",
  "sells-power-to": "var(--geo-accent)",
  "export-of": "var(--layer-multinationals)",
  "import-line-of": "var(--layer-multinationals)",
};

function projectCoast() {
  const ring = coast.ring;
  const lons = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;
  const cos = Math.cos((midLat * Math.PI) / 180);
  const width = 1000;
  const pad = 52;
  const xSpan = (maxLon - minLon) * cos;
  const ySpan = maxLat - minLat;
  const innerW = width - pad * 2;
  const innerH = innerW * (ySpan / xSpan);
  const height = innerH + pad * 2;
  const project = (lon: number, lat: number) => ({
    x: pad + ((lon - minLon) * cos * innerW) / xSpan,
    y: pad + ((maxLat - lat) * innerH) / ySpan,
  });
  const d = `${ring
    .map((point, index) => {
      const { x, y } = project(point[0], point[1]);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ")} Z`;
  const origin = project(midLon, midLat);
  return { d, project, width, height, minLon, maxLon, minLat, maxLat, origin };
}

function gridLines(scene: ReturnType<typeof projectCoast>) {
  const lines: string[] = [];
  for (let lon = Math.ceil(scene.minLon); lon <= Math.floor(scene.maxLon); lon += 1) {
    const a = scene.project(lon, scene.minLat);
    const b = scene.project(lon, scene.maxLat);
    lines.push(`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  for (let lat = Math.ceil(scene.minLat); lat <= Math.floor(scene.maxLat); lat += 1) {
    const a = scene.project(scene.minLon, lat);
    const b = scene.project(scene.maxLon, lat);
    lines.push(`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  return lines;
}

function nightStars(width: number, height: number, count: number) {
  const stars: { x: number; y: number; r: number }[] = [];
  let seed = 17;
  for (let i = 0; i < count; i += 1) {
    seed = (seed * 16807) % 2147483647;
    const x = ((seed % 10000) / 10000) * width;
    seed = (seed * 16807) % 2147483647;
    const y = ((seed % 10000) / 10000) * height;
    seed = (seed * 16807) % 2147483647;
    const r = 0.35 + ((seed % 100) / 100) * 0.95;
    stars.push({ x, y, r });
  }
  return stars;
}

function curve(
  from: { x: number; y: number },
  to: { x: number; y: number },
  bend: number,
) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const labelX = 0.25 * from.x + 0.5 * cx + 0.25 * to.x;
  const labelY = 0.25 * from.y + 0.5 * cy + 0.25 * to.y;
  return { d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`, labelX, labelY };
}

function layerMix(entries: MapEntryView[]): LayerId[] {
  return MAP_LAYERS.map((layer) => layer.id).filter((id) =>
    entries.some((entry) => entry.layer === id),
  );
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const x0 = cx + r * Math.cos(start);
  const y0 = cy + r * Math.sin(start);
  const x1 = cx + r * Math.cos(end);
  const y1 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function RoleFigure({ layer }: { layer: LayerId }) {
  const mark =
    layer === "state" ? (
      <path d="M16 46h16M20 46V34h8v12M22 38h4" />
    ) : layer === "companies" ? (
      <rect x="18" y="34" width="12" height="12" />
    ) : layer === "multinationals" ? (
      <circle cx="24" cy="40" r="6" />
    ) : layer === "ngos" ? (
      <path d="M18 40h12M24 34v12" />
    ) : layer === "societies" ? (
      <path d="M18 40h4M26 40h4" />
    ) : (
      <path d="M16 40h16" strokeDasharray="3 3" />
    );
  return (
    <svg aria-hidden viewBox="0 0 48 64" className="h-11 w-8">
      <circle cx="24" cy="14" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 30h20l-3 26H17z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        {mark}
      </g>
    </svg>
  );
}

function edgeKey(edge: MapEdgeView): string {
  return [edge.from, edge.relationship, edge.to, edge.asOf, edge.start ?? "", edge.quotation].join("|");
}

function careerHolding(edge: MapEdgeView): boolean {
  return edge.relationship === "invests-in" && edge.channel != null;
}

function placeLabel(edge: MapEdgeView): string {
  if (edge.relationship === "holds-office" && edge.organizationTitle) {
    return `${edge.toTitle} · ${edge.organizationTitle}`;
  }
  return edge.toTitle;
}

function captionAsOf(asOf: string): string {
  const printed = asOf.trim();
  if (!printed) return "undated";
  // The source URL already has its own print slot. Do not put it in as-of.
  if (/https?:\/\//i.test(printed)) return "undated";
  return printed;
}

function PlateCaption({
  focus,
  placeName,
  legend,
  cluster,
  onBack,
}: {
  focus: MapEntryView;
  placeName: string | undefined;
  legend: MapEdgeView[];
  cluster: boolean;
  onBack: () => void;
}) {
  return (
    <div className="geo-caption-body">
      <p className="geo-caption-kicker">{LAYER_LABEL[focus.layer]}</p>
      {focus.pinOnly ? (
        <p
          className="geo-caption-stamp"
          title="This pin is on the drawing because a page names the place. No typed edge is on file."
        >
          On the drawing, no typed line
        </p>
      ) : null}
      <h2 className="geo-caption-title">{focus.title}</h2>
      {placeName ? <p className="geo-caption-place">{placeName}</p> : null}
      <p className="geo-caption-fact">{focus.fact}</p>
      <a className="geo-caption-entry" href={focus.href}>
        Open the entry
      </a>
      {focus.pinOnly ? null : legend.length > 0 ? (
        <ol className="geo-caption-legend" aria-label="Legend">
          {legend.map((edge) => (
            <li key={edgeKey(edge)}>
              <span className="geo-caption-line">
                <span className="geo-caption-meta">
                  {labelize(edge.relationship)} · {captionAsOf(edge.asOf)}
                </span>
                <span className="geo-caption-dot" aria-hidden>
                  ·
                </span>
                <span
                  className="hang-quote geo-caption-quote"
                  lang={icelandicLang(edge.quotation)}
                  title={edge.quotation}
                >
                  {edge.quotation}
                </span>
                <span className="geo-caption-dot" aria-hidden>
                  ·
                </span>
                <a className="geo-caption-permalink" href={edgeHref(edge)}>
                  permalink
                </a>
              </span>
              {edge.source ? (
                <a
                  className="print-only print-literal-url geo-caption-source"
                  href={edge.source}
                >
                  {edge.source}
                </a>
              ) : null}
              {edge.note ? (
                <span className="geo-caption-note">{edge.note}</span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="geo-caption-empty">No lines in the views that are on.</p>
      )}
      {focus.flows.length > 0 ? (
        <ul className="geo-caption-flows">
          {focus.flows.map((flow) => (
            <li key={flow.href}>
              <a className="geo-caption-entry" href={flow.href}>
                {flow.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {cluster ? (
        <button
          type="button"
          className={`geo-caption-back ${MAP_CONTROL}`}
          onClick={onBack}
        >
          Back to {placeName} · still one pin
        </button>
      ) : null}
    </div>
  );
}

export function IcelandMap({
  entries,
  edges,
  offMapByView,
}: {
  entries: MapEntryView[];
  edges: MapEdgeView[];
  offMapByView: Record<ViewId, MapOffMapEndpointLink[]>;
}) {
  const scene = useMemo(() => projectCoast(), []);
  const meridians = useMemo(() => gridLines(scene), [scene]);
  const stars = useMemo(
    () => nightStars(scene.width, scene.height, 86),
    [scene.height, scene.width],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slugSet = useMemo(
    () => new Set(entries.map((entry) => entry.slug)),
    [entries],
  );
  const query = parseMapQuery(
    (key) => searchParams.get(key),
    slugSet,
  );
  const enabled = Object.fromEntries(
    MAP_LAYERS.map((layer) => [layer.id, query.layers.includes(layer.id)]),
  ) as Record<LayerId, boolean>;
  const viewsOn = Object.fromEntries(
    MAP_VIEWS.map((view) => [view.id, query.views.includes(view.id)]),
  ) as Record<ViewId, boolean>;
  const selectedLayer = query.layer;
  const selectedPlace = query.place;
  const selectedSlug = query.focus;
  const [copied, setCopied] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const motionTransition = reduceMotion ? undefined : "opacity 200ms ease";
  const shareQuery = serializeMapQuery(query);
  const sharePath = shareQuery ? `${pathname}?${shareQuery}` : pathname;

  const visible = entries.filter((entry) => enabled[entry.layer]);
  const points = Object.fromEntries(
    PLACES.map((place) => [place.id, scene.project(place.lon, place.lat)]),
  ) as Record<PlaceId, { x: number; y: number }>;

  const shown = edges.filter(
    (edge) =>
      (edge.view != null && viewsOn[edge.view]) ||
      (viewsOn.careers && careerHolding(edge)),
  );
  const lit = selectedSlug
    ? shown.filter((edge) => edge.from === selectedSlug || edge.to === selectedSlug)
    : shown;
  const litKeys = new Set(lit.map(edgeKey));

  const strings = useMemo(() => {
    const geographic = shown.filter(
      (edge) =>
        edge.fromPlace &&
        edge.toPlace &&
        edge.fromPlace !== edge.toPlace &&
        visible.some((entry) => entry.slug === edge.from) &&
        visible.some((entry) => entry.slug === edge.to),
    );
    const counts = new Map<string, number>();
    return geographic.map((edge) => {
      const pair = `${edge.fromPlace}|${edge.toPlace}`;
      const index = counts.get(pair) ?? 0;
      counts.set(pair, index + 1);
      const totalSoon = geographic.filter(
        (item) => item.fromPlace === edge.fromPlace && item.toPlace === edge.toPlace,
      ).length;
      const bend = totalSoon === 1 ? 0 : index === 0 ? -18 : 18;
      const year = yearOf(edge.asOf);
      return { edge, bend, year: year === "Undated" ? "" : year };
    });
  }, [shown, visible]);

  const layerEntries = selectedLayer
    ? entries.filter((entry) => entry.layer === selectedLayer)
    : [];
  const placeEntries = selectedPlace
    ? visible.filter((entry) => entry.place === selectedPlace)
    : [];
  const focus = entries.find((entry) => entry.slug === selectedSlug) ?? null;
  const captionPlaceId = focus?.place ?? selectedPlace;
  const captionPlaceName = captionPlaceId
    ? PLACES.find((place) => place.id === captionPlaceId)?.name
    : undefined;
  const captionPlaceEntries = captionPlaceId
    ? visible.filter((entry) => entry.place === captionPlaceId)
    : [];
  const captionCluster = captionPlaceEntries.length > 1;
  const legend = focus ? lit : [];
  const placeName = PLACES.find((place) => place.id === selectedPlace)?.name;
  const grouped = MAP_LAYERS.map((layer) => ({
    layer,
    entries: placeEntries.filter((entry) => entry.layer === layer.id),
  })).filter((group) => group.entries.length > 0);
  const visiblePlaces = PLACES.filter((place) =>
    visible.some((entry) => entry.place === place.id),
  );

  function go(next: MapQuery) {
    const qs = serializeMapQuery(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(layer: LayerId) {
    go({
      ...query,
      layers: enabled[layer]
        ? query.layers.filter((id) => id !== layer)
        : [...query.layers, layer],
    });
  }

  function toggleView(view: ViewId) {
    go({
      ...query,
      views: viewsOn[view]
        ? query.views.filter((id) => id !== view)
        : [...query.views, view],
    });
  }

  function selectLayer(layer: LayerId) {
    go({
      ...query,
      layers: query.layers.includes(layer)
        ? query.layers
        : [...query.layers, layer],
      layer,
      place: null,
      focus: null,
    });
  }

  function selectPlace(place: PlaceId) {
    const atPlace = entries.filter(
      (entry) => entry.place === place && enabled[entry.layer],
    );
    go({
      ...query,
      place,
      layer: null,
      focus: atPlace.length === 1 ? (atPlace[0]?.slug ?? null) : null,
    });
  }

  function selectSlug(slug: string, place: PlaceId | null) {
    go({ ...query, focus: slug, place });
  }

  function copyLink() {
    const url = window.location.href;
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  }

  function lineStyle(edge: MapEdgeView): CSSProperties {
    const active = !selectedSlug || litKeys.has(edgeKey(edge));
    return {
      opacity: active ? 1 : 0.28,
      transition: motionTransition,
    };
  }

  function roamPinList(event: KeyboardEvent, slugs: string[]) {
    const place = captionPlaceId ?? selectedPlace;
    if (slugs.length === 0 || !place) return;
    const idx = selectedSlug ? slugs.indexOf(selectedSlug) : -1;
    if (event.key === "ArrowDown" || event.key === "j") {
      event.preventDefault();
      const next = slugs[(idx + 1) % slugs.length];
      selectSlug(next, place);
    } else if (event.key === "ArrowUp" || event.key === "k") {
      event.preventDefault();
      const next = slugs[(idx - 1 + slugs.length) % slugs.length];
      selectSlug(next, place);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectSlug(slugs[0], place);
    } else if (event.key === "End") {
      event.preventDefault();
      selectSlug(slugs[slugs.length - 1], place);
    }
  }

  const emptyLayers = visible.length === 0;

  return (
    <div>
      <PrintPlateHead
        asOf={focus?.asOf ?? ""}
        kind="Map"
        pathname="/map"
        slug={focus?.slug ?? "map"}
      />
      <div className="geo-theater">
        <header className="geo-mast">
          <div className="min-w-0">
            <p className="kicker">Geographic view</p>
            <h1>Iceland, only where a page names the place.</h1>
            <p className="geo-lede">
              One pin per named town. Reykjavík is a cluster, not a door for each office. Mixed
              colours on a pin are the layers actually on file there. Trade-partner countries stay
              off the island. The address bar holds this view.
            </p>
            <span className="geo-permalink" title={sharePath}>
              {sharePath}
            </span>
          </div>
          <div className="geo-share">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={MAP_CONTROL}
              onClick={copyLink}
            >
              {copied ? "Link copied" : "Copy this view"}
            </Button>
            <span className="sr-only" aria-live="polite">
              {copied ? "Link copied" : ""}
            </span>
          </div>
        </header>

        <div className="geo-chips">
          <div className="geo-chip-row" role="group" aria-label="Layers">
            {MAP_LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                aria-pressed={enabled[layer.id]}
                className={`rounded-md border px-3 py-1.5 text-sm ${MAP_CONTROL}`}
                style={{
                  borderColor: enabled[layer.id] ? layer.swatch : "var(--geo-line)",
                  color: enabled[layer.id] ? "var(--geo-ink)" : "var(--geo-ink-dim)",
                  background: enabled[layer.id] ? "var(--geo-chip-active)" : "transparent",
                }}
                onClick={() => toggle(layer.id)}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: layer.swatch }}
                />
                {layer.label}
              </button>
            ))}
          </div>
          <div className="geo-chip-row" role="group" aria-label="Views">
            {MAP_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                aria-pressed={viewsOn[view.id]}
                className={`rounded-md border border-(--geo-line) px-3 py-1.5 text-sm ${MAP_CONTROL}`}
                style={{
                  color: viewsOn[view.id] ? "var(--geo-ink)" : "var(--geo-ink-dim)",
                  background: viewsOn[view.id] ? "var(--geo-chip-active)" : "transparent",
                }}
                onClick={() => toggleView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        <div className="geo-rail" aria-label="Figures">
          {MAP_LAYERS.map((layer) => {
            const selected = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                aria-pressed={selected}
                className={`flex w-[5.1rem] flex-col items-center gap-1 rounded-md border px-1 py-2 text-center text-[11px] leading-tight ${MAP_CONTROL}`}
                style={{
                  borderColor: selected ? layer.swatch : "var(--geo-line)",
                  color: selected ? layer.swatch : "var(--geo-ink-dim)",
                  background: "var(--geo-panel-sunken)",
                }}
                onClick={() => selectLayer(layer.id)}
              >
                <RoleFigure layer={layer.id} />
                {layer.label}
              </button>
            );
          })}
        </div>

        <div className="geo-stage">
          <div className="geo-stage-art">
          <svg
            viewBox={`0 0 ${scene.width} ${scene.height}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-auto w-full"
            role="img"
            aria-label="Outline of Iceland with sourced pins. One pin per named place; a number is how many records share that pin."
          >
            <defs>
              <radialGradient id="geo-sea-wash" cx="48%" cy="42%" r="68%">
                <stop offset="0%" stopColor="var(--geo-sea)" />
                <stop offset="70%" stopColor="var(--geo-sea-deep)" />
                <stop offset="100%" stopColor="var(--geo-canvas)" />
              </radialGradient>
              <linearGradient id="geo-land-wash" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="var(--geo-land-lit)" />
                <stop offset="55%" stopColor="var(--geo-land)" />
                <stop offset="100%" stopColor="var(--geo-highland)" />
              </linearGradient>
              <radialGradient id="geo-aurora-wash" cx="50%" cy="18%" r="42%">
                <stop offset="0%" stopColor="var(--geo-aurora)" stopOpacity="0.55" />
                <stop offset="45%" stopColor="var(--geo-aurora-mid)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--geo-canvas)" stopOpacity="0" />
              </radialGradient>
              <filter id="geo-glow-soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id="geo-relief" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.035"
                  numOctaves="3"
                  result="noise"
                />
                <feColorMatrix
                  in="noise"
                  type="matrix"
                  values="0 0 0 0 0.12  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.55 0"
                />
              </filter>
              <clipPath id="geo-land-clip">
                <path d={scene.d} />
              </clipPath>
            </defs>
            <rect width={scene.width} height={scene.height} fill="url(#geo-sea-wash)" />
            <g className="geo-print-ornament">
              {stars.map((star) => (
                <circle
                  key={`${star.x}-${star.y}`}
                  cx={star.x}
                  cy={star.y}
                  r={star.r}
                  fill="var(--geo-star)"
                  opacity="0.28"
                />
              ))}
              <ellipse
                className="geo-aurora-band"
                cx={scene.origin.x}
                cy={scene.origin.y - 70}
                rx={scene.width * 0.42}
                ry={70}
                fill="url(#geo-aurora-wash)"
              />
              <g opacity="0.12" stroke="var(--geo-grid)" strokeWidth="0.4" fill="none">
                {meridians.map((line) => (
                  <path key={line} d={line} />
                ))}
              </g>
              <path
                d={scene.d}
                fill="none"
                stroke="var(--geo-coast)"
                strokeWidth="14"
                opacity="0.22"
                filter="url(#geo-glow-soft)"
              />
              <path d={scene.d} fill="url(#geo-land-wash)" stroke="none" />
              <rect
                width={scene.width}
                height={scene.height}
                clipPath="url(#geo-land-clip)"
                filter="url(#geo-relief)"
                opacity="0.28"
              />
            </g>
            <path
              d={scene.d}
              fill="none"
              stroke="var(--geo-coast)"
              strokeWidth="1.7"
            />
            <g className="geo-print-ornament">
            {strings.map(({ edge, bend, year }) => {
              const drawn = curve(points[edge.fromPlace!], points[edge.toPlace!], bend);
              const active = !selectedSlug || litKeys.has(edgeKey(edge));
              return (
                <g key={edgeKey(edge)} style={{ opacity: active ? 1 : 0.18, transition: motionTransition }}>
                  <path
                    d={drawn.d}
                    fill="none"
                    stroke={STROKE[edge.relationship] ?? "var(--geo-accent)"}
                    strokeWidth="4.5"
                    opacity="0.18"
                  />
                  <path
                    d={drawn.d}
                    fill="none"
                    stroke={STROKE[edge.relationship] ?? "var(--geo-accent)"}
                    strokeWidth="1.35"
                  />
                  {year ? (
                    <text
                      x={drawn.labelX}
                      y={drawn.labelY}
                      textAnchor="middle"
                      fill="var(--geo-accent-soft)"
                      fontSize="11"
                      stroke="var(--geo-sea-deep)"
                      strokeWidth="3"
                      paintOrder="stroke"
                    >
                      {year}
                    </text>
                  ) : null}
                </g>
              );
            })}
            </g>
            {PLACES.map((place) => {
              const atPlace = visible.filter((entry) => entry.place === place.id);
              if (atPlace.length === 0) return null;
              const point = points[place.id];
              const mix = layerMix(atPlace);
              const cluster = atPlace.length > 1;
              const selected = selectedPlace === place.id;
              const involved =
                !selectedSlug ||
                atPlace.some((entry) => entry.slug === selectedSlug) ||
                lit.some(
                  (edge) =>
                    (edge.fromPlace === place.id || edge.toPlace === place.id) &&
                    (edge.from === selectedSlug || edge.to === selectedSlug),
                );
              // Selected or cluster vs a singleton — never typed-edge degree.
              const radius = selected ? 10 : cluster ? 8 : 5.5;
              const label = LABEL_AT[place.id];
              const gap = (2 * Math.PI) / Math.max(mix.length, 1);
              return (
                <g
                  key={place.id}
                  data-print-pin={selected ? "selected" : "rest"}
                  style={{ opacity: involved ? 1 : 0.32, transition: motionTransition }}
                >
                  {selected && !reduceMotion ? (
                    <circle
                      className="geo-pulse-ring"
                      cx={point.x}
                      cy={point.y}
                      r={radius + 3}
                      fill="none"
                      stroke="var(--geo-accent)"
                      strokeWidth="1.2"
                    />
                  ) : null}
                  {Math.hypot(label.dx, label.dy) > 14 ? (
                    <path
                      d={`M ${point.x} ${point.y} L ${point.x + label.dx * 0.55} ${point.y + label.dy * 0.55}`}
                      fill="none"
                      stroke="var(--geo-line-bright)"
                      strokeWidth="0.7"
                      opacity="0.7"
                    />
                  ) : null}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={radius}
                    fill={mix.length > 1 ? "var(--geo-chip)" : (LAYERS.find((layer) => layer.id === mix[0])?.swatch ?? "var(--layer-state)")}
                    stroke="var(--geo-ink)"
                    strokeWidth={selected ? 1.8 : 0.9}
                  />
                  {mix.length > 1
                    ? mix.map((layerId, index) => {
                        const start = -Math.PI / 2 + index * gap + 0.08;
                        const end = -Math.PI / 2 + (index + 1) * gap - 0.08;
                        return (
                          <path
                            key={layerId}
                            d={arcPath(point.x, point.y, radius + 3.2, start, end)}
                            fill="none"
                            stroke={LAYERS.find((layer) => layer.id === layerId)?.swatch}
                            strokeWidth="2.8"
                            strokeLinecap="butt"
                          />
                        );
                      })
                    : null}
                  {cluster ? (
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={mix.length > 1 ? "var(--geo-ink)" : "var(--geo-canvas)"}
                      fontSize="9"
                      fontWeight="600"
                      pointerEvents="none"
                    >
                      {atPlace.length}
                    </text>
                  ) : null}
                  <text
                    x={point.x + label.dx}
                    y={point.y + label.dy}
                    textAnchor={label.anchor}
                    fill="var(--geo-ink)"
                    fontSize="12"
                    paintOrder="stroke"
                    stroke="var(--geo-sea-deep)"
                    strokeWidth="3.5"
                  >
                    {place.name}
                  </text>
                </g>
              );
            })}
          </svg>
          {PLACES.map((place) => {
            const atPlace = visible.filter((entry) => entry.place === place.id);
            if (atPlace.length === 0) return null;
            const point = points[place.id];
            const cluster = atPlace.length > 1;
            return (
              <button
                key={place.id}
                type="button"
                className={`geo-pin-hit absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${MAP_CONTROL} ${cluster ? "h-11 w-11" : "h-8 w-8"}`}
                data-geo-anchor={
                  focus && place.id === focus.place ? "focus" : undefined
                }
                style={{
                  left: `${(point.x / scene.width) * 100}%`,
                  top: `${(point.y / scene.height) * 100}%`,
                  zIndex: atPlace.length,
                }}
                aria-label={
                  cluster
                    ? `${place.name}, ${atPlace.length} records on one pin`
                    : place.name
                }
                aria-current={
                  focus && place.id === focus.place ? "true" : undefined
                }
                onClick={() => selectPlace(place.id)}
              />
            );
          })}
          </div>
        </div>

        <nav className="geo-pins" aria-label="Places on the map">
          <p className="mb-2 text-xs tracking-wide text-(--geo-ink-dim) uppercase">
            Pins · one per named place
          </p>
          {emptyLayers ? (
            <p className="text-sm leading-6 text-(--geo-ink-dim)">
              Every layer is off. The coast is still Iceland; the pins wait.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {visiblePlaces.map((place) => {
                const atPlace = visible.filter((entry) => entry.place === place.id);
                const selected = selectedPlace === place.id;
                const cluster = atPlace.length > 1;
                const mix = layerMix(atPlace);
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-md border px-3 py-1 text-sm ${MAP_CONTROL}`}
                      style={{
                        borderColor: selected ? "var(--geo-accent)" : "var(--geo-line-strong)",
                        color: selected ? "var(--geo-ink)" : "var(--geo-ink-muted)",
                        background: selected ? "var(--geo-chip-active)" : "transparent",
                      }}
                      onClick={() => selectPlace(place.id)}
                    >
                      <span className="mr-1.5 inline-flex items-center gap-0.5" aria-hidden>
                        {mix.map((layerId) => (
                          <span
                            key={layerId}
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{
                              background: LAYERS.find((layer) => layer.id === layerId)?.swatch,
                            }}
                          />
                        ))}
                      </span>
                      {place.name}
                      {cluster ? (
                        <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-(--geo-chip-active) px-1 text-[11px] font-medium text-(--geo-ink)">
                          {atPlace.length}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {focus ? <div className="geo-leader" aria-hidden /> : null}

        <aside
          className={focus ? "geo-inspector geo-caption" : "geo-inspector"}
          aria-live="polite"
          role={focus || placeEntries.length > 1 ? "region" : undefined}
          aria-label={
            focus
              ? "Plate caption"
              : placeEntries.length > 1
                ? `${placeName} entries`
                : undefined
          }
          tabIndex={captionCluster ? 0 : undefined}
          onKeyDown={
            captionCluster
              ? (event) =>
                  roamPinList(
                    event,
                    captionPlaceEntries.map((entry) => entry.slug),
                  )
              : undefined
          }
        >
          {focus ? (
            <PlateCaption
              focus={focus}
              placeName={captionPlaceName}
              legend={legend}
              cluster={captionCluster}
              onBack={() =>
                go({
                  ...query,
                  focus: null,
                  place: focus.place,
                })
              }
            />
          ) : selectedPlace ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">
                Place · {placeEntries.length > 1 ? `${placeEntries.length} on one pin` : "one record"}
              </p>
              <h2 className="text-xl font-medium text-(--geo-ink)">{placeName}</h2>
              {placeEntries.length > 1 ? (
                <p className="text-sm leading-6 text-(--geo-ink-muted)">
                  {selectedPlace === "reykjavik"
                    ? "One pin for the capital. The list is grouped by layer. Offices are not given separate coordinates. ↑↓ or j/k walks the cluster."
                    : "Several records share this Nominatim point. The count is how many pages name this place, not a score. ↑↓ or j/k walks the cluster."}
                </p>
              ) : null}
              {grouped.map((group) => (
                <div key={group.layer.id} className="flex flex-col gap-2">
                  <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">{group.layer.label}</p>
                  <ul className="geo-scroll">
                    {group.entries.map((entry) => (
                      <li key={entry.slug}>
                        <button
                          type="button"
                          aria-current={selectedSlug === entry.slug ? "true" : undefined}
                          className={`w-full text-left text-sm text-(--geo-ink) underline underline-offset-4 ${MAP_CONTROL}`}
                          onClick={() => selectSlug(entry.slug, selectedPlace)}
                        >
                          {entry.title}
                          {entry.pinOnly ? (
                            <span className="mt-0.5 block text-[10px] font-normal text-(--geo-ink-dim) no-underline">
                              On the drawing, no typed line
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : selectedLayer ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">Layer</p>
              <h2 className="text-xl font-medium text-(--geo-ink)">{LAYER_LABEL[selectedLayer]}</h2>
              {layerEntries.length === 0 ? (
                <p className="text-sm leading-6 text-(--geo-ink-muted)">Nothing sourced on this layer yet.</p>
              ) : (
                <ul className="geo-scroll">
                  {layerEntries.map((entry) => (
                    <li key={entry.slug}>
                        <button
                          type="button"
                          className={`text-left text-sm text-(--geo-ink) underline underline-offset-4 ${MAP_CONTROL}`}
                          onClick={() => selectSlug(entry.slug, entry.place)}
                        >
                        {entry.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-(--geo-ink-muted)">
              Touch a named place. The island stays dark where a page has not named it.
            </p>
          )}
        </aside>
      </div>

      <div className="geo-folio">
        {MAP_VIEWS.map((view) => {
          if (!viewsOn[view.id]) return null;
          const lines =
            view.id === "careers"
              ? shown.filter((edge) => edge.view === "careers" || careerHolding(edge))
              : shown.filter((edge) => edge.view === view.id);
          const offMap = offMapByView[view.id] ?? [];
          const visibleOffMap = offMap.slice(0, 12);
          const hiddenOffMapCount = offMap.length - visibleOffMap.length;
          return (
            <section key={view.id} className="geo-folio-panel">
              <h2 className="text-sm font-medium text-(--geo-ink)">
                {view.label} · {lines.length}
              </h2>
              {lines.length === 0 ? (
                <p className="mt-1 text-sm text-(--geo-ink-dim)">No lines in this view.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {lines.map((edge) => (
                    <li key={edgeKey(edge)} className="min-w-0 text-sm leading-5 break-words text-(--geo-ink-muted)" style={lineStyle(edge)}>
                      {edge.fromTitle} {labelize(edge.relationship).toLowerCase()} {placeLabel(edge)}
                      {yearOf(edge.asOf) === "Undated" ? "" : ` · ${yearOf(edge.asOf)}`}
                      {edge.view === "careers" || edge.view === "spending" || careerHolding(edge) ? (
                        <span className="mt-0.5 block text-(--geo-ink-dim)" lang={icelandicLang(edge.quotation)}>
                          {edge.quotation}
                        </span>
                      ) : null}
                      {edge.note ? <span className="mt-0.5 block text-(--geo-ink-dim)">{edge.note}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
              {offMap.length > 0 ? (
                <div className="mt-3 rounded-md border border-(--geo-line) bg-(--geo-panel-sunken) p-3">
                  <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase print:hidden">
                    Off-map endpoints · {offMap.length}
                  </p>
                  <p className="print-only print-off-plate-kicker">Not on this plate</p>
                  <p className="mt-1 text-sm leading-6 text-(--geo-ink-dim) print:hidden">
                    {view.id === "trade"
                      ? "Countries named on trade edges have no Icelandic place on file, so they are listed here instead of pinned in Reykjavík."
                      : "These records appear on typed edges in this view but have no place pin yet, so the lines stay visible in text while geography remains honest."}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1" data-print-off-plate="">
                    {offMap.map((endpoint, index) => (
                      <li
                        key={endpoint.slug}
                        className={index >= 12 ? "print-only" : undefined}
                      >
                        <a
                          className="text-sm text-(--geo-accent) underline underline-offset-4"
                          href={endpoint.href}
                        >
                          {endpoint.title}
                        </a>
                        <span className="ml-2 text-xs text-(--geo-ink-dim)">
                          {endpoint.count} line{endpoint.count === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {hiddenOffMapCount > 0 ? (
                    <p className="mt-2 text-xs text-(--geo-ink-dim) print:hidden">
                      + {hiddenOffMapCount} more off-map endpoint
                      {hiddenOffMapCount === 1 ? "" : "s"} in this view.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <p className="geo-credit">
        Coastline: Natural Earth 1:50m, public domain. Place points: Nominatim names for the
        pinned towns. A number on a pin is how many catalog pages share that point, not a total
        and not a score.
      </p>
      <PrintPlateColophon />
    </div>
  );
}
