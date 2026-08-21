import { requireVipAccess } from "@/lib/vipAccess";
import { getVipMedia } from "@/lib/vipZone";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const media = getVipMedia(url.searchParams.get("asset"));
    if (!media) return Response.json({ error: "Risorsa VIP non valida." }, { status: 404 });
    const wantsDownload = url.searchParams.get("download") === "1";
    if (wantsDownload && !("downloadName" in media)) {
      return Response.json({ error: "Questa risorsa non è disponibile per il download." }, { status: 400 });
    }

    const access = await requireVipAccess({ prepareCommerce: false });
    if ("error" in access) return access.error;
    if (!access.runtime.COMMISSION_UPLOADS) {
      return Response.json({ error: "Archivio immagini VIP non disponibile." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
    }

    const object = await access.runtime.COMMISSION_UPLOADS.get(media.objectKey);
    if (!object) return Response.json({ error: "Immagine VIP non ancora archiviata." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });

    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? media.contentType,
        "Content-Length": String(object.size),
        "Cache-Control": wantsDownload ? "private, no-store" : "private, max-age=3600, stale-while-revalidate=300",
        "Content-Disposition": wantsDownload && "downloadName" in media
          ? `attachment; filename="${media.downloadName}"`
          : "inline",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, noimageindex, noarchive",
      },
    });
  } catch {
    return Response.json({ error: "Non è stato possibile autorizzare l’immagine VIP." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
