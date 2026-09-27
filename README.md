# AlltÍkerfi

A searchable reference for how Iceland is wired: treaties, institutions, events, business sectors, published money flows, and public office-holders. The interface is English. Icelandic proper names keep their spelling (Alþingi, Seðlabanki Íslands, króna).

Connections are typed edges in entry frontmatter (`owns`, `regulates`, `appoints`, `sells-power-to`, `represents`, `funds`). The connections page lists those edges and draws only them.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 38471
```

Open [http://127.0.0.1:38471](http://127.0.0.1:38471).

## Content

Markdown with YAML frontmatter lives in `content/treaties`, `content/institutions`, `content/events`, `content/business`, `content/money`, and `content/players`. `lib/content.ts` reads those files when the app builds or serves a page. There is no second metadata file for relationships: each edge is stored once, on the entry it starts from. Cross-links use `[[slug]]`. A slug with no entry renders as an unresolved reference.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Fuse.js.
