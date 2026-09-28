import type { EdgeAmount, MoneyBasis, MoneyUnit } from "@/lib/types";

/** How each source abbreviates its unit. Nothing here converts between them. */
const UNIT_LABEL: Record<MoneyUnit, string> = {
  ISK: "ISK",
  mkr: "m.kr.",
  makr: "ma.kr.",
  USD: "USD",
};

const BASIS_LABEL: Record<MoneyBasis, string> = {
  authorisation: "authorisation",
  invoice: "invoice",
  statement: "statement",
  "trade-release": "trade release",
};

export function unitLabel(unit: MoneyUnit): string {
  return UNIT_LABEL[unit];
}

export function basisLabel(basis: MoneyBasis): string {
  return BASIS_LABEL[basis];
}

/**
 * Renders the stored figure with Icelandic separators and its own unit, so the
 * digits match the cited document. No rounding and no unit conversion, but a
 * trailing zero the source printed (`77.252,0`) is not stored on a number and
 * so does not come back — which is why every figure is shown beside the
 * quotation it was read out of.
 */
export function printedFigure(amount: EdgeAmount): string {
  const decimals = decimalsOf(amount.value);
  const digits = new Intl.NumberFormat("is-IS", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount.value);
  return `${digits} ${UNIT_LABEL[amount.unit]}`;
}

function decimalsOf(value: number): number {
  const fraction = String(value).split(".")[1];
  return fraction ? fraction.length : 0;
}

/**
 * The widest printed figure in a set, for a shared bar domain. This picks one
 * of the given values; it never adds them, so the scale is still anchored to
 * something a cited page actually prints.
 */
export function widestFigure(amounts: readonly EdgeAmount[]): number {
  const magnitudes = amounts.map((amount) => Math.abs(amount.value));
  return magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
}

/** Amounts only compare when they were printed in the same unit and basis. */
export function comparable(amounts: readonly EdgeAmount[]): boolean {
  const first = amounts[0];
  if (!first) return false;
  return amounts.every(
    (amount) => amount.unit === first.unit && amount.basis === first.basis,
  );
}
