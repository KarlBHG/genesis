import identifiersJson from "@/data/identifiers.json";
import { digitsOfKennitala, kennitalaChecksumOk } from "@/lib/kennitala";
import { isHttpUrl } from "@/lib/safe-href";

export type KennitalaRecord = {
  slug: string;
  /** Digit string as the cited page prints it (hyphens allowed). */
  kennitala: string;
  source: string;
  quotation: string;
};

export const KENNITALA_RECORDS = identifiersJson as KennitalaRecord[];

export function kennitalaFor(slug: string): KennitalaRecord | null {
  return KENNITALA_RECORDS.find((row) => row.slug === slug) ?? null;
}

export function normalizeKennitala(value: string): string {
  return digitsOfKennitala(value);
}

export function assertKennitalaRecord(row: KennitalaRecord): void {
  const digits = normalizeKennitala(row.kennitala);
  if (digits.length !== 10) {
    throw new Error(`${row.slug} kennitala is not ten digits`);
  }
  if (!row.quotation.includes(row.kennitala) && !row.quotation.includes(digits)) {
    throw new Error(`${row.slug} quotation does not print the kennitala`);
  }
  if (!isHttpUrl(row.source)) {
    throw new Error(`${row.slug} source must be an http(s) address`);
  }
  if (!kennitalaChecksumOk(digits)) {
    throw new Error(`${row.slug} kennitala fails the public checksum`);
  }
}
