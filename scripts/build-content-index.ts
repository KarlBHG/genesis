import { performance } from "node:perf_hooks";

import { buildContentIndex } from "@/lib/content";

const start = performance.now();
const { snapshot, digest } = buildContentIndex();
const ms = (performance.now() - start).toFixed(0);

console.log(
  `content index: ${snapshot.entries.length} entries, ${snapshot.edges.length} edges, ` +
    `${snapshot.offices.length} offices in ${ms} ms (${digest.slice(0, 12)})`,
);
