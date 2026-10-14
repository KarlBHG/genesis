import { getCatalog, toSearchDocs } from "@/lib/content";

export function GET() {
  return Response.json(toSearchDocs(getCatalog()));
}
