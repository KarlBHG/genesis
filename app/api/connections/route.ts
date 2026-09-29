import { connectionsCsv } from "@/lib/export";
import { attachmentDisposition } from "@/lib/safe-href";

export function GET() {
  return new Response(connectionsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentDisposition(
        "alltikerfi-connections",
        "csv",
      ),
    },
  });
}
