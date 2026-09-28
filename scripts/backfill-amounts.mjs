/**
 * One-shot pilot backfill for `amount` on data/edges.json.
 *
 * Reads the figure straight out of each row's existing quotation. It never
 * converts a unit, never nets a credit note, and never adds two rows together:
 * if the quotation does not print a single unambiguous number, the row is
 * skipped and reported.
 */
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "edges.json");
const edges = JSON.parse(fs.readFileSync(FILE, "utf8"));

/** "192.293,9" -> 192293.9 — Icelandic separators, no rounding. */
function icelandicNumber(printed) {
  const value = Number(printed.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) throw new Error(`cannot read "${printed}"`);
  return value;
}

const ARTICLE_4_MINISTRY =
  /Article 4 prints a 2026 total authorisation of ([\d.,]+) m\.kr\. for [^.]+\./u;
const ARTICLE_4_HEALTHCARE =
  /prints a total authorisation of ([\d.,]+) m\.kr\. for hospital services under the Ministry of Health/u;
/** Opnir reikningar row: buyer; date; supplier; invoice no; amount in ISK. */
const LEDGER_ROW = /^[^;]+;[^;]+;[^;]+;[^;]+;\s*(-?\d+)$/u;

const skipped = [];
let added = 0;

for (const edge of edges) {
  if (edge.amount) continue;

  if (edge.type === "funds") {
    const ministry = edge.quotation.match(ARTICLE_4_MINISTRY);
    const healthcare = edge.quotation.match(ARTICLE_4_HEALTHCARE);
    const hit = ministry ?? healthcare;
    if (!hit) {
      if (/Article 4/.test(edge.quotation)) {
        skipped.push(`funds ${edge.from} -> ${edge.to}: no single Article 4 figure`);
      }
      continue;
    }
    edge.amount = {
      value: icelandicNumber(hit[1]),
      unit: "mkr",
      basis: "authorisation",
      quotation: hit[0],
    };
    added += 1;
    continue;
  }

  if (edge.type === "pays" && ("year" in edge || "program" in edge)) {
    const row = edge.quotation.match(LEDGER_ROW);
    if (!row) {
      skipped.push(`pays ${edge.from} -> ${edge.to}: quotation is not a ledger row`);
      continue;
    }
    edge.amount = {
      value: Number(row[1]),
      unit: "ISK",
      basis: "invoice",
      quotation: edge.quotation,
    };
    added += 1;
  }
}

fs.writeFileSync(FILE, `${JSON.stringify(edges, null, 2)}\n`);
console.log(`amount added to ${added} edges`);
for (const note of skipped) console.log(`  skipped: ${note}`);
