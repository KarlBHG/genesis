import { ImageResponse } from "next/og";

import { clampSentence, factStrip, ledeOrSummary } from "@/lib/entry-facts";
import { kindLabel } from "@/lib/format";
import type { Entry } from "@/lib/types";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Satori has no oklch or CSS variables, so the paper palette from
// globals.css is restated here as hex.
const PAPER = "#faf8f2";
const INK = "#1b1a17";
const MUTED = "#6c665b";
const RULE = "#ded7c8";
const ACCENT = "#3d5a80";

export function ogAlt(entry: Entry): string {
  return `${entry.title} — ${kindLabel(entry.kind).replace(/s$/, "")} in the AlltÍkerfi system map`;
}

/** One card per entry, with alt text naming the actual record. */
export function ogImageMetadata(entry: Entry | undefined) {
  return [
    {
      id: "card",
      alt: entry ? ogAlt(entry) : "AlltÍkerfi record card",
      size: ogSize,
      contentType: ogContentType,
    },
  ];
}

/**
 * The share card is the page in miniature: kind, title, lede, fact strip.
 * Nothing here is authored separately, so a card can never drift from
 * the record it points at.
 */
export function renderEntryOgImage(entry: Entry): ImageResponse {
  const lead = clampSentence(ledeOrSummary(entry), 180);
  const facts = factStrip(entry);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            <div style={{ display: "flex" }}>
              {kindLabel(entry.kind).replace(/s$/, "")}
            </div>
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: 4,
                background: RULE,
              }}
            />
            <div style={{ display: "flex", color: MUTED }}>AlltÍkerfi</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: entry.title.length > 52 ? 60 : 76,
              lineHeight: 1.1,
              fontWeight: 600,
            }}
          >
            {entry.title}
          </div>
          {lead ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.45,
                color: MUTED,
              }}
            >
              {lead}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            borderTop: `2px solid ${RULE}`,
            paddingTop: 28,
          }}
        >
          {facts.map((fact) => (
            <div
              key={fact.term}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                border: `2px solid ${RULE}`,
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 24,
              }}
            >
              <div style={{ display: "flex", color: MUTED }}>{fact.term}</div>
              <div style={{ display: "flex", fontWeight: 600 }}>
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    ogSize,
  );
}
