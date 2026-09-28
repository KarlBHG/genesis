import { dateSortKey, formatDate } from "@/lib/format";

export type AsOfBucket = "iso" | "year" | "undated" | "statute";

export type AsOfMeta = {
  bucket: AsOfBucket;
  bucketLabel: string;
  sortKey: string;
  display: string;
};

const BUCKET_LABEL: Record<AsOfBucket, string> = {
  iso: "ISO",
  year: "year",
  undated: "undated",
  statute: "statute",
};

function statuteSortKey(value: string): string {
  const iso = value.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return dateSortKey(iso[1]!);
  const dmy = value.match(/\b(\d{1,2})\s+(\w+)\s+(\d{4})\b/);
  if (dmy) {
    const parsed = Date.parse(`${dmy[2]} ${dmy[1]}, ${dmy[3]}`);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}${m}${day}`;
    }
  }
  return `5${value.toLowerCase()}`;
}

function yearSortKey(value: string): string {
  const start = value.match(/^(\d{4})/);
  if (start) return `${start[1]}0000`;
  return `4${value.toLowerCase()}`;
}

export function classifyAsOfBucket(asOf: string): AsOfBucket {
  const value = asOf.trim();
  if (!value) return "undated";
  if (/^undated\b/i.test(value)) return "undated";
  if (/consolidated statute/i.test(value) || /\blagasafn\b/i.test(value)) {
    return "statute";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "iso";
  if (/^\d{4}-\d{2}$/.test(value)) return "iso";
  if (/^\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}-\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "iso";
  if (/^\d{4}/.test(value)) return "year";
  return "undated";
}

export function asOfMeta(asOf: string): AsOfMeta {
  const value = asOf.trim();
  const bucket = classifyAsOfBucket(value);
  const bucketLabel = BUCKET_LABEL[bucket];
  let sortKey: string;
  switch (bucket) {
    case "iso":
      sortKey = dateSortKey(value);
      break;
    case "year":
      sortKey = yearSortKey(value);
      break;
    case "statute":
      sortKey = statuteSortKey(value);
      break;
    default:
      sortKey = `9${value.toLowerCase()}`;
      break;
  }
  const display = value ? formatDate(value) : "Not stated";
  return { bucket, bucketLabel, sortKey, display };
}

export function compareAsOf(a: string, b: string): number {
  const ma = asOfMeta(a);
  const mb = asOfMeta(b);
  if (ma.sortKey !== mb.sortKey) return ma.sortKey.localeCompare(mb.sortKey);
  return a.localeCompare(b);
}
