import { entryExport } from "@/lib/export";
import { attachmentDisposition } from "@/lib/safe-href";

type Params = { slug: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const payload = entryExport(slug);
  if (!payload) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": attachmentDisposition(slug, "json"),
    },
  });
}
