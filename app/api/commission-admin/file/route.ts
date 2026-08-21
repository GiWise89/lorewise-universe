import { requireCommissionAdminApi } from "@/lib/commissionAdminAuth";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

export async function GET(request: Request) {
  const auth = await requireCommissionAdminApi();
  if (auth.response) return auth.response;
  const { env } = await import("cloudflare:workers");
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return new Response("Archivio non disponibile.", { status: 503 });

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  const file = await runtime.DB.prepare("SELECT object_key, original_name, content_type FROM commission_request_files WHERE id = ?").bind(id).first<{
    object_key: string;
    original_name: string;
    content_type: string;
  }>();
  if (!file) return new Response("Allegato non trovato.", { status: 404 });
  const object = await runtime.COMMISSION_UPLOADS.get(file.object_key);
  if (!object) return new Response("Allegato non trovato.", { status: 404 });

  const safeName = file.original_name.replace(/["\r\n]/g, "-");
  return new Response(object.body, {
    headers: {
      "Content-Type": file.content_type,
      "Content-Length": String(object.size),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
