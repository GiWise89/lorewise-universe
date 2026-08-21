import { env } from "@/lib/netlifyRuntime";

import { getCommercialProductDraft } from "@/lib/commercialCatalog";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES, GAME_INSTALLER_MIN_BYTES, gameInstallerUploadPolicy, verifiedWindowsInstaller } from "@/lib/gameDeliveryPolicy";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

const PRODUCT_CODE = "GS-GAME-001-WIN";
const GAME_CODE = "GS-GAME-001";
const PLATFORM = "windows-x64";

type ExistingUploadReceipt = {
  action?: unknown;
  productCode?: unknown;
  gameCode?: unknown;
  platform?: unknown;
  version?: unknown;
  objectKey?: unknown;
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
  sha256?: unknown;
  remoteVerified?: unknown;
};

function exactReceipt(body: ExistingUploadReceipt | null) {
  if (!body || body.action !== "register_existing" || body.remoteVerified !== true) return null;
  const sha256 = typeof body.sha256 === "string" ? body.sha256.trim().toUpperCase() : "";
  if (
    body.productCode !== verifiedWindowsInstaller.productCode ||
    body.gameCode !== verifiedWindowsInstaller.gameCode ||
    body.platform !== verifiedWindowsInstaller.platform ||
    body.version !== verifiedWindowsInstaller.version ||
    body.objectKey !== verifiedWindowsInstaller.objectKey ||
    body.filename !== verifiedWindowsInstaller.filename ||
    body.contentType !== verifiedWindowsInstaller.contentType ||
    body.size !== verifiedWindowsInstaller.size ||
    sha256 !== verifiedWindowsInstaller.sha256
  ) return null;
  return { sha256 };
}

async function requireGameDeliveryAdmin() {
  const client = await createLoreWiseServerClient();
  if (!client) return { error: Response.json({ error: "Accesso non configurato." }, { status: 503 }) };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) return { error: Response.json({ error: "Sessione amministratore non valida." }, { status: 401 }) };
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return { error: Response.json({ error: "Archivio privato non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(data.user);
  await ensureCommerceTables(runtime.DB);
  const customer = await runtime.DB.prepare("SELECT role, status FROM customers WHERE id = ?").bind(data.user.id)
    .first<{ role: string; status: string }>();
  if (!customer || customer.role !== "admin" || customer.status !== "active") {
    return { error: Response.json({ error: "Accesso riservato all'amministratore LoreWise." }, { status: 403 }) };
  }
  return { runtime, userId: data.user.id };
}

export async function GET() {
  try {
    const auth = await requireGameDeliveryAdmin();
    if ("error" in auth) return auth.error;
    const row = await auth.runtime.DB!.prepare(`SELECT product_code, game_code, platform, version, filename,
      content_type, size, sha256, signature_status, scan_status, install_test_status, update_test_status,
      status, approved_at, created_at, updated_at FROM game_delivery_files WHERE product_code = ? LIMIT 1`)
      .bind(PRODUCT_CODE).first<Record<string, string | number | null>>();
    const draft = getCommercialProductDraft(PRODUCT_CODE);
    return Response.json({
      product: draft ? { code: draft.code, title: draft.title, amountCents: draft.amountCents, currency: draft.currency } : null,
      uploadPolicy: gameInstallerUploadPolicy,
      delivery: row ? {
        productCode: row.product_code, gameCode: row.game_code, platform: row.platform, version: row.version,
        filename: row.filename, contentType: row.content_type, size: Number(row.size), sha256: row.sha256,
        signatureStatus: row.signature_status, scanStatus: row.scan_status,
        installTestStatus: row.install_test_status, updateTestStatus: row.update_test_status,
        status: row.status, approvedAt: row.approved_at, createdAt: row.created_at, updatedAt: row.updated_at,
      } : null,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile aprire l'archivio Windows." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireGameDeliveryAdmin();
    if ("error" in auth) return auth.error;
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json().catch(() => null) as ExistingUploadReceipt | null;
      const verified = exactReceipt(body);
      if (!verified) {
        return Response.json({ error: "La ricevuta non corrisponde all'installer Windows verificato." }, { status: 400 });
      }
      const object = await auth.runtime.COMMISSION_UPLOADS!.head(verifiedWindowsInstaller.objectKey);
      const remoteSha256 = object?.customMetadata?.sha256?.toUpperCase() ?? "";
      if (!object || object.size !== verifiedWindowsInstaller.size || remoteSha256 !== verified.sha256) {
        return Response.json({ error: "Il file nel deposito privato non corrisponde a dimensione e impronta attese." }, { status: 409 });
      }
      const previous = await auth.runtime.DB!.prepare("SELECT object_key FROM game_delivery_files WHERE product_code = ?")
        .bind(PRODUCT_CODE).first<{ object_key: string }>();
      await auth.runtime.DB!.prepare(`INSERT INTO game_delivery_files
        (id, product_code, game_code, platform, version, object_key, filename, content_type, size, sha256,
         signature_status, scan_status, install_test_status, update_test_status, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
         'unchecked', 'unchecked', 'unchecked', 'unchecked', 'qa_pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(product_code) DO UPDATE SET version = excluded.version, object_key = excluded.object_key,
          filename = excluded.filename, content_type = excluded.content_type, size = excluded.size, sha256 = excluded.sha256,
          signature_status = 'unchecked', scan_status = 'unchecked', install_test_status = 'unchecked',
          update_test_status = 'unchecked', status = 'qa_pending', approved_by = NULL, approved_at = NULL,
          updated_at = CURRENT_TIMESTAMP`)
        .bind(crypto.randomUUID(), PRODUCT_CODE, GAME_CODE, PLATFORM, verifiedWindowsInstaller.version,
          verifiedWindowsInstaller.objectKey, verifiedWindowsInstaller.filename, verifiedWindowsInstaller.contentType,
          verifiedWindowsInstaller.size, verified.sha256.toLowerCase()).run();
      if (previous?.object_key && previous.object_key !== verifiedWindowsInstaller.objectKey) {
        await auth.runtime.COMMISSION_UPLOADS!.delete(previous.object_key);
      }
      return Response.json({
        message: `Installer ${verifiedWindowsInstaller.version} registrato in quarantena dal deposito privato. Nessun acquisto o download è stato attivato.`,
        sha256: verified.sha256.toLowerCase(),
        filename: verifiedWindowsInstaller.filename,
      }, { status: 201 });
    }
    const form = await request.formData();
    const version = typeof form.get("version") === "string" ? String(form.get("version")).trim() : "";
    const file = form.get("installer");
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
      return Response.json({ error: "Inserisci una versione valida, per esempio 1.0.0." }, { status: 400 });
    }
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".exe")) {
      return Response.json({ error: "Seleziona l'installer Windows in formato EXE." }, { status: 400 });
    }
    if (file.size < GAME_INSTALLER_MIN_BYTES || file.size > GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES) {
      return Response.json({ error: `Il caricamento diretto accetta installer compresi tra 1 MB e ${gameInstallerUploadPolicy.directUploadMaxLabel}. Il file non è stato trasferito.` }, { status: 413 });
    }
    const bytes = await file.arrayBuffer();
    const signature = new Uint8Array(bytes.slice(0, 2));
    if (signature[0] !== 0x4d || signature[1] !== 0x5a) {
      return Response.json({ error: "Il contenuto non corrisponde a un eseguibile Windows valido." }, { status: 400 });
    }
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
    const safeName = `The-Wound-Remembers-Setup-${version}-${sha256.slice(0, 10)}.exe`;
    const objectKey = `game-deliveries/${GAME_CODE.toLowerCase()}/${PLATFORM}/${safeName}`;
    const previous = await auth.runtime.DB!.prepare("SELECT object_key FROM game_delivery_files WHERE product_code = ?")
      .bind(PRODUCT_CODE).first<{ object_key: string }>();

    await auth.runtime.COMMISSION_UPLOADS!.put(objectKey, bytes, {
      httpMetadata: { contentType: "application/vnd.microsoft.portable-executable" },
      customMetadata: { productCode: PRODUCT_CODE, gameCode: GAME_CODE, platform: PLATFORM, version, sha256, visibility: "private", uploadedBy: auth.userId },
    });
    await auth.runtime.DB!.prepare(`INSERT INTO game_delivery_files
      (id, product_code, game_code, platform, version, object_key, filename, content_type, size, sha256,
       signature_status, scan_status, install_test_status, update_test_status, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'application/vnd.microsoft.portable-executable', ?, ?,
       'unchecked', 'unchecked', 'unchecked', 'unchecked', 'qa_pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(product_code) DO UPDATE SET version = excluded.version, object_key = excluded.object_key,
        filename = excluded.filename, content_type = excluded.content_type, size = excluded.size, sha256 = excluded.sha256,
        signature_status = 'unchecked', scan_status = 'unchecked', install_test_status = 'unchecked',
        update_test_status = 'unchecked', status = 'qa_pending', approved_by = NULL, approved_at = NULL,
        updated_at = CURRENT_TIMESTAMP`)
      .bind(crypto.randomUUID(), PRODUCT_CODE, GAME_CODE, PLATFORM, version, objectKey, safeName, file.size, sha256).run();
    if (previous?.object_key && previous.object_key !== objectKey) await auth.runtime.COMMISSION_UPLOADS!.delete(previous.object_key);
    return Response.json({ message: `Installer ${version} archiviato in quarantena. Nessun acquisto o download è stato attivato.`, sha256, filename: safeName }, { status: 201 });
  } catch {
    return Response.json({ error: "Caricamento dell'installer non completato." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireGameDeliveryAdmin();
    if ("error" in auth) return auth.error;
    const body = await request.json().catch(() => null) as {
      sha256?: unknown; unsignedDistributionAccepted?: unknown; scanPassed?: unknown;
      installPassed?: unknown; updatePlanAccepted?: unknown;
    } | null;
    const expectedSha256 = typeof body?.sha256 === "string" ? body.sha256.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(expectedSha256)) return Response.json({ error: "Impronta SHA-256 non valida." }, { status: 400 });
    if (body?.unsignedDistributionAccepted !== true || body.scanPassed !== true || body.installPassed !== true || body.updatePlanAccepted !== true) {
      return Response.json({ error: "Trasparenza sulla firma, scansione, installazione e piano di aggiornamento devono essere confermati." }, { status: 400 });
    }
    const delivery = await auth.runtime.DB!.prepare(`SELECT object_key, size, sha256, status FROM game_delivery_files
      WHERE product_code = ? LIMIT 1`).bind(PRODUCT_CODE).first<{ object_key: string; size: number; sha256: string; status: string }>();
    if (!delivery || delivery.status !== "qa_pending" || delivery.sha256.toLowerCase() !== expectedSha256) {
      return Response.json({ error: "L'installer in quarantena non corrisponde al controllo richiesto." }, { status: 409 });
    }
    const object = await auth.runtime.COMMISSION_UPLOADS!.head(delivery.object_key);
    const actualSha256 = object?.customMetadata?.sha256?.toLowerCase() ?? "";
    if (!object || object.size !== Number(delivery.size)) return Response.json({ error: "Il file privato non corrisponde al registro." }, { status: 409 });
    if (actualSha256 !== expectedSha256) return Response.json({ error: "Il controllo SHA-256 dell'installer non è riuscito." }, { status: 409 });
    const update = await auth.runtime.DB!.prepare(`UPDATE game_delivery_files SET signature_status = 'unsigned_disclosed',
      scan_status = 'passed', install_test_status = 'passed', update_test_status = 'deferred_first_release', status = 'approved',
      approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE product_code = ? AND status = 'qa_pending' AND sha256 = ?`)
      .bind(auth.userId, PRODUCT_CODE, expectedSha256).run();
    if (!update.meta.changes) return Response.json({ error: "L'installer non è più approvabile nello stato corrente." }, { status: 409 });
    return Response.json({ message: "L'edizione Windows indipendente ha superato il controllo qualità ed è pronta per il collaudo commerciale.", sha256: actualSha256 });
  } catch {
    return Response.json({ error: "Approvazione dell'installer non completata." }, { status: 503 });
  }
}
