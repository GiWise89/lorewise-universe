import { env } from "@/lib/netlifyRuntime";

import { requireCommissionAdminApi } from "@/lib/commissionAdminAuth";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

export async function GET(request: Request) {
  const auth = await requireCommissionAdminApi();
  if (auth.response) return auth.response;
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
  // Solo le immagini ammesse si aprono nel browser; qualsiasi altro tipo viene scaricato.
  const previewable = ["image/jpeg", "image/png", "image/webp"].includes(file.content_type);
  return new Response(object.body, {
    headers: {
      "Content-Type": previewable ? file.content_type : "application/octet-stream",
      "Content-Length": String(object.size),
      "Content-Disposition": `${previewable ? "inline" : "attachment"}; filename="${safeName}"`,
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
