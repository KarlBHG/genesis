import { connectionsCsv } from "@/lib/export";

export function GET() {
  return new Response(connectionsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="alltikerfi-connections.csv"',
    },
  });
}
