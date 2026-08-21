import { requireVipAccess } from "@/lib/vipAccess";
import { createVipDownloadArchive, getVipDownloadPackage } from "@/lib/vipDownloads";
import { getVipDownload } from "@/lib/vipZone";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, noarchive",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const downloadPackage = getVipDownloadPackage(url.searchParams.get("package"));
    if (!downloadPackage) return Response.json({ error: "Pacchetto VIP non valido." }, { status: 404, headers: privateHeaders });
    const access = await requireVipAccess();
    if ("error" in access) return access.error;
    const bucket = access.runtime.COMMISSION_UPLOADS;
    if (!bucket) return Response.json({ error: "Archivio download VIP non disponibile." }, { status: 503, headers: privateHeaders });

    const sourceFiles = new Map<string, Uint8Array>();
    for (const source of downloadPackage.sources) {
      const media = getVipDownload(source.mediaId);
      if (!media) return Response.json({ error: "Un contenuto del pacchetto non è autorizzato al download." }, { status: 409, headers: privateHeaders });
      const object = await bucket.get(media.objectKey);
      if (!object) return Response.json({ error: `Il contenuto ${source.mediaId} non è ancora disponibile nell'archivio privato.` }, { status: 404, headers: privateHeaders });
      sourceFiles.set(source.mediaId, new Uint8Array(await object.arrayBuffer()));
    }

    const { archive } = await createVipDownloadArchive(downloadPackage, sourceFiles);
    return new Response(archive, { headers: {
      ...privateHeaders,
      "Content-Type": "application/zip",
      "Content-Length": String(archive.byteLength),
      "Content-Disposition": `attachment; filename="${downloadPackage.downloadName}"`,
      "X-LoreWise-Package": downloadPackage.id,
      "X-LoreWise-Package-Version": downloadPackage.version,
    } });
  } catch {
    return Response.json({ error: "Non è stato possibile preparare il pacchetto VIP." }, { status: 503, headers: privateHeaders });
  }
}
