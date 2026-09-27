# AlltÍkerfi

A searchable reference for how Iceland is wired: treaties, institutions, events, business sectors, published money flows, and public office-holders. The interface is English. Icelandic proper names keep their spelling (Alþingi, Seðlabanki Íslands, króna).

Typed edges live in `data/edges.json`. Each one has from, to, type, asOf, source, and quotation. The app refuses to load if a field is missing, the type is not on the allowlist, or either end does not exist. `related` in the Markdown stays untyped and is not drawn. The connections page and the map read that same edge file.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 38471
```

Open [http://127.0.0.1:38471](http://127.0.0.1:38471).

## Content

Markdown with YAML frontmatter lives in `content/treaties`, `content/institutions`, `content/events`, `content/business`, `content/money`, and `content/players`. `lib/content.ts` reads those files when the app builds or serves a page. Places are `data/places.json`. The seven named offices are `data/offices.json`. Cross-links use `[[slug]]`. A slug with no entry renders as an unresolved reference.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Fuse.js.
