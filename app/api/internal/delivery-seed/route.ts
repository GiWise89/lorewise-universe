import { env } from "@/lib/netlifyRuntime";

import { getAutomaticArtworkDelivery } from "@/lib/automaticArtworkDelivery";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { verifiedWindowsInstaller } from "@/lib/gameDeliveryPolicy";
import { VIP_WALLPAPERS_PRIVATE } from "@/data/vip-downloads";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket; LOREWISE_DELIVERY_SEED_TOKEN?: string };

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function authorized(request: Request) {
  const runtime = env as unknown as RuntimeEnv;
  const expected = runtime.LOREWISE_DELIVERY_SEED_TOKEN?.trim() ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  return expected && supplied && secureEqual(expected, supplied) && runtime.COMMISSION_UPLOADS ? runtime : null;
}

function unavailable() {
  return Response.json({ error: "Canale di caricamento non disponibile." }, { status: 404 });
}

async function sha256(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function registerExistingGame(runtime: RuntimeEnv) {
  const file = await runtime.COMMISSION_UPLOADS!.head(verifiedWindowsInstaller.objectKey);
  const hash = file?.customMetadata?.sha256?.toUpperCase() ?? "";
  if (!file || file.size !== verifiedWindowsInstaller.size || hash !== verifiedWindowsInstaller.sha256)
    return Response.json({ error: "Installer privato non corrispondente." }, { status: 409 });
  if (!runtime.DB) return Response.json({ error: "Registro non disponibile." }, { status: 503 });
  await ensureCommerceTables(runtime.DB);
  await runtime.DB.prepare(`INSERT INTO game_delivery_files
    (id,product_code,game_code,platform,version,object_key,filename,content_type,size,sha256,
     signature_status,scan_status,install_test_status,update_test_status,status,approved_by,approved_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,'unsigned_disclosed','passed','passed','deferred_first_release','approved',
     NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(product_code) DO UPDATE SET version=excluded.version,object_key=excluded.object_key,
     filename=excluded.filename,content_type=excluded.content_type,size=excluded.size,sha256=excluded.sha256,
     signature_status=excluded.signature_status,scan_status=excluded.scan_status,
     install_test_status=excluded.install_test_status,update_test_status=excluded.update_test_status,
     status=excluded.status,approved_by=NULL,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`)
    .bind(crypto.randomUUID(),verifiedWindowsInstaller.productCode,verifiedWindowsInstaller.gameCode,
      verifiedWindowsInstaller.platform,verifiedWindowsInstaller.version,verifiedWindowsInstaller.objectKey,
      verifiedWindowsInstaller.filename,verifiedWindowsInstaller.contentType,verifiedWindowsInstaller.size,
      verifiedWindowsInstaller.sha256.toLowerCase()).run();
  return Response.json({ code: verifiedWindowsInstaller.productCode, ready: true, deliveryMode: "automatic" });
}

export async function PUT(request: Request) {
  const runtime = await authorized(request);
  if (!runtime) return unavailable();
  const kind = request.headers.get("x-lorewise-delivery-kind")?.trim();
  const bytes = await request.arrayBuffer();

  if (kind === "artwork") {
    const code = request.headers.get("x-lorewise-code")?.trim().toUpperCase() ?? "";
    const delivery = getAutomaticArtworkDelivery(code);
    if (!delivery || bytes.byteLength !== delivery.size || bytes.byteLength > 50 * 1024 * 1024) {
      return Response.json({ error: "Pacchetto opera non valido." }, { status: 400 });
    }
    if (await sha256(bytes) !== delivery.sha256.toUpperCase()) {
      return Response.json({ error: "Integrita del pacchetto non valida." }, { status: 409 });
    }
    const signature = new Uint8Array(bytes.slice(0, 3));
    if (signature[0] !== 0x50 || signature[1] !== 0x4b || ![0x03, 0x05, 0x07].includes(signature[2])) {
      return Response.json({ error: "Archivio ZIP non valido." }, { status: 400 });
    }
    await runtime.COMMISSION_UPLOADS!.put(delivery.objectKey, bytes, {
      httpMetadata: { contentType: delivery.contentType, contentDisposition: `attachment; filename="${delivery.filename}"` },
      customMetadata: { artworkCode: delivery.code, sha256: delivery.sha256, visibility: "private" },
    });
    const stored = await runtime.COMMISSION_UPLOADS!.head(delivery.objectKey);
    const ready = Boolean(stored && stored.size === delivery.size && stored.customMetadata?.sha256 === delivery.sha256);
    return Response.json({ code: delivery.code, size: delivery.size, sha256: delivery.sha256, ready }, { status: ready ? 200 : 500 });
  }

  if (kind === "vip-wallpaper" || kind === "vip-wallpaper-preview") {
    const mediaId = request.headers.get("x-lorewise-media-id")?.trim() ?? "";
    const wallpaper = VIP_WALLPAPERS_PRIVATE.find((item) =>
      kind === "vip-wallpaper" ? item.mediaId === mediaId : item.previewId === mediaId
    );
    const suppliedSha256 = request.headers.get("x-lorewise-sha256")?.trim().toUpperCase() ?? "";
    if (!wallpaper || bytes.byteLength < 1 || bytes.byteLength > 32 * 1024 * 1024 || !/^[A-F0-9]{64}$/.test(suppliedSha256)) {
      return Response.json({ error: "Risorsa VIP non valida." }, { status: 400 });
    }
    const actualSha256 = await sha256(bytes);
    if (actualSha256 !== suppliedSha256) return Response.json({ error: "Integrita della risorsa VIP non valida." }, { status: 409 });
    const signature = new Uint8Array(bytes.slice(0, 12));
    const isPng = signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47;
    const isWebp = signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x46 &&
      signature[8] === 0x57 && signature[9] === 0x45 && signature[10] === 0x42 && signature[11] === 0x50;
    if ((kind === "vip-wallpaper" && !isPng) || (kind === "vip-wallpaper-preview" && !isWebp)) {
      return Response.json({ error: "Formato della risorsa VIP non valido." }, { status: 400 });
    }
    const objectKey = kind === "vip-wallpaper" ? wallpaper.originalKey : wallpaper.previewKey;
    const contentType = kind === "vip-wallpaper" ? "image/png" : "image/webp";
    await runtime.COMMISSION_UPLOADS!.put(objectKey, bytes, {
      httpMetadata: kind === "vip-wallpaper"
        ? { contentType, contentDisposition: `attachment; filename="${wallpaper.downloadName}"` }
        : { contentType },
      customMetadata: { mediaId, sha256: actualSha256, visibility: "private" },
    });
    const stored = await runtime.COMMISSION_UPLOADS!.head(objectKey);
    const ready = Boolean(stored && stored.size === bytes.byteLength && stored.customMetadata?.sha256 === actualSha256);
    return Response.json({ mediaId, size: bytes.byteLength, sha256: actualSha256, ready }, { status: ready ? 200 : 500 });
  }

  if (kind === "game-part") {
    const uploadId = request.headers.get("x-lorewise-upload-id")?.trim() ?? "";
    const partNumber = Number(request.headers.get("x-lorewise-part-number"));
    if (!uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000 || bytes.byteLength < 1 || bytes.byteLength > 16 * 1024 * 1024) {
      return Response.json({ error: "Blocco multipart non valido." }, { status: 400 });
    }
    const upload = runtime.COMMISSION_UPLOADS!.resumeMultipartUpload(verifiedWindowsInstaller.objectKey, uploadId);
    const uploaded = await upload.uploadPart(partNumber, bytes);
    return Response.json({ partNumber: uploaded.partNumber, etag: uploaded.etag });
  }
  return Response.json({ error: "Tipo di consegna non valido." }, { status: 400 });
}

export async function POST(request: Request) {
  const runtime = await authorized(request);
  if (!runtime) return unavailable();
  const body = await request.json().catch(() => null) as {
    action?: string; uploadId?: string; parts?: Array<{ partNumber: number; etag: string }>; size?: number; sha256?: string;
  } | null;

  if (body?.action === "register-existing-game") return registerExistingGame(runtime);

  if (body?.action === "create-game") {
    if (body.size !== verifiedWindowsInstaller.size || body.sha256?.toUpperCase() !== verifiedWindowsInstaller.sha256) {
      return Response.json({ error: "Installer non corrispondente alla ricevuta verificata." }, { status: 409 });
    }
    const upload = await runtime.COMMISSION_UPLOADS!.createMultipartUpload(verifiedWindowsInstaller.objectKey, {
      httpMetadata: { contentType: verifiedWindowsInstaller.contentType, contentDisposition: `attachment; filename="${verifiedWindowsInstaller.filename}"` },
      customMetadata: { productCode: verifiedWindowsInstaller.productCode, sha256: verifiedWindowsInstaller.sha256, visibility: "private" },
    });
    return Response.json({ uploadId: upload.uploadId, objectKey: upload.key });
  }
  if (body?.action === "complete-game") {
    if (!body.uploadId || !Array.isArray(body.parts) || !body.parts.length) return Response.json({ error: "Completamento non valido." }, { status: 400 });
    const upload = runtime.COMMISSION_UPLOADS!.resumeMultipartUpload(verifiedWindowsInstaller.objectKey, body.uploadId);
    await upload.complete(body.parts);
    const stored = await runtime.COMMISSION_UPLOADS!.head(verifiedWindowsInstaller.objectKey);
    const ready = Boolean(stored && stored.size === verifiedWindowsInstaller.size && stored.customMetadata?.sha256 === verifiedWindowsInstaller.sha256);
    if (ready && runtime.DB) {
      await ensureCommerceTables(runtime.DB);
      await runtime.DB.prepare(`INSERT INTO game_delivery_files
        (id, product_code, game_code, platform, version, object_key, filename, content_type, size, sha256,
         signature_status, scan_status, install_test_status, update_test_status, status, approved_by, approved_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unsigned_disclosed', 'unchecked', 'unchecked',
         'deferred_first_release', 'pending_review', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(product_code) DO UPDATE SET version = excluded.version, object_key = excluded.object_key,
          filename = excluded.filename, content_type = excluded.content_type, size = excluded.size, sha256 = excluded.sha256,
          signature_status = 'unsigned_disclosed', scan_status = 'unchecked', install_test_status = 'unchecked',
          update_test_status = 'deferred_first_release', status = 'pending_review', approved_by = NULL,
          approved_at = NULL, updated_at = CURRENT_TIMESTAMP`)
        .bind(crypto.randomUUID(), verifiedWindowsInstaller.productCode, verifiedWindowsInstaller.gameCode,
          verifiedWindowsInstaller.platform, verifiedWindowsInstaller.version, verifiedWindowsInstaller.objectKey,
          verifiedWindowsInstaller.filename, verifiedWindowsInstaller.contentType, verifiedWindowsInstaller.size,
          verifiedWindowsInstaller.sha256.toLowerCase()).run();
    }
    return Response.json({ code: verifiedWindowsInstaller.productCode, size: stored?.size ?? 0, ready }, { status: ready ? 200 : 500 });
  }
  if (body?.action === "abort-game" && body.uploadId) {
    const upload = runtime.COMMISSION_UPLOADS!.resumeMultipartUpload(verifiedWindowsInstaller.objectKey, body.uploadId);
    await upload.abort();
    return Response.json({ aborted: true });
  }
  return Response.json({ error: "Azione non valida." }, { status: 400 });
}
