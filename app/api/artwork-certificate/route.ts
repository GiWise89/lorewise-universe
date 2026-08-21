import { catalogArtworks } from "@/lib/artCatalog";
import { automaticArtworkDeliveryReady } from "@/lib/automaticArtworkDelivery";
import { certificateLicenseId, createArtworkCertificatePdf } from "@/lib/artworkCertificate";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket; ASSETS?: { fetch(request: Request): Promise<Response> } };
type CertificateRow = {
  entitlement_id: string;
  entitlement_created_at: string;
  email: string;
  display_name: string | null;
  order_reference: string;
  paid_at: string;
  order_status: string;
  delivery_status: string | null;
  metadata_json: string | null;
};

function certificateError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function loadAsset(assets: NonNullable<RuntimeEnv["ASSETS"]>, request: Request, path: string) {
  const response = await assets.fetch(new Request(new URL(path, request.url), { headers: { accept: "image/*" } }));
  if (!response.ok) throw new Error(`Asset certificato non disponibile: ${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function GET(request: Request) {
  try {
    const user = await getLoreWiseUser();
    if (!user?.email) return certificateError("Accedi al tuo LoreWise ID per scaricare il certificato.", 401);

    const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
    if (!/^LW-ART-\d{3}$/.test(code)) return certificateError("Codice opera non valido.", 400);
    const artwork = catalogArtworks.find((item) => item.code === code && item.access === "commercial-original");
    if (!artwork?.title || !artwork.year) return certificateError("Opera commerciale non trovata.", 404);

    const { env } = await import("cloudflare:workers");
    const runtime = env as unknown as RuntimeEnv;
    if (!runtime.DB || !runtime.ASSETS) return certificateError("Archivio licenze non disponibile.", 503);
    await syncLoreWiseCustomer(user);
    await ensureCommerceTables(runtime.DB);

    const license = await runtime.DB.prepare(`SELECT entitlements.id AS entitlement_id,
      entitlements.created_at AS entitlement_created_at, customers.email, customers.display_name,
      orders.reference_code AS order_reference, orders.paid_at, orders.status AS order_status,
      artwork_delivery_files.status AS delivery_status, order_items.metadata_json
      FROM entitlements
      INNER JOIN customers ON customers.id = entitlements.customer_id
      INNER JOIN order_items ON order_items.id = entitlements.order_item_id
      INNER JOIN orders ON orders.id = order_items.order_id
      LEFT JOIN artwork_delivery_files ON artwork_delivery_files.artwork_code = entitlements.resource_code
      WHERE entitlements.customer_id = ? AND entitlements.resource_type IN ('artwork', 'art', 'license')
        AND entitlements.resource_code = ? AND entitlements.status = 'active'
        AND customers.status = 'active' AND orders.status = 'paid' AND orders.paid_at IS NOT NULL
        AND (entitlements.expires_at IS NULL OR datetime(entitlements.expires_at) > CURRENT_TIMESTAMP)
      ORDER BY entitlements.created_at DESC LIMIT 1`)
      .bind(user.id, code).first<CertificateRow>();

    const automaticDelivery = await automaticArtworkDeliveryReady(runtime.COMMISSION_UPLOADS, code);
    if (!license || (license.delivery_status !== "approved" && !automaticDelivery)) {
      return certificateError("Il certificato sara disponibile dopo la conferma dell'ordine e del pacchetto.", 409);
    }
    const orderMetadata = JSON.parse(license.metadata_json || "{}") as { licenseHolderName?: string; licenseHolderEmail?: string };
    const holderEmail = orderMetadata.licenseHolderEmail?.trim() || license.email;
    const holderName = orderMetadata.licenseHolderName?.trim() || license.display_name?.trim() || holderEmail;
    const issuedDate = new Date(license.paid_at || license.entitlement_created_at);
    const issuedAt = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Rome" }).format(issuedDate);
    const [logo, artworkPreview, seal] = await Promise.all([
      loadAsset(runtime.ASSETS, request, "/brand/lorewise-universe-logo-concept-c.png"),
      loadAsset(runtime.ASSETS, request, artwork.image),
      loadAsset(runtime.ASSETS, request, "/brand/lorewise-wax-seal-v1.png"),
    ]);
    const pdf = await createArtworkCertificatePdf({
      artworkCode: code,
      artworkTitle: artwork.title,
      artworkYear: artwork.year,
      editionLabel: artwork.priceTierLabel?.replace(/^Fascia /, "Edizione ") || "Edizione digitale",
      holderName,
      holderEmail,
      licenseId: certificateLicenseId(code, license.entitlement_id),
      orderReference: license.order_reference,
      issuedAt,
    }, { logo, artworkPreview, seal });
    const safeFilename = `${code}-certificato-${holderName}`.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-");
    const body = new Uint8Array(pdf).buffer;
    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(`${safeFilename}.pdf`)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Artwork certificate generation failed", error);
    return certificateError("Non e stato possibile creare il certificato nominativo.", 503);
  }
}
