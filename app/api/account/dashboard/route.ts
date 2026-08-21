import { env } from "@/lib/netlifyRuntime";

import { ensureArtCommunityTables } from "@/lib/artCommunityServer";
import { automaticArtworkDeliveryReady, getAutomaticArtworkDelivery } from "@/lib/automaticArtworkDelivery";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { ensureCommissionBenefitColumns, getActiveUniversePass } from "@/lib/universePass";
import { ensureSupportTicketTables } from "@/lib/supportTickets";
import { getStripeConfiguration, type StripeRuntimeEnv } from "@/lib/stripe";

type RuntimeEnv = StripeRuntimeEnv & { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket; LOREWISE_MANUAL_DELIVERY_APPROVED?: string };

type OrderRow = {
  reference_code: string; order_type: string; status: string; currency: string; total_cents: number;
  paid_at: string | null; created_at: string; item_count: number; item_titles: string | null;
  stripe_checkout_session_id: string | null; item_product_code: string | null;
};
type EntitlementRow = {
  resource_type: string; resource_code: string; status: string; download_limit: number | null;
  download_count: number; expires_at: string | null; created_at: string; title: string | null;
  delivery_status: string | null; delivery_filename: string | null; delivery_version: string | null; order_status: string | null;
};
type CommissionRow = {
  reference_code: string; category: string; package_name: string; status: string; quote_base_cents: number | null;
  quote_discount_cents: number | null; quote_cents: number | null; membership_plan_code: string | null;
  membership_discount_percent: number;
  created_at: string; updated_at: string;
};

export async function GET() {
  try {
    const user = await getLoreWiseUser();
    if (!user?.email) return Response.json({ error: "Sessione non valida." }, { status: 401 });
    const runtime = env as unknown as RuntimeEnv;
    const database = runtime.DB;
    if (!database) return Response.json({ error: "Archivio personale non disponibile." }, { status: 503 });
    await syncLoreWiseCustomer(user);
    await ensureArtCommunityTables(database);
    await ensureCommerceTables(database);
    await ensureCommissionBenefitColumns(database);
    await ensureSupportTicketTables(database);

    const customer = await database.prepare("SELECT email, display_name, role, status, created_at FROM customers WHERE id = ?")
      .bind(user.id).first<{ email: string; display_name: string | null; role: string; status: string; created_at: string }>();
    if (!customer) return Response.json({ error: "Profilo non trovato." }, { status: 404 });
    const activePass = await getActiveUniversePass(database, user.id);
    const stripe = getStripeConfiguration(runtime);

    const [orders, entitlements, subscription, subscriptionInvoices, commissions, supportTickets, community, openReports] = await Promise.all([
      database.prepare(`SELECT orders.reference_code, orders.order_type, orders.status, orders.currency,
        orders.total_cents, orders.paid_at, orders.created_at, orders.stripe_checkout_session_id,
        COUNT(order_items.id) AS item_count, GROUP_CONCAT(order_items.title, ' · ') AS item_titles,
        MAX(order_items.product_code) AS item_product_code
        FROM orders LEFT JOIN order_items ON order_items.order_id = orders.id
        WHERE orders.customer_id = ? GROUP BY orders.id ORDER BY orders.created_at DESC LIMIT 12`)
        .bind(user.id).all<OrderRow>(),
      database.prepare(`SELECT entitlements.resource_type, entitlements.resource_code, entitlements.status,
        entitlements.download_limit, entitlements.download_count, entitlements.expires_at,
        entitlements.created_at, order_items.title,
        COALESCE(artwork_delivery_files.status, game_delivery_files.status, manual_deliveries.status) AS delivery_status,
        COALESCE(artwork_delivery_files.filename, game_delivery_files.filename) AS delivery_filename,
        game_delivery_files.version AS delivery_version, orders.status AS order_status
        FROM entitlements LEFT JOIN order_items ON order_items.id = entitlements.order_item_id
        LEFT JOIN orders ON orders.id = order_items.order_id
        LEFT JOIN manual_deliveries ON manual_deliveries.order_id = orders.id
        LEFT JOIN artwork_delivery_files ON artwork_delivery_files.artwork_code = entitlements.resource_code
        LEFT JOIN game_delivery_files ON game_delivery_files.product_code = entitlements.resource_code
        WHERE entitlements.customer_id = ? ORDER BY entitlements.created_at DESC LIMIT 30`)
        .bind(user.id).all<EntitlementRow>(),
      database.prepare(`SELECT plan_code, status, stripe_subscription_id, current_period_end, cancel_at_period_end, created_at
        FROM subscriptions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1`)
        .bind(user.id).first<{ plan_code: string; status: string; stripe_subscription_id: string | null; current_period_end: string | null; cancel_at_period_end: number; created_at: string }>(),
      database.prepare(`SELECT subscription_invoices.stripe_invoice_id, subscription_invoices.amount_paid_cents,
        subscription_invoices.currency, subscription_invoices.status, subscription_invoices.period_start,
        subscription_invoices.period_end, subscription_invoices.paid_at
        FROM subscription_invoices JOIN subscriptions ON subscriptions.id = subscription_invoices.subscription_id
        WHERE subscriptions.customer_id = ? ORDER BY subscription_invoices.created_at DESC LIMIT 24`)
        .bind(user.id).all<{ stripe_invoice_id: string; amount_paid_cents: number; currency: string; status: string; period_start: string | null; period_end: string | null; paid_at: string | null }>(),
      database.prepare(`SELECT reference_code, category, package_name, status, quote_base_cents,
        quote_discount_cents, quote_cents, membership_plan_code, membership_discount_percent, created_at, updated_at
        FROM commission_requests WHERE customer_id = ? OR (customer_id IS NULL AND LOWER(email) = LOWER(?))
        ORDER BY created_at DESC LIMIT 12`)
        .bind(user.id, customer.email).all<CommissionRow>(),
      database.prepare(`SELECT reference_code, category, subject, status, priority, admin_notes, created_at, updated_at
        FROM support_tickets WHERE customer_id = ? ORDER BY created_at DESC LIMIT 12`)
        .bind(user.id).all<{ reference_code: string; category: string; subject: string; status: string; priority: string; admin_notes: string | null; created_at: string; updated_at: string }>(),
      database.prepare(`SELECT
        (SELECT COUNT(*) FROM artwork_likes WHERE user_id = ?) AS likes,
        (SELECT COUNT(*) FROM artwork_comments WHERE user_id = ? AND status != 'deleted') AS comments`)
        .bind(user.id, user.id).first<{ likes: number; comments: number }>(),
      ["admin", "moderator"].includes(customer.role)
        ? database.prepare("SELECT COUNT(*) AS total FROM artwork_comment_reports WHERE status = 'open'").first<{ total: number }>()
        : Promise.resolve(null),
    ]);

    const library = await Promise.all(entitlements.results.map(async (item) => {
      const isArtwork = ["artwork", "art", "license"].includes(item.resource_type);
      const automatic = isArtwork
        ? await automaticArtworkDeliveryReady(runtime.COMMISSION_UPLOADS, item.resource_code, stripe.testMode)
        : false;
      const automaticDelivery = automatic ? getAutomaticArtworkDelivery(item.resource_code) : null;
      const deliveryStatus = automatic ? "approved" : item.delivery_status;
      return {
        resourceType: item.resource_type, resourceCode: item.resource_code, title: item.title || item.resource_code,
        status: item.status, downloadLimit: item.download_limit, downloadCount: Number(item.download_count),
        expiresAt: item.expires_at, createdAt: item.created_at,
        deliveryStatus, deliveryFilename: automaticDelivery?.filename ?? item.delivery_filename,
        deliveryVersion: item.delivery_version,
        certificateAvailable: isArtwork && /^LW-ART-\d{3}$/.test(item.resource_code) && item.order_status === "paid" && deliveryStatus === "approved",
      };
    }));

    return Response.json({
      identity: { email: customer.email, displayName: customer.display_name ?? "", role: customer.role, status: customer.status, memberSince: customer.created_at },
      commerce: { testMode: stripe.testMode, mode: stripe.mode, manualDelivery: runtime.LOREWISE_MANUAL_DELIVERY_APPROVED?.trim().toLowerCase() === "true" },
      summary: {
        orders: orders.results.length,
        libraryItems: entitlements.results.filter((item) => item.status === "active").length,
        commissions: commissions.results.length,
        communityInteractions: Number(community?.likes ?? 0) + Number(community?.comments ?? 0),
      },
      orders: orders.results.map((order) => ({
        referenceCode: order.reference_code, type: order.order_type, status: order.status, currency: order.currency,
        totalCents: Number(order.total_cents), paidAt: order.paid_at, createdAt: order.created_at,
        itemCount: Number(order.item_count), itemTitles: order.item_titles ?? "",
        checkoutSessionId: order.stripe_checkout_session_id, productCode: order.item_product_code,
      })),
      library,
      subscription: subscription ? {
        planCode: subscription.plan_code, status: subscription.status, currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end), createdAt: subscription.created_at,
        complimentary: !subscription.stripe_subscription_id,
        expiresSoon: Boolean(subscription.current_period_end && new Date(subscription.current_period_end).getTime() - Date.now() < 7 * 86400000),
      } : null,
      benefits: activePass,
      subscriptionInvoices: subscriptionInvoices.results.map((invoice) => ({
        invoiceId: invoice.stripe_invoice_id, amountPaidCents: Number(invoice.amount_paid_cents), currency: invoice.currency,
        status: invoice.status, periodStart: invoice.period_start, periodEnd: invoice.period_end, paidAt: invoice.paid_at,
      })),
      commissions: commissions.results.map((commission) => ({
        referenceCode: commission.reference_code, category: commission.category, packageName: commission.package_name,
        status: commission.status, quoteBaseCents: commission.quote_base_cents ?? commission.quote_cents,
        quoteDiscountCents: commission.quote_discount_cents ?? 0, quoteCents: commission.quote_cents,
        membershipPlanCode: commission.membership_plan_code, membershipDiscountPercent: commission.membership_discount_percent ?? 0,
        createdAt: commission.created_at, updatedAt: commission.updated_at,
      })),
      supportTickets: supportTickets.results.map((ticket) => ({ referenceCode: ticket.reference_code, category: ticket.category, subject: ticket.subject, status: ticket.status, priority: ticket.priority, adminNotes: ticket.admin_notes, createdAt: ticket.created_at, updatedAt: ticket.updated_at })),
      community: { likes: Number(community?.likes ?? 0), comments: Number(community?.comments ?? 0), openReports: Number(openReports?.total ?? 0) },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare l’Area personale." }, { status: 503 });
  }
}
