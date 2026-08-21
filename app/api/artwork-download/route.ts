import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { getAutomaticArtworkDelivery } from "@/lib/automaticArtworkDelivery";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

type DeliveryRow = {
  entitlement_id: string;
  download_limit: number | null;
  download_count: number;
  object_key: string | null;
  filename: string | null;
  content_type: string | null;
  expected_size: number | null;
  sha256: string | null;
  delivery_status: string | null;
};

function downloadError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  try {
    const user = await getLoreWiseUser();
    if (!user?.email) return downloadError("Accedi al tuo LoreWise ID per scaricare il file.", 401);

    const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
    if (!/^LW-(?:VIP-)?ART-\d{3}$/.test(code)) return downloadError("Codice opera non valido.", 400);

    const runtime = env as unknown as RuntimeEnv;
    if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return downloadError("Archivio privato non disponibile.", 503);

    await syncLoreWiseCustomer(user);
    await ensureCommerceTables(runtime.DB);
    const customer = await runtime.DB.prepare("SELECT status FROM customers WHERE id = ?")
      .bind(user.id).first<{ status: string }>();
    if (!customer || customer.status !== "active") return downloadError("Questo account non può scaricare file.", 403);

    const delivery = await runtime.DB.prepare(`SELECT entitlements.id AS entitlement_id,
      entitlements.download_limit, entitlements.download_count, artwork_delivery_files.object_key,
      artwork_delivery_files.filename, artwork_delivery_files.content_type,
      artwork_delivery_files.size AS expected_size, artwork_delivery_files.sha256,
      artwork_delivery_files.status AS delivery_status
      FROM entitlements
      LEFT JOIN order_items ON order_items.id = entitlements.order_item_id
      LEFT JOIN orders ON orders.id = order_items.order_id
      LEFT JOIN artwork_delivery_files ON artwork_delivery_files.artwork_code = entitlements.resource_code
      WHERE entitlements.customer_id = ? AND entitlements.resource_type IN ('artwork', 'art', 'license')
        AND entitlements.resource_code = ? AND entitlements.status = 'active'
        AND (orders.status = 'paid' OR entitlements.order_item_id IS NULL)
        AND (entitlements.expires_at IS NULL OR datetime(entitlements.expires_at) > CURRENT_TIMESTAMP)
      ORDER BY entitlements.created_at DESC LIMIT 1`)
      .bind(user.id, code).first<DeliveryRow>();

    if (!delivery) return downloadError("Non possiedi una licenza attiva per quest'opera.", 403);

    if (delivery.download_limit !== null && delivery.download_count >= delivery.download_limit) {
      return downloadError("Hai utilizzato tutti i download disponibili per questa licenza.", 429);
    }

    const automatic = getAutomaticArtworkDelivery(code);
    let selected = automatic ? {
      objectKey: automatic.objectKey,
      filename: automatic.filename,
      contentType: automatic.contentType,
      expectedSize: automatic.size,
      sha256: automatic.sha256,
      automatic: true,
    } : null;
    let object = selected ? await runtime.COMMISSION_UPLOADS.get(selected.objectKey) : null;
    if (object && selected?.automatic && (
      object.size !== selected.expectedSize
      || object.customMetadata?.sha256?.toLowerCase() !== selected.sha256
    )) return downloadError("Il pacchetto automatico non ha superato il controllo di integrità.", 503);

    if (!object && delivery.delivery_status === "approved" && delivery.object_key && delivery.filename
      && delivery.content_type && delivery.expected_size !== null && delivery.sha256) {
      selected = {
        objectKey: delivery.object_key,
        filename: delivery.filename,
        contentType: delivery.content_type,
        expectedSize: delivery.expected_size,
        sha256: delivery.sha256,
        automatic: false,
      };
      object = await runtime.COMMISSION_UPLOADS.get(selected.objectKey);
    }
    if (!selected || !object || object.size !== selected.expectedSize) {
      return downloadError("Il pacchetto non è disponibile in modo sicuro. Nessun download è stato conteggiato.", 503);
    }

    const update = await runtime.DB.prepare(`UPDATE entitlements SET download_count = download_count + 1
      WHERE id = ? AND status = 'active'
        AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP)
        AND (download_limit IS NULL OR download_count < download_limit)`)
      .bind(delivery.entitlement_id).run();
    if (!update.meta.changes) return downloadError("Il limite di download è stato raggiunto.", 429);

    const used = delivery.download_count + 1;
    const remaining = delivery.download_limit === null ? "unlimited" : String(Math.max(0, delivery.download_limit - used));
    const safeName = selected.filename.replace(/["\r\n\\/]/g, "-");
    return new Response(object.body, {
      headers: {
        "Content-Type": selected.contentType,
        "Content-Length": String(object.size),
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Download-Options": "noopen",
        "X-LoreWise-Download-Remaining": remaining,
        "X-LoreWise-File-SHA256": selected.sha256,
        "X-LoreWise-Automatic-Package": selected.automatic ? "1" : "0",
      },
    });
  } catch {
    return downloadError("Non è stato possibile autorizzare il download.", 503);
  }
}
