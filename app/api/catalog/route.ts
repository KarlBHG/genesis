import { catalogExport } from "@/lib/export";

export function GET() {
  return new Response(JSON.stringify(catalogExport(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="alltikerfi-catalog.json"',
    },
  });
}
