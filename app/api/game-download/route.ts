import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };
type DeliveryRow = {
  entitlement_id: string; object_key: string; filename: string; content_type: string;
  expected_size: number; sha256: string; version: string; download_count: number;
  download_limit: number | null;
};

function downloadError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  try {
    const client = await createLoreWiseServerClient();
    if (!client) return downloadError("Accesso non configurato.", 503);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.email) return downloadError("Accedi al tuo LoreWise ID per scaricare il gioco.", 401);
    const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
    if (!/^GS-GAME-\d{3}-WIN$/.test(code)) return downloadError("Codice prodotto non valido.", 400);

    const runtime = env as unknown as RuntimeEnv;
    if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return downloadError("Archivio privato non disponibile.", 503);
    await syncLoreWiseCustomer(data.user);
    await ensureCommerceTables(runtime.DB);
    const customer = await runtime.DB.prepare("SELECT status FROM customers WHERE id = ?").bind(data.user.id)
      .first<{ status: string }>();
    if (!customer || customer.status !== "active") return downloadError("Questo account non può scaricare file.", 403);

    const delivery = await runtime.DB.prepare(`SELECT entitlements.id AS entitlement_id,
      entitlements.download_count, entitlements.download_limit, game_delivery_files.object_key, game_delivery_files.filename,
      game_delivery_files.content_type, game_delivery_files.size AS expected_size,
      game_delivery_files.sha256, game_delivery_files.version
      FROM entitlements
      INNER JOIN order_items ON order_items.id = entitlements.order_item_id
      INNER JOIN orders ON orders.id = order_items.order_id AND orders.status = 'paid'
      INNER JOIN game_delivery_files ON game_delivery_files.product_code = entitlements.resource_code
      WHERE entitlements.customer_id = ? AND entitlements.resource_type IN ('game', 'app', 'software')
        AND entitlements.resource_code = ? AND entitlements.status = 'active'
        AND game_delivery_files.status = 'approved'
        AND game_delivery_files.signature_status IN ('valid', 'unsigned_disclosed') AND game_delivery_files.scan_status = 'passed'
        AND game_delivery_files.install_test_status = 'passed'
        AND game_delivery_files.update_test_status IN ('passed', 'deferred_first_release')
        AND (entitlements.expires_at IS NULL OR datetime(entitlements.expires_at) > CURRENT_TIMESTAMP)
      ORDER BY entitlements.created_at DESC LIMIT 1`)
      .bind(data.user.id, code).first<DeliveryRow>();
    if (!delivery) {
      const entitlement = await runtime.DB.prepare(`SELECT entitlements.id FROM entitlements
        LEFT JOIN order_items ON order_items.id = entitlements.order_item_id
        LEFT JOIN orders ON orders.id = order_items.order_id
        WHERE entitlements.customer_id = ? AND entitlements.resource_type IN ('game', 'app', 'software')
          AND entitlements.resource_code = ? AND entitlements.status = 'active' AND orders.status = 'paid' LIMIT 1`)
        .bind(data.user.id, code).first<{ id: string }>();
      return entitlement
        ? downloadError("L'edizione Windows è ancora in controllo qualità.", 409)
        : downloadError("Non possiedi una licenza pagata per questo gioco.", 403);
    }
    if (delivery.download_limit !== null && delivery.download_count >= delivery.download_limit) {
      return downloadError("Hai utilizzato tutti i download disponibili per questa licenza.", 429);
    }
    const object = await runtime.COMMISSION_UPLOADS.get(delivery.object_key);
    if (!object || object.size !== delivery.expected_size) return downloadError("L'installer non è disponibile in modo sicuro.", 503);
    const update = await runtime.DB.prepare(`UPDATE entitlements SET download_count = download_count + 1
      WHERE id = ? AND status = 'active'
        AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP)
        AND (download_limit IS NULL OR download_count < download_limit)`)
      .bind(delivery.entitlement_id).run();
    if (!update.meta.changes) return downloadError("Il limite di download è stato raggiunto.", 429);
    const used = delivery.download_count + 1;
    const remaining = delivery.download_limit === null ? "unlimited" : String(Math.max(0, delivery.download_limit - used));
    const safeName = delivery.filename.replace(/["\r\n\\/]/g, "-");
    return new Response(object.body, { headers: {
      "Content-Type": delivery.content_type,
      "Content-Length": String(object.size),
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Download-Options": "noopen",
      "X-LoreWise-Download-Remaining": remaining,
      "X-LoreWise-Game-Version": delivery.version,
      "X-LoreWise-File-SHA256": delivery.sha256,
    } });
  } catch {
    return downloadError("Non è stato possibile autorizzare il download.", 503);
  }
}
