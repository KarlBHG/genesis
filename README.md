# AlltÍkerfi

A searchable reference for how Iceland is wired: treaties, institutions, events, business sectors, published money flows, and public office-holders. The interface is English. Icelandic proper names keep their spelling (Alþingi, Seðlabanki Íslands, króna).

Typed edges live in `data/edges.json`. Each one has from, to, type, asOf, source, and quotation. The app refuses to load if a field is missing, the type is not on the allowlist, or either end does not exist. A career line (`holds-office`, `sits-on-board`, or a person’s disclosed holding) also needs a start, an end, and a channel, `political` or `business`. Authority and trade lines use `elects`, `imported-from`, `exported-to`, and `incorporates`. The system page reads those records. When a page prints only one end of the term, the other field is the words `not printed`. `data/contradictions.json` keeps two sourced sentences about the same entries and does not pick a winner. `related` in the Markdown stays untyped and is not drawn. The connections page, the contradictions page, and the map read those files.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 38471
```

Open [http://127.0.0.1:38471](http://127.0.0.1:38471) for the **dashboard** (home). Use **System** for how to read the map; **Overview** for the budget drawing and search. **Budget** (`/money`) lists the 35 policy areas for 2026 plus trade and Treasury flows, split into authorisations, invoices, and contracts; `/programs` redirects to the programs section on that page. **Evidence** (`/anomalies`) filters contradictions, field changes from `data/changes.json`, repeated invoices, and audit sentences. Connections groups edges into the map views; each typed line has a permalink at `/connections/[id]`. The map opens with Authority, Ownership, and Trade on.
Public-entity coverage is listed on **Public entities** (`/public-entities`), with per-entity badges for catalog presence, map pinning, typed links, and office linkage. The same page keeps a dated [Govdirectory](https://www.govdirectory.org/iceland/) / Wikidata checklist of ministries, courts, and municipalities. That list is open data (Wikidata is CC0). It is not a source of typed edges. A kennitala is stored in `data/identifiers.json` only when a cited page prints it.

## Content

Markdown with YAML frontmatter lives in `content/treaties`, `content/institutions`, `content/events`, `content/business`, `content/money`, and `content/players`. `lib/content.ts` reads those files when the app builds or serves a page. Places are `data/places.json`. Named offices are `data/offices.json`, each with a page at `/offices/[id]`. Cross-links use `[[slug]]`. A slug with no entry renders as an unresolved reference.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Fuse.js.
