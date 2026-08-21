import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { automaticArtworkDeliveryReady, getAutomaticArtworkDelivery } from "@/lib/automaticArtworkDelivery";
import { commercialOriginalArtworks } from "@/lib/artCatalog";
import { resolveArtworkProduct } from "@/lib/commercialCatalog";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

async function requireDeliveryAdmin() {
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
    return { error: Response.json({ error: "Accesso riservato all’amministratore LoreWise." }, { status: 403 }) };
  }
  return { runtime, userId: data.user.id };
}

export async function GET() {
  try {
    const auth = await requireDeliveryAdmin();
    if ("error" in auth) return auth.error;
    const rows = await auth.runtime.DB!.prepare(`SELECT artwork_code, filename, content_type, size, sha256,
      status, approved_at, created_at, updated_at FROM artwork_delivery_files ORDER BY artwork_code`).all<{
      artwork_code: string; filename: string; content_type: string; size: number; sha256: string;
      status: string; approved_at: string | null; created_at: string; updated_at: string;
    }>();
    const artworks = [];
    for (const artwork of commercialOriginalArtworks) {
      const automatic = getAutomaticArtworkDelivery(artwork.code);
      const ready = automatic
        ? await automaticArtworkDeliveryReady(auth.runtime.COMMISSION_UPLOADS!, artwork.code)
        : false;
      artworks.push({
        code: artwork.code, title: artwork.title ?? artwork.code, image: artwork.image,
        priceLabel: artwork.priceLabel, tierLabel: artwork.priceTierLabel,
        automaticDelivery: automatic ? {
          filename: automatic.filename, size: automatic.size, sha256: automatic.sha256,
          status: ready ? "ready" : "cataloged",
        } : null,
      });
    }
    return Response.json({ artworks, deliveries: rows.results.map((row) => ({
      artworkCode: row.artwork_code, filename: row.filename, contentType: row.content_type, size: Number(row.size),
      sha256: row.sha256, status: row.status, approvedAt: row.approved_at,
      createdAt: row.created_at, updatedAt: row.updated_at,
    })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile aprire il registro consegne." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireDeliveryAdmin();
    if ("error" in auth) return auth.error;
    const form = await request.formData();
    const artworkCode = typeof form.get("artworkCode") === "string" ? String(form.get("artworkCode")).trim().toUpperCase() : "";
    const file = form.get("package");
    if (!resolveArtworkProduct(artworkCode)) return Response.json({ error: "L’opera non è autorizzata alla vendita." }, { status: 400 });
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".zip")) {
      return Response.json({ error: "Seleziona un pacchetto ZIP valido." }, { status: 400 });
    }
    if (file.size < 100 || file.size > 50 * 1024 * 1024) {
      return Response.json({ error: "Il pacchetto deve essere compreso tra 100 byte e 50 MB." }, { status: 413 });
    }
    const bytes = await file.arrayBuffer();
    const signature = new Uint8Array(bytes.slice(0, 4));
    if (signature[0] !== 0x50 || signature[1] !== 0x4b || ![0x03, 0x05, 0x07].includes(signature[2])) {
      return Response.json({ error: "Il contenuto non corrisponde a un archivio ZIP." }, { status: 400 });
    }
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
    const safeName = `${artworkCode}-pacchetto-${sha256.slice(0, 10)}.zip`;
    const objectKey = `art-deliveries/${artworkCode.toLowerCase()}/${safeName}`;
    const previous = await auth.runtime.DB!.prepare("SELECT object_key FROM artwork_delivery_files WHERE artwork_code = ?")
      .bind(artworkCode).first<{ object_key: string }>();

    await auth.runtime.COMMISSION_UPLOADS!.put(objectKey, bytes, {
      httpMetadata: { contentType: "application/zip" },
      customMetadata: { artworkCode, sha256, visibility: "private", uploadedBy: auth.userId },
    });
    await auth.runtime.DB!.prepare(`INSERT INTO artwork_delivery_files
      (id, artwork_code, object_key, filename, content_type, size, sha256, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'application/zip', ?, ?, 'qa_pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(artwork_code) DO UPDATE SET object_key = excluded.object_key, filename = excluded.filename,
        content_type = excluded.content_type, size = excluded.size, sha256 = excluded.sha256,
        status = 'qa_pending', approved_by = NULL, approved_at = NULL, updated_at = CURRENT_TIMESTAMP`)
      .bind(crypto.randomUUID(), artworkCode, objectKey, safeName, file.size, sha256).run();
    if (previous?.object_key && previous.object_key !== objectKey) await auth.runtime.COMMISSION_UPLOADS!.delete(previous.object_key);

    return Response.json({ message: `${artworkCode} è stato archiviato ed è in attesa del controllo qualità.`, artworkCode, filename: safeName, size: file.size, sha256 }, { status: 201 });
  } catch {
    return Response.json({ error: "Caricamento del pacchetto non completato." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireDeliveryAdmin();
    if ("error" in auth) return auth.error;
    const body = await request.json().catch(() => null) as {
      artworkCode?: unknown; sha256?: unknown; masterIdentical?: unknown;
      manifestVerified?: unknown; certificateSeparate?: unknown;
    } | null;
    const artworkCode = typeof body?.artworkCode === "string" ? body.artworkCode.trim().toUpperCase() : "";
    const expectedSha256 = typeof body?.sha256 === "string" ? body.sha256.trim().toLowerCase() : "";
    if (!resolveArtworkProduct(artworkCode) || !/^[a-f0-9]{64}$/.test(expectedSha256)) {
      return Response.json({ error: "Dati di approvazione non validi." }, { status: 400 });
    }
    if (body?.masterIdentical !== true || body.manifestVerified !== true || body.certificateSeparate !== true) {
      return Response.json({ error: "Completa tutti i controlli qualità prima dell’approvazione." }, { status: 400 });
    }
    const delivery = await auth.runtime.DB!.prepare(`SELECT object_key, size, sha256, status
      FROM artwork_delivery_files WHERE artwork_code = ? LIMIT 1`).bind(artworkCode).first<{
        object_key: string; size: number; sha256: string; status: string;
      }>();
    if (!delivery || delivery.status !== "qa_pending" || delivery.sha256.toLowerCase() !== expectedSha256) {
      return Response.json({ error: "Il pacchetto in quarantena non corrisponde al controllo richiesto." }, { status: 409 });
    }
    const object = await auth.runtime.COMMISSION_UPLOADS!.get(delivery.object_key);
    if (!object || object.size !== Number(delivery.size)) {
      return Response.json({ error: "Il file privato non corrisponde al registro. Approvazione annullata." }, { status: 409 });
    }
    const bytes = await object.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const actualSha256 = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
    if (actualSha256 !== expectedSha256) {
      return Response.json({ error: "Il controllo SHA-256 del file privato non è riuscito." }, { status: 409 });
    }
    const update = await auth.runtime.DB!.prepare(`UPDATE artwork_delivery_files SET status = 'approved',
      approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE artwork_code = ? AND status = 'qa_pending' AND sha256 = ?`)
      .bind(auth.userId, artworkCode, expectedSha256).run();
    if (!update.meta.changes) return Response.json({ error: "Il pacchetto non è più approvabile nello stato corrente." }, { status: 409 });
    return Response.json({ message: `${artworkCode} ha superato il controllo qualità ed è approvato.`, artworkCode, sha256: actualSha256 });
  } catch {
    return Response.json({ error: "Approvazione del pacchetto non completata." }, { status: 503 });
  }
}
