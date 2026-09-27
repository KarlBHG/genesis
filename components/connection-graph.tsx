import { resolveSlug } from "@/lib/content";
import { labelize, yearOf } from "@/lib/format";
import type { Edge } from "@/lib/types";

export type StripId = "budget" | "power" | "ownership";

export function edgeKey(edge: Edge): string {
  return [edge.from, edge.relationship, edge.to, edge.asOf, edge.start ?? "", edge.quotation].join("|");
}

function figureOnLine(note: string): string | null {
  const hits = [...note.matchAll(/(\d[\d.,]*)\s*(m\.kr\.|billion ISK)/gi)];
  if (hits.length !== 1) return null;
  const hit = hits[0];
  if (!hit) return null;
  return `${hit[1]} ${hit[2]}`;
}

function lineLabel(edge: Edge): string {
  const year = yearOf(edge.asOf);
  const parts = [labelize(edge.relationship)];
  if (year !== "Undated") parts.push(year);
  const figure = figureOnLine(edge.quotation);
  if (figure) parts.push(figure);
  return parts.join(" · ");
}

export function stripOf(edge: Edge): StripId | "other" {
  if (edge.relationship === "funds") return "budget";
  if (edge.relationship === "sells-power-to") return "power";
  if (
    edge.from === "ministry-of-finance" &&
    edge.to === "landsvirkjun" &&
    edge.relationship === "appoints"
  ) {
    return "power";
  }
  if (edge.from === "landsvirkjun" && edge.to === "hordur-arnarson") return "power";
  if (edge.from === "aluminium-exports-2024" && edge.to === "power-and-aluminium") {
    return "power";
  }
  if (edge.relationship === "invests-in" || edge.relationship === "owns") return "ownership";
  if (edge.from === "financial-supervisory-authority" && edge.relationship === "regulates") {
    return "ownership";
  }
  if (edge.from === "sedlabanki" && edge.to === "arion-banki") return "ownership";
  return "other";
}

const OWNERSHIP_RANK = [
  "financial-supervisory-authority",
  "bru",
  "birta",
  "lsr",
  "stapi",
  "arion-banki",
  "islandsbanki",
  "sedlabanki",
  "ministry-of-finance",
  "reykjavikurborg",
];

function sortEdges(edges: Edge[], strip: StripId | "other"): Edge[] {
  return edges.slice().sort((a, b) => {
    if (strip === "budget") {
      const aHealth = a.asOf.startsWith("2024") ? 0 : 1;
      const bHealth = b.asOf.startsWith("2024") ? 0 : 1;
      if (aHealth !== bHealth) return aHealth - bHealth;
    }
    if (strip === "ownership") {
      const aRank = OWNERSHIP_RANK.indexOf(a.from);
      const bRank = OWNERSHIP_RANK.indexOf(b.from);
      const aOrder = aRank === -1 ? OWNERSHIP_RANK.length : aRank;
      const bOrder = bRank === -1 ? OWNERSHIP_RANK.length : bRank;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    const from = a.fromTitle.localeCompare(b.fromTitle, "en");
    if (from !== 0) return from;
    const to = a.toTitle.localeCompare(b.toTitle, "en");
    if (to !== 0) return to;
    return a.asOf.localeCompare(b.asOf);
  });
}

function EdgeRow({ edge }: { edge: Edge }) {
  const from = resolveSlug(edge.from);
  const to = resolveSlug(edge.to);
  return (
    <li
      className="grid grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-baseline sm:gap-3"
      key={edgeKey(edge)}
    >
      {from ? (
        <a className="font-medium break-words underline underline-offset-4" href={from.href}>
          {from.title}
        </a>
      ) : (
        <span className="font-medium break-words">{edge.fromTitle}</span>
      )}
      <span className="text-sm text-muted-foreground">{lineLabel(edge)}</span>
      {to ? (
        <a
          className="font-medium break-words underline underline-offset-4 sm:text-right"
          href={to.href}
        >
          {to.title}
        </a>
      ) : (
        <span className="font-medium break-words sm:text-right">{edge.toTitle}</span>
      )}
    </li>
  );
}

const STRIP_COPY: Record<StripId, { title: string; text: string }> = {
  budget: {
    title: "Budget",
    text: "Alþingi funds the 2026 budget, and that budget funds the ministries. Lines dated 2024 are the earlier health release, not the 2026 law.",
  },
  power: {
    title: "Power",
    text: "The Minister of Finance appoints Landsvirkjun’s board. Landsvirkjun sells power onward. The two Norðurál lines are the 2024 supply sentence and the 2026 contract. Aluminium exports are a separate arrow into the sector page.",
  },
  ownership: {
    title: "Ownership",
    text: "Fjármálaeftirlitið supervises the pension funds. Those funds, and two banks, hold the shares listed here. The finance ministry’s lines to Landsbankinn, Isavia, Landsnet, and Landsvirkjun are on their own row.",
  },
};

const DRAWING_LABEL: Record<StripId, string> = {
  budget:
    "Budget drawing. Alþingi is on the left and the 2026 budget is in the middle, with ministries down the right. The 2024 health lines are a separate row.",
  power:
    "Power drawing. The finance ministry appoints Landsvirkjun, which sells power to the smelters and Borealis. Two lines reach Norðurál. Aluminium exports are a separate arrow.",
  ownership:
    "Ownership drawing. Fjármálaeftirlitið is above four pension funds. Fund arrows go to Arion banki, Íslandsbanki, Hagar, and Sýn. The finance ministry’s lines are a separate row.",
};

const BOX_W = 200;
const GAP_X = 158;
const GAP_Y = 16;
const PAD = 20;
const CHAR_PX = 7.2;

type Box = {
  id: string;
  slug: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type DrawnArrow = {
  key: string;
  d: string;
  lines: string[];
  labelX: number;
  labelY: number;
  anchor: "start" | "middle" | "end";
  extent: number;
};

type Band = { x: number; y: number; w: number; h: number };

type Scene = {
  boxes: Box[];
  arrows: DrawnArrow[];
  bands: Band[];
  width: number;
  height: number;
};

function wrapLines(title: string, width: number): string[] {
  const maxChars = Math.max(8, Math.floor((width - 20) / CHAR_PX));
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  const push = (word: string) => {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      let rest = word;
      while (rest.length > maxChars) {
        lines.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      current = rest;
      return;
    }
    if (!current) current = word;
    else if (`${current} ${word}`.length <= maxChars) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  };
  for (const word of words) push(word);
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [title];
}

function boxHeight(title: string, width: number, slots = 1): number {
  const lines = wrapLines(title, width).length;
  return Math.max(52, lines * 17 + 20, slots * 22 + 24);
}

function labelLines(edge: Edge): string[] {
  const year = yearOf(edge.asOf);
  const head = year === "Undated" ? labelize(edge.relationship) : `${labelize(edge.relationship)} · ${year}`;
  const figure = figureOnLine(edge.quotation);
  return figure ? [head, figure] : [head];
}

function placeStack(
  items: { id: string; slug: string; title: string; slots?: number }[],
  x: number,
  y: number,
  width = BOX_W,
): Box[] {
  const boxes: Box[] = [];
  let cursor = y;
  for (const item of items) {
    const h = boxHeight(item.title, width, item.slots ?? 1);
    boxes.push({ id: item.id, slug: item.slug, title: item.title, x, y: cursor, w: width, h });
    cursor += h + GAP_Y;
  }
  return boxes;
}

function centerBox(
  id: string,
  slug: string,
  title: string,
  x: number,
  spanTop: number,
  spanBottom: number,
  width = BOX_W,
): Box {
  const h = boxHeight(title, width);
  const mid = (spanTop + spanBottom) / 2;
  return { id, slug, title, x, y: mid - h / 2, w: width, h };
}

function hArrow(from: Box, to: Box, edge: Edge, y1 = from.y + from.h / 2, y2 = to.y + to.h / 2): DrawnArrow {
  const x1 = from.x + from.w;
  const x2 = to.x;
  const c = (x1 + x2) / 2;
  const lines = labelLines(edge);
  const labelY = y2 - ((lines.length - 1) * 14) / 2;
  return {
    key: edgeKey(edge),
    d: `M ${x1} ${y1} C ${c} ${y1}, ${c} ${y2}, ${x2} ${y2}`,
    lines,
    labelX: x2 - 8,
    labelY,
    anchor: "end",
    extent: Math.max(y1, y2, labelY + (lines.length - 1) * 14),
  };
}

function finish(boxes: Box[], arrows: DrawnArrow[], bands: Band[] = []): Scene {
  const labelRight = arrows.map((arrow) => {
    const width = Math.max(...arrow.lines.map((line) => line.length), 0) * 6.8;
    if (arrow.anchor === "start") return arrow.labelX + width;
    if (arrow.anchor === "middle") return arrow.labelX + width / 2;
    return arrow.labelX;
  });
  const right = Math.max(PAD, ...boxes.map((box) => box.x + box.w), ...labelRight);
  const bottom = Math.max(PAD, ...boxes.map((box) => box.y + box.h), ...arrows.map((arrow) => arrow.extent));
  const width = right + PAD;
  const height = bottom + PAD;
  return {
    boxes,
    arrows,
    bands: bands.map((band) => ({ ...band, w: Math.max(0, width - band.x - 8) })),
    width,
    height,
  };
}

function layoutBudget(edges: Edge[]): Scene {
  const health = edges
    .filter((edge) => edge.from === "althingi" && edge.asOf.startsWith("2024"))
    .sort((a, b) => a.toTitle.localeCompare(b.toTitle, "en"));
  const toBudget = edges.find((edge) => edge.from === "althingi" && edge.to === "treasury-budget-2026");
  const ministries = edges
    .filter((edge) => edge.from === "treasury-budget-2026")
    .sort((a, b) => a.toTitle.localeCompare(b.toTitle, "en"));
  const leftX = PAD;
  const midX = PAD + BOX_W + GAP_X;
  const rightX = midX + BOX_W + GAP_X;
  const boxes: Box[] = [];
  const arrows: DrawnArrow[] = [];
  const bands: Band[] = [];
  let cursor = PAD;

  if (health.length > 0) {
    const targets = placeStack(
      health.map((edge) => ({ id: `health-${edge.to}`, slug: edge.to, title: edge.toTitle })),
      rightX,
      cursor,
    );
    const spanTop = targets[0]?.y ?? cursor;
    const spanBottom = targets.length > 0 ? targets[targets.length - 1].y + targets[targets.length - 1].h : cursor;
    const althingi = centerBox("althingi-2024", "althingi", health[0]?.fromTitle ?? "Alþingi", leftX, spanTop, spanBottom);
    boxes.push(althingi, ...targets);
    for (const edge of health) {
      const target = targets.find((box) => box.slug === edge.to);
      if (target) arrows.push(hArrow(althingi, target, edge));
    }
    bands.push({ x: 8, y: spanTop - 10, w: 0, h: spanBottom - spanTop + 20 });
    cursor = spanBottom + 40;
  }

  if (toBudget && ministries.length > 0) {
    const targets = placeStack(
      ministries.map((edge) => ({ id: `min-${edge.to}`, slug: edge.to, title: edge.toTitle })),
      rightX,
      cursor,
    );
    const spanTop = targets[0].y;
    const spanBottom = targets[targets.length - 1].y + targets[targets.length - 1].h;
    const budget = centerBox("budget-2026", toBudget.to, toBudget.toTitle, midX, spanTop, spanBottom);
    const althingi = centerBox("althingi-2026", "althingi", toBudget.fromTitle, leftX, budget.y, budget.y + budget.h);
    boxes.push(althingi, budget, ...targets);
    arrows.push(hArrow(althingi, budget, toBudget));
    for (const edge of ministries) {
      const target = targets.find((box) => box.slug === edge.to);
      if (target) arrows.push(hArrow(budget, target, edge));
    }
  }

  return finish(boxes, arrows, bands);
}

function layoutPower(edges: Edge[]): Scene {
  const appoints = edges.find(
    (edge) => edge.from === "ministry-of-finance" && edge.to === "landsvirkjun" && edge.relationship === "appoints",
  );
  const ceo = edges.find((edge) => edge.from === "landsvirkjun" && edge.to === "hordur-arnarson");
  const aluminium = edges.find((edge) => edge.from === "aluminium-exports-2024" && edge.to === "power-and-aluminium");
  const order = ["nordural", "isal", "alcoa-fjardaal", "borealis-data-center"];
  const sales = edges
    .filter((edge) => edge.relationship === "sells-power-to" && edge.from === "landsvirkjun")
    .sort((a, b) => {
      const ai = order.indexOf(a.to);
      const bi = order.indexOf(b.to);
      const delta = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      if (delta !== 0) return delta;
      return a.asOf.localeCompare(b.asOf);
    });
  const groups: Edge[][] = [];
  for (const edge of sales) {
    const last = groups[groups.length - 1];
    if (last && last[0]?.to === edge.to) last.push(edge);
    else groups.push([edge]);
  }

  const leftX = PAD;
  const midX = PAD + BOX_W + GAP_X;
  const rightX = midX + BOX_W + GAP_X;
  const customers = placeStack(
    groups.map((group) => ({
      id: group[0]?.to ?? "customer",
      slug: group[0]?.to ?? "customer",
      title: group[0]?.toTitle ?? "",
      slots: group.length,
    })),
    rightX,
    PAD,
  );
  const boxes: Box[] = [...customers];
  const arrows: DrawnArrow[] = [];
  const spanTop = customers[0]?.y ?? PAD;
  const spanBottom = customers.length > 0 ? customers[customers.length - 1].y + customers[customers.length - 1].h : PAD + 52;
  const landsvirkjunTitle = sales[0]?.fromTitle ?? appoints?.toTitle ?? "Landsvirkjun";
  const landsvirkjun = centerBox("landsvirkjun", "landsvirkjun", landsvirkjunTitle, midX, spanTop, spanBottom);
  boxes.push(landsvirkjun);

  if (appoints) {
    const finance = centerBox(
      "finance-power",
      "ministry-of-finance",
      appoints.fromTitle,
      leftX,
      landsvirkjun.y,
      landsvirkjun.y + landsvirkjun.h,
    );
    boxes.push(finance);
    arrows.push(hArrow(finance, landsvirkjun, appoints));
  }

  for (const group of groups) {
    const target = customers.find((box) => box.slug === group[0]?.to);
    if (!target) continue;
    group.forEach((edge, index) => {
      const y2 = slotY(target, index, group.length);
      arrows.push(hArrow(landsvirkjun, target, edge, landsvirkjun.y + landsvirkjun.h / 2, y2));
    });
  }

  let bottom = Math.max(spanBottom, landsvirkjun.y + landsvirkjun.h);
  if (ceo) {
    const h = boxHeight(ceo.toTitle, BOX_W);
    const ceoBox: Box = {
      id: "hordur",
      slug: ceo.to,
      title: ceo.toTitle,
      x: midX,
      y: landsvirkjun.y + landsvirkjun.h + 36,
      w: BOX_W,
      h,
    };
    boxes.push(ceoBox);
    const x = landsvirkjun.x + landsvirkjun.w / 2;
    const y1 = landsvirkjun.y + landsvirkjun.h;
    const y2 = ceoBox.y;
    const lines = labelLines(ceo);
    arrows.push({
      key: edgeKey(ceo),
      d: `M ${x} ${y1} L ${x} ${y2}`,
      lines,
      labelX: x + 8,
      labelY: (y1 + y2) / 2,
      anchor: "start",
      extent: ceoBox.y + ceoBox.h,
    });
    bottom = Math.max(bottom, ceoBox.y + ceoBox.h);
  }

  if (aluminium) {
    const y = bottom + 36;
    const fromH = boxHeight(aluminium.fromTitle, BOX_W);
    const toH = boxHeight(aluminium.toTitle, BOX_W);
    const from: Box = { id: "aluminium", slug: aluminium.from, title: aluminium.fromTitle, x: leftX, y, w: BOX_W, h: fromH };
    const to: Box = { id: "power-sector", slug: aluminium.to, title: aluminium.toTitle, x: midX, y, w: BOX_W, h: toH };
    boxes.push(from, to);
    arrows.push(hArrow(from, to, aluminium));
  }

  return finish(boxes, arrows);
}

function slotY(box: Box, index: number, count: number): number {
  if (count <= 1) return box.y + box.h / 2;
  const inset = 14;
  return box.y + inset + ((box.h - inset * 2) * index) / (count - 1);
}

const FUND_SLUGS = ["bru", "birta", "lsr", "stapi"] as const;
const TARGET_SLUGS = ["arion-banki", "islandsbanki", "hagar", "syn"] as const;

function titleFor(edges: Edge[], slug: string): string {
  const edge = edges.find((item) => item.from === slug || item.to === slug);
  if (!edge) return slug;
  return edge.from === slug ? edge.fromTitle : edge.toTitle;
}

function layoutOwnership(allEdges: Edge[]): Scene {
  const edges = allEdges.filter((edge) => stripOf(edge) === "ownership");
  const used = new Set<string>();
  const mark = (edge: Edge) => used.add(edgeKey(edge));
  const colW = 200;
  const colGap = 12;
  const origin = PAD;
  const colX = (index: number) => origin + index * (colW + colGap);
  const fundsWidth = FUND_SLUGS.length * colW + (FUND_SLUGS.length - 1) * colGap;

  const fsaEdges = edges.filter((edge) => edge.from === "financial-supervisory-authority");
  const fundInvests = edges.filter(
    (edge) => edge.relationship === "invests-in" && FUND_SLUGS.includes(edge.from as (typeof FUND_SLUGS)[number]),
  );
  const bankInvests = edges.filter(
    (edge) => edge.relationship === "invests-in" && !FUND_SLUGS.includes(edge.from as (typeof FUND_SLUGS)[number]),
  );
  const sedla = edges.find((edge) => edge.from === "sedlabanki" && edge.to === "arion-banki");
  const reykjavik = edges.filter((edge) => edge.from === "reykjavikurborg" && edge.relationship === "owns");
  const financeOwns = edges.filter((edge) => edge.from === "ministry-of-finance" && edge.relationship === "owns");
  const appointsLv = allEdges.find(
    (edge) => edge.from === "ministry-of-finance" && edge.to === "landsvirkjun" && edge.relationship === "appoints",
  );

  const fsaTitle = fsaEdges[0]?.fromTitle ?? titleFor(allEdges, "financial-supervisory-authority");
  const fsaW = Math.min(320, fundsWidth);
  const fsaH = boxHeight(fsaTitle, fsaW);
  const fsa: Box = {
    id: "fsa",
    slug: "financial-supervisory-authority",
    title: fsaTitle,
    x: origin + (fundsWidth - fsaW) / 2,
    y: PAD,
    w: fsaW,
    h: fsaH,
  };
  const fundY = fsa.y + fsa.h + 48;
  const fundBoxes: Box[] = FUND_SLUGS.map((slug, index) => {
    const title = titleFor(allEdges, slug);
    return { id: slug, slug, title, x: colX(index), y: fundY, w: colW, h: boxHeight(title, colW) };
  });
  const fundBottom = Math.max(...fundBoxes.map((box) => box.y + box.h));
  const targetY = fundBottom + 88;
  const targetBoxes: Box[] = TARGET_SLUGS.map((slug, index) => {
    const title = titleFor(allEdges, slug);
    const slots = Math.max(1, fundInvests.filter((edge) => edge.to === slug).length);
    return { id: slug, slug, title, x: colX(index), y: targetY, w: colW, h: boxHeight(title, colW, slots) };
  });

  const boxes: Box[] = [fsa, ...fundBoxes, ...targetBoxes];
  const arrows: DrawnArrow[] = [];

  for (const edge of fsaEdges) {
    mark(edge);
    const fund = fundBoxes.find((box) => box.slug === edge.to);
    if (!fund) continue;
    const x1 = fsa.x + fsa.w / 2;
    const y1 = fsa.y + fsa.h;
    const x2 = fund.x + fund.w / 2;
    const y2 = fund.y;
    const mid = (y1 + y2) / 2;
    arrows.push({
      key: edgeKey(edge),
      d: `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`,
      lines: ["Regulates"],
      labelX: x2,
      labelY: y2 - 10,
      anchor: "middle",
      extent: y2,
    });
  }

  for (const fund of fundBoxes) {
    const outgoing = fundInvests
      .filter((edge) => edge.from === fund.slug)
      .sort((a, b) => TARGET_SLUGS.indexOf(a.to as (typeof TARGET_SLUGS)[number]) - TARGET_SLUGS.indexOf(b.to as (typeof TARGET_SLUGS)[number]));
    outgoing.forEach((edge, index) => {
      mark(edge);
      const target = targetBoxes.find((box) => box.slug === edge.to);
      if (!target) return;
      const hits = fundInvests.filter((item) => item.to === target.slug);
      const slot = hits.findIndex((item) => edgeKey(item) === edgeKey(edge));
      const x1 = fund.x + fund.w / 2;
      const y1 = fund.y + fund.h;
      const x2 = slotYx(target, slot === -1 ? 0 : slot, hits.length);
      const y2 = target.y;
      const mid = (y1 + y2) / 2;
      const year = yearOf(edge.asOf);
      arrows.push({
        key: edgeKey(edge),
        d: `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`,
        lines: [year === "Undated" ? labelize(edge.relationship) : year],
        labelX: x1,
        labelY: y1 + 16 + index * 14,
        anchor: "middle",
        extent: y2,
      });
    });
  }

  const targetBottom = Math.max(...targetBoxes.map((box) => box.y + box.h));
  bankInvests.forEach((edge, index) => {
    mark(edge);
    const from = targetBoxes.find((box) => box.slug === edge.from);
    const to = targetBoxes.find((box) => box.slug === edge.to);
    if (!from || !to) return;
    const drop = 26 + index * 16;
    const x1 = from.x + from.w / 2;
    const y1 = from.y + from.h;
    const x2 = to.x + to.w / 2;
    const y2 = to.y + to.h;
    const y = targetBottom + drop;
    const lines = labelLines(edge);
    arrows.push({
      key: edgeKey(edge),
      d: `M ${x1} ${y1} C ${x1} ${y}, ${x2} ${y}, ${x2} ${y2}`,
      lines,
      labelX: (x1 + x2) / 2,
      labelY: y - 6,
      anchor: "middle",
      extent: y + 8,
    });
  });

  let cursor = targetBottom + 36 + bankInvests.length * 18;
  if (sedla) {
    mark(sedla);
    const leftH = boxHeight(sedla.fromTitle, colW);
    const rightH = boxHeight(sedla.toTitle, colW);
    const left: Box = { id: "sedla-row", slug: sedla.from, title: sedla.fromTitle, x: origin, y: cursor, w: colW, h: leftH };
    const right: Box = { id: "arion-reg", slug: sedla.to, title: sedla.toTitle, x: origin + colW + GAP_X, y: cursor, w: colW, h: rightH };
    boxes.push(left, right);
    arrows.push(hArrow(left, right, sedla));
    cursor += Math.max(leftH, rightH) + 36;
  }

  const financeOrder = ["landsbankinn", "isavia", "landsnet", "landsvirkjun"];
  const financeEdges = [...financeOwns, ...(appointsLv ? [appointsLv] : [])].sort(
    (a, b) => financeOrder.indexOf(a.to) - financeOrder.indexOf(b.to),
  );
  if (financeEdges.length > 0) {
    const stacked = placeStack(
      financeEdges.map((edge) => ({ id: `fin-${edge.to}`, slug: edge.to, title: edge.toTitle })),
      origin + colW + GAP_X,
      cursor,
      colW,
    );
    const spanTop = stacked[0].y;
    const spanBottom = stacked[stacked.length - 1].y + stacked[stacked.length - 1].h;
    const finance = centerBox("finance-own", "ministry-of-finance", financeEdges[0].fromTitle, origin, spanTop, spanBottom, colW);
    boxes.push(finance, ...stacked);
    for (const edge of financeEdges) {
      if (edge.relationship !== "appoints") mark(edge);
      const target = stacked.find((box) => box.slug === edge.to);
      if (target) arrows.push(hArrow(finance, target, edge));
    }
    cursor = spanBottom + 36;
  }

  for (const edge of reykjavik) {
    mark(edge);
    const leftH = boxHeight(edge.fromTitle, colW);
    const rightH = boxHeight(edge.toTitle, colW);
    const left: Box = { id: "reykjavik", slug: edge.from, title: edge.fromTitle, x: origin, y: cursor, w: colW, h: leftH };
    const right: Box = { id: edge.to, slug: edge.to, title: edge.toTitle, x: origin + colW + GAP_X, y: cursor, w: colW, h: rightH };
    boxes.push(left, right);
    arrows.push(hArrow(left, right, edge));
    cursor += Math.max(leftH, rightH) + 28;
  }

  for (const edge of edges) {
    if (used.has(edgeKey(edge))) continue;
    const leftH = boxHeight(edge.fromTitle, colW);
    const rightH = boxHeight(edge.toTitle, colW);
    const left: Box = { id: `miss-${edgeKey(edge)}-from`, slug: edge.from, title: edge.fromTitle, x: origin, y: cursor, w: colW, h: leftH };
    const right: Box = { id: `miss-${edgeKey(edge)}-to`, slug: edge.to, title: edge.toTitle, x: origin + colW + GAP_X, y: cursor, w: colW, h: rightH };
    boxes.push(left, right);
    arrows.push(hArrow(left, right, edge));
    cursor += Math.max(leftH, rightH) + 16;
  }

  return finish(boxes, arrows);
}

function slotYx(box: Box, index: number, count: number): number {
  if (count <= 1) return box.x + box.w / 2;
  const inset = 18;
  return box.x + inset + ((box.w - inset * 2) * index) / (count - 1);
}

function NodeBox({ box }: { box: Box }) {
  const target = resolveSlug(box.slug);
  const lines = wrapLines(box.title, box.w);
  const text = (
    <text fill="var(--foreground)" fontSize={13} fontWeight={600}>
      {lines.map((line, index) => (
        <tspan key={`${box.id}-${index}`} x={box.x + 10} y={box.y + 22 + index * 17}>
          {line}
        </tspan>
      ))}
    </text>
  );
  const rect = (
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      rx={8}
      fill="var(--card)"
      stroke="var(--border)"
    />
  );
  if (!target) {
    return (
      <g>
        {rect}
        {text}
      </g>
    );
  }
  return (
    <a href={target.href}>
      {rect}
      {text}
    </a>
  );
}

function StripDrawing({ id, edges }: { id: StripId; edges: Edge[] }) {
  const scene = id === "budget" ? layoutBudget(edges) : id === "power" ? layoutPower(edges) : layoutOwnership(edges);
  const markerId = `${id}-arrow`;
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-lg border bg-background">
      <svg
        aria-label={DRAWING_LABEL[id]}
        className="max-w-none"
        data-strip-drawing={id}
        height={scene.height}
        role="group"
        style={{ width: scene.width, height: scene.height }}
        viewBox={`0 0 ${scene.width} ${scene.height}`}
        width={scene.width}
      >
        <title>{DRAWING_LABEL[id]}</title>
        <defs>
          <marker id={markerId} markerHeight="7" markerWidth="7" orient="auto" refX="8" refY="5" viewBox="0 0 10 10">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--foreground)" />
          </marker>
        </defs>
        {scene.bands.map((band) => (
          <rect key={`${id}-band-${band.y}`} x={band.x} y={band.y} width={band.w} height={band.h} rx={12} fill="var(--muted)" />
        ))}
        {scene.arrows.map((arrow) => (
          <g key={arrow.key}>
            <path d={arrow.d} fill="none" markerEnd={`url(#${markerId})`} stroke="var(--foreground)" strokeOpacity={0.55} strokeWidth={1.4} />
            <text
              fill="var(--muted-foreground)"
              fontSize={11}
              paintOrder="stroke fill"
              stroke="var(--background)"
              strokeWidth={4}
              textAnchor={arrow.anchor}
            >
              {arrow.lines.map((line, index) => (
                <tspan key={`${arrow.key}-${index}`} x={arrow.labelX} y={arrow.labelY + index * 14}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ))}
        {scene.boxes.map((box) => (
          <NodeBox box={box} key={box.id} />
        ))}
      </svg>
    </div>
  );
}

export function ConnectionStrips({
  edges,
  only,
}: {
  edges: Edge[];
  only?: StripId;
}) {
  const groups: Record<StripId | "other", Edge[]> = {
    budget: [],
    power: [],
    ownership: [],
    other: [],
  };
  for (const edge of edges) {
    groups[stripOf(edge)].push(edge);
  }

  const shown: StripId[] = only ? [only] : ["budget", "power", "ownership"];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {shown.map((id) => {
        const copy = STRIP_COPY[id];
        const edgesForStrip = sortEdges(groups[id], id);
        return (
          <section className="flex min-w-0 flex-col gap-3" id={`${id}-strip`} key={id}>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-medium">{copy.title}</h2>
              <p className="text-sm text-muted-foreground">{copy.text}</p>
            </div>
            <StripDrawing edges={edges} id={id} />
            <ol className="divide-y overflow-hidden rounded-lg border">
              {edgesForStrip.map((edge) => (
                <EdgeRow edge={edge} key={edgeKey(edge)} />
              ))}
            </ol>
            {id === "ownership" && !only && groups.other.length > 0 ? (
              <div className="flex flex-col gap-2" id="other-edges">
                <h3 className="text-base font-medium">Other typed edges</h3>
                <p className="text-sm text-muted-foreground">
                  These links are on the map and are not the pension, bank, or Landsbankinn lines above.
                </p>
                <ol className="divide-y overflow-hidden rounded-lg border">
                  {sortEdges(groups.other, "other").map((edge) => (
                    <EdgeRow edge={edge} key={edgeKey(edge)} />
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
