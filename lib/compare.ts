import { resolveSlug } from "@/lib/content";
import { formatDate, kindLabel, labelize } from "@/lib/format";
import type { Edge, Entry, Relationship } from "@/lib/types";

export const DEFAULT_LEFT = "arion-banki";
export const DEFAULT_RIGHT = "islandsbanki";

export type Fact = { label: string; value: string };

export type Touch = {
  /** Unique per cited sentence. Pair identity plus asOf, start, amount basis, quotation. */
  key: string;
  /** Same relationship to the same other entry. Used to match shared/only columns. */
  pairKey: string;
  relationship: Relationship;
  direction: "out" | "in";
  otherSlug: string;
  otherTitle: string;
  note: string;
  asOf: string;
};

export function touchPairKey(
  direction: "out" | "in",
  relationship: Relationship,
  otherSlug: string,
): string {
  return `${direction}:${relationship}:${otherSlug}`;
}

/** Honest list identity. Two invoices to the same vendor stay two keys. */
export function touchKey(
  direction: "out" | "in",
  edge: Pick<
    Edge,
    "relationship" | "from" | "to" | "asOf" | "start" | "quotation" | "amount"
  >,
): string {
  const otherSlug = direction === "out" ? edge.to : edge.from;
  return [
    touchPairKey(direction, edge.relationship, otherSlug),
    edge.asOf,
    edge.start ?? "",
    edge.amount?.basis ?? "",
    edge.quotation,
  ].join("|");
}

export function factsFor(entry: Entry): Fact[] {
  const section: Fact = { label: "Section", value: kindLabel(entry.kind) };
  if (entry.kind === "player") {
    return [
      section,
      { label: "Role", value: entry.role || "Not stated" },
      { label: "Player type", value: labelize(entry.playerType) },
      {
        label: "As of",
        value: entry.asOf ? formatDate(entry.asOf) : "Not dated",
      },
    ];
  }
  if (entry.kind === "institution") {
    return [
      section,
      { label: "Role", value: labelize(entry.role) },
      { label: "Founded", value: formatDate(entry.founded) },
      {
        label: "Parent",
        value: entry.parent
          ? (resolveSlug(entry.parent)?.title ?? entry.parent)
          : "None",
      },
    ];
  }
  if (entry.kind === "treaty") {
    return [
      section,
      { label: "Signed", value: formatDate(entry.signed) },
      { label: "Effective", value: formatDate(entry.effective) },
      { label: "Status", value: labelize(entry.status) },
      { label: "Parties", value: entry.parties.join(", ") || "Not stated" },
    ];
  }
  if (entry.kind === "event") {
    return [
      section,
      { label: "Date", value: formatDate(entry.date) },
      { label: "Event type", value: labelize(entry.type) },
    ];
  }
  if (entry.kind === "sector") {
    return [section, { label: "Area", value: labelize(entry.area) }];
  }
  return [section, { label: "Year", value: entry.year || "Not stated" }];
}

export function factRows(left: Fact[], right: Fact[]): {
  label: string;
  left: string;
  right: string;
  same: boolean;
}[] {
  const labels: string[] = [];
  for (const fact of [...left, ...right]) {
    if (!labels.includes(fact.label)) labels.push(fact.label);
  }
  return labels.map((label) => {
    const leftValue = left.find((fact) => fact.label === label)?.value ?? "Not on this entry";
    const rightValue = right.find((fact) => fact.label === label)?.value ?? "Not on this entry";
    return {
      label,
      left: leftValue,
      right: rightValue,
      same: leftValue === rightValue,
    };
  });
}

export function touchesOf(slug: string, edges: Edge[]): Touch[] {
  const touches: Touch[] = [];
  for (const edge of edges) {
    if (edge.from === slug) {
      touches.push({
        key: touchKey("out", edge),
        pairKey: touchPairKey("out", edge.relationship, edge.to),
        relationship: edge.relationship,
        direction: "out",
        otherSlug: edge.to,
        otherTitle: edge.toTitle,
        note: edge.quotation,
        asOf: edge.asOf,
      });
    } else if (edge.to === slug) {
      touches.push({
        key: touchKey("in", edge),
        pairKey: touchPairKey("in", edge.relationship, edge.from),
        relationship: edge.relationship,
        direction: "in",
        otherSlug: edge.from,
        otherTitle: edge.fromTitle,
        note: edge.quotation,
        asOf: edge.asOf,
      });
    }
  }
  return touches;
}

function touchesByPair(touches: Touch[]): Map<string, Touch[]> {
  const grouped = new Map<string, Touch[]>();
  for (const touch of touches) {
    const list = grouped.get(touch.pairKey);
    if (list) list.push(touch);
    else grouped.set(touch.pairKey, [touch]);
  }
  return grouped;
}

/**
 * Zip every cited row that shares a pair. A second invoice to the same
 * vendor is a second shared row, not a silent collision.
 */
export function sharedTouches(
  left: Touch[],
  right: Touch[],
): { left: Touch; right: Touch }[] {
  const rightByPair = touchesByPair(right);
  const usedRight = new Map<string, number>();
  const matched: { left: Touch; right: Touch }[] = [];
  for (const touch of left) {
    const candidates = rightByPair.get(touch.pairKey);
    if (!candidates) continue;
    const used = usedRight.get(touch.pairKey) ?? 0;
    if (used >= candidates.length) continue;
    const match = candidates[used];
    if (!match) continue;
    usedRight.set(touch.pairKey, used + 1);
    matched.push({ left: touch, right: match });
  }
  return matched;
}

export function onlyTouches(own: Touch[], other: Touch[]): Touch[] {
  const otherCount = new Map<string, number>();
  for (const touch of other) {
    otherCount.set(touch.pairKey, (otherCount.get(touch.pairKey) ?? 0) + 1);
  }
  const used = new Map<string, number>();
  return own.filter((touch) => {
    const available = otherCount.get(touch.pairKey) ?? 0;
    const consumed = used.get(touch.pairKey) ?? 0;
    if (consumed < available) {
      used.set(touch.pairKey, consumed + 1);
      return false;
    }
    return true;
  });
}

/** Cited rows omitted by shared/only matching. Must stay empty. */
export function droppedCompareTouches(own: Touch[], other: Touch[]): Touch[] {
  const kept = new Set([
    ...sharedTouches(own, other).map((row) => row.left.key),
    ...onlyTouches(own, other).map((touch) => touch.key),
  ]);
  return own.filter((touch) => !kept.has(touch.key));
}
