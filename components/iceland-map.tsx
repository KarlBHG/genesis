"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import coast from "@/data/iceland-coast.json";
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
  relationship: string;
  asOf: string;
  quotation: string;
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
  const cos = Math.cos((midLat * Math.PI) / 180);
  const width = 800;
  const pad = 36;
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
  return { d, project, width, height };
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
    <svg aria-hidden viewBox="0 0 48 64" className="h-12 w-9">
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

function careerRank(start: string | null): string {
  if (!start || start === "not printed") return "9999-99-99";
  if (/^\d{4}$/.test(start)) return `${start}-00-00`;
  return start;
}

function printedEnd(value: string | null, side: "start" | "end"): string {
  if (!value || value === "not printed") return `${side} not printed`;
  return value;
}

function careerSpan(edge: MapEdgeView): string {
  return `${printedEnd(edge.start, "start")} – ${printedEnd(edge.end, "end")}`;
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
      const bend = totalSoon === 1 ? 0 : index === 0 ? -14 : 14;
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
  const timeline =
    focus?.person === true
      ? edges
          .filter(
            (edge) =>
              edge.channel != null && (edge.from === focus.slug || edge.to === focus.slug),
          )
          .slice()
          .sort(
            (a, b) =>
              careerRank(a.start).localeCompare(careerRank(b.start)) ||
              a.toTitle.localeCompare(b.toTitle, "en"),
          )
      : [];
  const panelLines = focus?.person === true ? lit.filter((edge) => edge.channel == null) : lit;
  const placeName = PLACES.find((place) => place.id === selectedPlace)?.name;
  const grouped = MAP_LAYERS.map((layer) => ({
    layer,
    entries: placeEntries.filter((entry) => entry.layer === layer.id),
  })).filter((group) => group.entries.length > 0);

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

  function lineStyle(edge: MapEdgeView): React.CSSProperties {
    const active = !selectedSlug || litKeys.has(edgeKey(edge));
    return {
      opacity: active ? 1 : 0.28,
      transition: motionTransition,
    };
  }

  function roamPinList(event: React.KeyboardEvent, slugs: string[]) {
    if (slugs.length === 0 || !selectedPlace) return;
    const idx = selectedSlug ? slugs.indexOf(selectedSlug) : -1;
    if (event.key === "ArrowDown" || event.key === "j") {
      event.preventDefault();
      const next = slugs[(idx + 1) % slugs.length];
      selectSlug(next, selectedPlace);
    } else if (event.key === "ArrowUp" || event.key === "k") {
      event.preventDefault();
      const next = slugs[(idx - 1 + slugs.length) % slugs.length];
      selectSlug(next, selectedPlace);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectSlug(slugs[0], selectedPlace);
    } else if (event.key === "End") {
      event.preventDefault();
      selectSlug(slugs[slugs.length - 1], selectedPlace);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex max-w-reading flex-col gap-2">
        <p className="text-xs tracking-[0.18em] text-(--geo-ink-dim) uppercase">Geographic view</p>
        <h1 className="text-3xl font-medium tracking-tight text-(--geo-ink) sm:text-4xl" style={{ fontFamily: "var(--font-serif), serif" }}>
          Iceland, only where a page names the place.
        </h1>
        <p className="text-sm leading-6 text-(--geo-ink-muted)">
          Pins are real places. Reykjavík is one cluster, not a door for each office. Ownership, investments, authorisations, contracts, careers, invoices, authority, and trade partners are the typed edges already on file. Family is a separate channel, and it is empty. Trade-partner countries are listed, not pinned.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Layers">
        {MAP_LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            aria-pressed={enabled[layer.id]}
            className={`rounded-full border px-3 py-1.5 text-sm ${MAP_CONTROL}`}
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

      <div className="flex flex-wrap gap-2" role="group" aria-label="Views">
        {MAP_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            aria-pressed={viewsOn[view.id]}
            className={`rounded-full border border-(--geo-line) px-3 py-1.5 text-sm ${MAP_CONTROL}`}
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

      <div className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[5.5rem_minmax(0,1fr)_18rem] lg:items-start">
        <div className="flex flex-row flex-wrap gap-2 lg:flex-col" aria-label="Figures">
          {MAP_LAYERS.map((layer) => {
            const selected = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                aria-pressed={selected}
                className={`flex w-[5.25rem] flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center text-[11px] leading-tight ${MAP_CONTROL}`}
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

        <div className="min-w-0 rounded-2xl border border-(--geo-line-strong) bg-(--geo-frame) p-2 shadow-(--geo-glow) sm:p-3">
          <div className="relative min-w-0">
            <svg
              viewBox={`0 0 ${scene.width} ${scene.height}`}
              className="h-auto w-full"
              role="img"
              aria-label="Outline of Iceland with sourced pins"
            >
              <rect width={scene.width} height={scene.height} fill="var(--geo-plate)" rx="12" />
              <path d={scene.d} fill="var(--geo-land)" stroke="var(--geo-ink-muted)" strokeWidth="1.4" />
              {strings.map(({ edge, bend, year }) => {
                const drawn = curve(points[edge.fromPlace!], points[edge.toPlace!], bend);
                const active = !selectedSlug || litKeys.has(edgeKey(edge));
                return (
                  <g key={edgeKey(edge)} style={{ opacity: active ? 1 : 0.22, transition: motionTransition }}>
                    <path
                      d={drawn.d}
                      fill="none"
                      stroke={STROKE[edge.relationship] ?? "var(--geo-accent)"}
                      strokeWidth="1.4"
                    />
                    {year ? (
                      <text
                        x={drawn.labelX}
                        y={drawn.labelY}
                        textAnchor="middle"
                        fill="var(--geo-accent-soft)"
                        fontSize="12"
                        stroke="var(--geo-frame)"
                        strokeWidth="3"
                        paintOrder="stroke"
                      >
                        {year}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              {PLACES.map((place) => {
                const atPlace = visible.filter((entry) => entry.place === place.id);
                if (atPlace.length === 0) return null;
                const point = points[place.id];
                const swatch = LAYERS.find((layer) => layer.id === atPlace[0]?.layer)?.swatch ?? "var(--layer-state)";
                const selected = selectedPlace === place.id;
                const cluster = atPlace.length > 1;
                const involved =
                  !selectedSlug ||
                  atPlace.some((entry) => entry.slug === selectedSlug) ||
                  lit.some(
                    (edge) =>
                      (edge.fromPlace === place.id || edge.toPlace === place.id) &&
                      (edge.from === selectedSlug || edge.to === selectedSlug),
                  );
                return (
                  <g key={place.id} style={{ opacity: involved ? 1 : 0.35, transition: motionTransition }}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={selected ? 9 : cluster ? 8 : 6}
                      fill={swatch}
                      stroke="var(--geo-ink)"
                      strokeWidth={selected ? 2 : 1}
                    />
                    {cluster ? (
                      <text
                        x={point.x}
                        y={point.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--geo-canvas)"
                        fontSize="9"
                        fontWeight="600"
                        pointerEvents="none"
                      >
                        {atPlace.length}
                      </text>
                    ) : null}
                    <text
                      x={point.x + 10}
                      y={point.y - 10}
                      fill="var(--geo-ink)"
                      fontSize="13"
                    >
                      {place.name}
                      {cluster ? ` · ${atPlace.length} entries` : ""}
                    </text>
                  </g>
                );
              })}
            </svg>
            {PLACES.map((place) => {
              const atPlace = visible.filter((entry) => entry.place === place.id);
              if (atPlace.length === 0) return null;
              const point = points[place.id];
              return (
                <button
                  key={place.id}
                  type="button"
                  className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full ${MAP_CONTROL}`}
                  style={{ left: `${(point.x / scene.width) * 100}%`, top: `${(point.y / scene.height) * 100}%` }}
                  aria-label={place.name}
                  onClick={() => selectPlace(place.id)}
                />
              );
            })}
          </div>
          <nav className="mt-3" aria-label="Places on the map">
            <p className="mb-2 text-xs tracking-wide text-(--geo-ink-dim) uppercase">Pins</p>
            <ul className="flex flex-wrap gap-2">
              {PLACES.map((place) => {
                const atPlace = visible.filter((entry) => entry.place === place.id);
                if (atPlace.length === 0) return null;
                const selected = selectedPlace === place.id;
                const cluster = atPlace.length > 1;
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1 text-sm ${MAP_CONTROL}`}
                      style={{
                        borderColor: selected ? "var(--layer-state)" : "var(--geo-line-strong)",
                        color: selected ? "var(--geo-ink)" : "var(--geo-ink-muted)",
                        background: selected ? "var(--geo-chip-active)" : "transparent",
                      }}
                      onClick={() => selectPlace(place.id)}
                    >
                      {place.name}
                      {cluster ? (
                        <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-(--layer-state) px-1 text-[11px] font-medium text-(--geo-canvas)">
                          {atPlace.length}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          {selectedPlace && placeEntries.length > 1 ? (
            <div
              className="mt-3 rounded-xl border border-(--geo-line-strong) bg-(--geo-panel) p-3"
              tabIndex={0}
              role="region"
              aria-label={`${placeName} entries`}
              onKeyDown={(event) =>
                roamPinList(
                  event,
                  placeEntries.map((entry) => entry.slug),
                )
              }
            >
              <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">
                {placeName} · spread list · ↑↓ or j/k
              </p>
              <ul className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
                {placeEntries.map((entry) => {
                  const focused = selectedSlug === entry.slug;
                  return (
                    <li key={entry.slug}>
                      <button
                        type="button"
                        aria-current={focused ? "true" : undefined}
                        className={`flex w-full items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${MAP_CONTROL}`}
                        style={{
                          color: focused ? "var(--geo-ink)" : "var(--geo-ink-muted)",
                          background: focused ? "var(--geo-chip-active)" : "transparent",
                        }}
                        onClick={() => selectSlug(entry.slug, selectedPlace)}
                      >
                        <span className="min-w-0 break-words">
                          {entry.title}
                          {entry.pinOnly ? (
                            <span className="mt-0.5 block text-[10px] font-normal tracking-wide text-(--geo-ink-dim) normal-case">
                              Pin only · no typed edge
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-[10px] tracking-wide text-(--geo-ink-dim) uppercase">
                          {LAYER_LABEL[entry.layer]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="min-w-0 rounded-2xl border border-(--geo-line) bg-(--geo-panel) p-4" aria-live="polite">
          {focus ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">{LAYER_LABEL[focus.layer]}</p>
              {focus.pinOnly ? (
                <p
                  className="w-fit rounded-full border border-(--geo-line-bright) bg-(--geo-chip) px-2.5 py-0.5 text-[11px] tracking-wide text-(--geo-accent-dim) uppercase"
                  title="This pin is geographic only until a sourced typed edge exists."
                >
                  Pin only · no typed edge
                </p>
              ) : null}
              <h2 className="text-xl font-medium text-(--geo-ink)">{focus.title}</h2>
              <p className="text-sm leading-6 text-(--geo-ink-muted)">{focus.fact}</p>
              <a className="text-sm text-(--geo-accent) underline underline-offset-4" href={focus.href}>
                Open the entry
              </a>
              <button
                type="button"
                className={`w-fit text-left text-sm text-(--geo-ink-dim) underline underline-offset-4 ${MAP_CONTROL}`}
                onClick={copyLink}
              >
                {copied ? "Link copied" : "Copy a link to this view"}
              </button>
              {focus.person ? (
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="text-sm font-medium text-(--geo-ink)">Career</h3>
                  {timeline.length === 0 ? (
                    <p className="text-sm leading-6 text-(--geo-ink-dim)">No career lines are on file.</p>
                  ) : (
                    <ol className="flex min-w-0 flex-col gap-3">
                      {timeline.map((edge) => (
                        <li key={edgeKey(edge)} className="min-w-0 text-sm leading-5 break-words text-(--geo-ink-muted)">
                          <span className="block text-xs tracking-wide text-(--geo-accent) uppercase">
                            {edge.channel === "political" ? "Political" : "Business"} · {labelize(edge.relationship)}
                          </span>
                          {edge.from === focus.slug ? placeLabel(edge) : edge.fromTitle}
                          <span className="mt-0.5 block text-(--geo-ink-dim)">{careerSpan(edge)}</span>
                          <span className="mt-0.5 block text-(--geo-ink-dim)" lang={icelandicLang(edge.quotation)}>
                          {edge.quotation}
                        </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : null}
              {panelLines.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {panelLines.map((edge) => (
                    <li key={edgeKey(edge)} className="text-sm leading-5 break-words text-(--geo-ink-muted)">
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
              ) : focus.person ? null : (
                <p className="text-sm leading-6 text-(--geo-ink-dim)">No lines in the views that are on.</p>
              )}
              {focus.flows.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {focus.flows.map((flow) => (
                    <li key={flow.href}>
                      <a className="text-sm text-(--geo-accent) underline underline-offset-4" href={flow.href}>
                        {flow.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {placeEntries.length > 1 ? (
                <button
                  type="button"
                  className="text-left text-sm text-(--geo-ink-dim) underline underline-offset-4"
                  onClick={() => go({ ...query, focus: null })}
                >
                  Back to {placeName}
                </button>
              ) : null}
            </div>
          ) : selectedPlace ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">Place</p>
              <h2 className="text-xl font-medium text-(--geo-ink)">{placeName}</h2>
              {selectedPlace === "reykjavik" ? (
                <p className="text-sm leading-6 text-(--geo-ink-muted)">
                  One pin for the capital. The list is grouped by layer. Offices are not given separate coordinates.
                </p>
              ) : null}
              {grouped.map((group) => (
                <div key={group.layer.id} className="flex flex-col gap-2">
                  <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">{group.layer.label}</p>
                  <ul className="flex flex-col gap-2">
                    {group.entries.map((entry) => (
                      <li key={entry.slug}>
                        <button
                          type="button"
                          className="text-left text-sm text-(--geo-ink) underline underline-offset-4"
                          onClick={() => selectSlug(entry.slug, selectedPlace)}
                        >
                          {entry.title}
                          {entry.pinOnly ? (
                            <span className="mt-0.5 block text-[10px] font-normal text-(--geo-ink-dim) no-underline">
                              Pin only · no typed edge
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
                <ul className="flex flex-col gap-2">
                  {layerEntries.map((entry) => (
                    <li key={entry.slug}>
                        <button
                          type="button"
                          className="text-left text-sm text-(--geo-ink) underline underline-offset-4"
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
            <p className="text-sm leading-6 text-(--geo-ink-muted)">Select a pin or a figure.</p>
          )}
        </aside>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
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
            <section key={view.id} className="min-w-0">
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
                <div className="mt-3 rounded-xl border border-(--geo-line) bg-(--geo-panel) p-3">
                  <p className="text-xs tracking-wide text-(--geo-ink-dim) uppercase">
                    Off-map endpoints · {offMap.length}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-(--geo-ink-dim)">
                    {view.id === "trade"
                      ? "Countries named on trade edges have no Icelandic place on file, so they are listed here instead of pinned in Reykjavík."
                      : "These records appear on typed edges in this view but have no place pin yet, so the lines stay visible in text while geography remains honest."}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {visibleOffMap.map((endpoint) => (
                      <li key={endpoint.slug}>
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
                    <p className="mt-2 text-xs text-(--geo-ink-dim)">
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

      <p className="text-xs leading-5 text-(--geo-ink-dim)">
        Coastline: Natural Earth 1:50m, public domain. Place points: Nominatim names for Reykjavík, Straumsvík, Grundartangi, Reyðarfjörður, Keflavík airport, and Blönduós.
      </p>
    </div>
  );
}
