# AlltÍkerfi

A searchable reference for how Iceland is wired: treaties, institutions, and events, with a source on every entry. The interface is English. Icelandic proper names keep their spelling (Alþingi, Seðlabanki Íslands, króna).

Phase 1 is a reading map. It does not include a network graph, a visual timeline, scrapers, or other countries.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 38471
```

Open [http://127.0.0.1:38471](http://127.0.0.1:38471).

## Content

Markdown with YAML frontmatter lives in `content/treaties`, `content/institutions`, and `content/events`. `lib/content.ts` reads those files when the app builds or serves a page. There is no second metadata file to maintain. Cross-links use `[[slug]]`. A slug with no entry renders as an unresolved reference.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Fuse.js.
