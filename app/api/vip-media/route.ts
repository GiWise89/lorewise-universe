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
    const localMediaUrl = process.env.LOREWISE_LOCAL_VIP_MEDIA_URL?.trim();
    if (!access.runtime.COMMISSION_UPLOADS && !localMediaUrl) {
      return Response.json({ error: "Archivio immagini VIP non disponibile." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
    }

    let object: Awaited<ReturnType<R2Bucket["get"]>> = null;
    if (access.runtime.COMMISSION_UPLOADS) {
      try {
        object = await access.runtime.COMMISSION_UPLOADS.get(media.objectKey);
      } catch (reason) {
        if (process.env.NETLIFY === "true" || !localMediaUrl) throw reason;
      }
    }
    if (!object && process.env.NETLIFY !== "true" && localMediaUrl) {
      const localResponse = await fetch(`${localMediaUrl}?key=${encodeURIComponent(media.objectKey)}`, { cache: "no-store" });
      if (localResponse.ok && localResponse.body) {
        object = {
          body: localResponse.body,
          size: Number(localResponse.headers.get("content-length") || 0),
          httpMetadata: { contentType: localResponse.headers.get("content-type") ?? media.contentType },
        } as Awaited<ReturnType<R2Bucket["get"]>>;
      }
    }
    if (!object) return Response.json({ error: "Immagine VIP non ancora archiviata." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });

    const headers = new Headers({
      "Content-Type": object.httpMetadata?.contentType ?? media.contentType,
      "Cache-Control": wantsDownload ? "private, no-store" : "private, max-age=3600, stale-while-revalidate=300",
      "Content-Disposition": wantsDownload && "downloadName" in media
        ? `attachment; filename="${media.downloadName}"`
        : "inline",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noimageindex, noarchive",
    });
    // Netlify Blobs can stream objects imported before LoreWise started saving
    // supplemental size metadata. A false Content-Length: 0 makes browsers
    // discard that valid stream, so only advertise a length when it is known.
    if (Number.isFinite(object.size) && object.size > 0) {
      headers.set("Content-Length", String(object.size));
    }

    return new Response(object.body, {
      headers,
    });
  } catch {
    return Response.json({ error: "Non è stato possibile autorizzare l’immagine VIP." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
