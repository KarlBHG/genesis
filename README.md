# AlltÍkerfi

A searchable reference for how Iceland is wired: treaties, institutions, events, business sectors, published money flows, and public office-holders. The interface is English. Icelandic proper names keep their spelling (Alþingi, Seðlabanki Íslands, króna).

Typed edges live in `data/edges.json`. Each one has from, to, type, asOf, source, and quotation. The app refuses to load if a field is missing, the type is not on the allowlist, either end does not exist, or the two endpoint kinds are not a legal pair for that verb. Exceptions are listed by existing `edgeKey` and cannot spread. A career line (`holds-office`, `sits-on-board`, or a person’s disclosed holding) also needs a start, an end, and a channel, `political` or `business`. Authority and trade lines use `elects`, `imported-from`, `exported-to`, and `incorporates`. The system page reads those records. When a page prints only one end of the term, the other field is the words `not printed`. `data/contradictions.json` keeps two sourced sentences about the same entries and does not pick a winner. `related` in the Markdown stays untyped and is not drawn. The connections page, the contradictions page, and the map read those files.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 38471
```

Open [http://127.0.0.1:38471](http://127.0.0.1:38471) for the **dashboard** (home). Below `lg` the phone is a pocket folio: numbered thumb cuts `01–10` on the sheet menu, and on `/map` the plate caption docks as a drag-height bottom sheet over the island. Desktop atlas stays the side caption. Three resident questions sit on that page and on **Standing** (`/standing`, footer / System / Methodology — not an eleventh nav leaf): as a taxpayer, as a depositor in a state-owned bank, as a voter after 30 November 2024. Each hop is a stored edge with a permalink, or **no sourced line**. Municipality is a catalog pick, not a postcode. Use **System** for how to read the map; **Overview** for the budget drawing and search. **Budget** (`/money`) lists the 35 policy areas for 2026 plus trade and Treasury flows, split into authorisations, invoices, and contracts; `/programs` redirects to the programs section on that page. Invoice coverage is a tab on that page — every stored `pays` row grouped by buyer — joined to a program, stored with an explicit null reason, or unreviewed — captioned with row counts, never krónur. When an Opnir heading is not a unique catalog-title match, that tab also lists the identity statement (start: printed buyer Hæstiréttur sitting on `courts`). **Evidence** (`/anomalies`) filters contradictions, field changes from `data/changes.json`, repeated invoices, and audit sentences. Connections groups edges into the map views; each typed line has a permalink at `/connections/[id]`. Filter current membership against ended with `?tenure=current` or `?tenure=ended`. An empty end is labelled **no end date stored**, never “current.” Current membership is a `holds-office` row with no end date stored and a cited as-of. The map opens with Authority, Ownership, and Trade on.
Public-entity coverage is listed on **Public entities** (`/public-entities`), with per-entity badges for catalog presence, map pinning, typed links, and office linkage. The same page keeps a checklist of inventory public companies and funds with **no sourced `owns` statement** (or only a contradiction), and a dated [Govdirectory](https://www.govdirectory.org/iceland/) / Wikidata checklist of ministries, courts, and municipalities. That list is open data (Wikidata is CC0). It is not a source of typed edges. Each `owns` permalink is a dated statement (subject, interested party, as of, quotation, source), not a timeless “X owns Y.” A kennitala is stored in `data/identifiers.json` only when a cited page prints it. **Offices** (`/offices`, footer — not an eleventh nav leaf) keep each Post (title, organization) and list time-bounded `holds-office` membership. Current means no end date stored and a cited as-of. Vacant stays vacant. A holder field that disagrees with typed membership is a checklist row, not a succession.

## Paste a sourced line (local)

`/intake` is a human form, linked from the footer and from Methodology — not an eleventh nav leaf. Paste an official URL, the sentence as printed, an allowlisted relationship, and two existing from/to slugs (or office ids). The same checks as `lib/content.ts` run: six fields, allowlisted type, both ends exist, pair-type law, amount (if present) must be a substring of the quotation and print the stored number. Career lines still need start, end, and channel. `pays` lines still need year and a program join or an explicit null reason.

The form does **not** fetch the URL, scrape HTML, or call Ollama or any other model. A passing check can be queued in `data/intake-queue.json` on a local/dev tree. It never appends to `data/edges.json`; promote a row by hand after `npm run check` would still pass.

## Quoted-name ledger

When a cited sentence names a party that has no catalog slug and no office id, `/intake#quoted-names` stores a **placeholder**: printed name, source URL, quotation, as-of, optional human-picked allowlisted type, `status: unmatched`. It does not create a player and it is not drawn. The same ledger is a tab on **Public entities** (`/public-entities#quoted-names`) and is explained on Methodology — not an eleventh nav leaf. Queue file: `data/quoted-names.json`. Unmatched stays unmatched. File a catalog page from the same quotation, then paste the six-field row.

## Review official Opnir rows (local)

`/intake/opnir` is a review queue for official invoice rows from [opnirreikningar.is](https://opnirreikningar.is/), linked from the footer and Methodology — not an eleventh nav leaf. It accepts:

1. A paste of official CSV/JSON (columns `kaupandi`, `dagsetning`, `seljandi`, `reikningsnúmer`, `upphæð`) or semicolon ledger lines.
2. The bundled fixture in `data/opnir-feed-fixture.json` (copied official-shaped rows; **not** fetched at runtime).
3. Already-stored `pays` quotations from `data/edges.json`.

A human must then confirm a policy-area join (with program source and quotation) or store a null reason. A printed `málaflokkur` column stays printed text and is never mapped to a program. Vendor line of business is not a málaflok. Amounts are not added together. Ollama is not called.

Save-to-review writes `data/opnir-review-queue.json`. A confirmed row can be queued to `data/intake-queue.json` like any other paste. Neither write touches `data/edges.json`.

## Content

Markdown with YAML frontmatter lives in `content/treaties`, `content/institutions`, `content/events`, `content/business`, `content/money`, and `content/players`. `lib/content.ts` reads those files when the app builds or serves a page. Places are `data/places.json`. Named offices are `data/offices.json`, each with a page at `/offices/[id]`. Cross-links use `[[slug]]`. A slug with no entry renders as an unresolved reference.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Fuse.js.
