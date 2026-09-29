import { catalogExport } from "@/lib/export";
import { attachmentDisposition } from "@/lib/safe-href";

export function GET() {
  return new Response(JSON.stringify(catalogExport(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": attachmentDisposition("alltikerfi-catalog", "json"),
    },
  });
}
