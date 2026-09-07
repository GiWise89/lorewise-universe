import { env } from "@/lib/netlifyRuntime";

import { catalogArtworks } from "@/lib/artCatalog";
import { automaticArtworkDeliveryReady } from "@/lib/automaticArtworkDelivery";
import { ensureBenefitEngineTables, expireBenefits, grantPermanentCollectorCredits } from "@/lib/benefitEngine";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { codexEntryBySlug } from "@/lib/codex";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { STUDIO_POLLS, UNIVERSE_PASS_OPPORTUNITIES, getActiveUniversePass, pollIsOpen } from "@/lib/universePass";
import { FAMILIAR_LEVEL_BENEFITS, familiarLevelDiscount, familiarLevelForCustomer } from "@/lib/nexusFamiliarBenefits";
import { familiarEconomyHistory } from "@/lib/nexusFamiliarEconomyServer";
import { familiarNextMilestone } from "@/lib/nexusFamiliarProgression";
import { FAMILIAR_LEVEL_50_COMMISSION_REWARD, getFamiliarCommissionRewardForCustomer, syncFamiliarCommissionReward } from "@/lib/familiarCommissionReward";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

async function context() {
  const user = await getLoreWiseUser();
  if (!user?.email) return { error: Response.json({ error: "Accedi al tuo LoreWise ID." }, { status: 401 }) };
  const runtime = env as unknown as RuntimeEnv;
  const database = runtime.DB;
  if (!database) return { error: Response.json({ error: "Centro vantaggi non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(user);
  await ensureCommerceTables(database);
  await ensureBenefitEngineTables(database);
  const customer = await database.prepare("SELECT status FROM customers WHERE id = ?").bind(user.id).first<{ status: string }>();
  if (customer?.status !== "active") return { error: Response.json({ error: "Il profilo non è abilitato." }, { status: 403 }) };
  return { database, bucket: runtime.COMMISSION_UPLOADS, customerId: user.id };
}

async function snapshot(database: D1Database, customerId: string) {
  await expireBenefits(database, customerId);
  const pass = await getActiveUniversePass(database, customerId);
  const familiarLevel = await familiarLevelForCustomer(database, customerId);
  await syncFamiliarCommissionReward(database, customerId, familiarLevel);
  const familiarCommissionReward = await getFamiliarCommissionRewardForCustomer(database, customerId);
  const familiarBenefit = [...FAMILIAR_LEVEL_BENEFITS].reverse().find((entry) => familiarLevel >= entry.level) ?? null;
  const familiarNext = familiarNextMilestone(familiarLevel);
  const familiarHistory = await familiarEconomyHistory(database, customerId, 20);
  await grantPermanentCollectorCredits(database, customerId);
  const [ledger, events, claims, bookmarks, votes, pollTotals] = await Promise.all([
    database.prepare(`SELECT id, benefit_type, amount, remaining, status, assigned_at, expires_at, used_at, resource_code
      FROM benefit_ledger WHERE customer_id = ? ORDER BY assigned_at DESC LIMIT 80`).bind(customerId)
      .all<{ id: string; benefit_type: string; amount: number; remaining: number; status: string; assigned_at: string; expires_at: string | null; used_at: string | null; resource_code: string | null }>(),
    database.prepare(`SELECT benefit_type, action, amount, reference_code, created_at FROM benefit_events
      WHERE customer_id = ? ORDER BY created_at DESC LIMIT 80`).bind(customerId)
      .all<{ benefit_type: string; action: string; amount: number; reference_code: string | null; created_at: string }>(),
    database.prepare(`SELECT benefit_code, resource_code, status, created_at, updated_at FROM member_benefit_claims
      WHERE customer_id = ? ORDER BY created_at DESC`).bind(customerId)
      .all<{ benefit_code: string; resource_code: string; status: string; created_at: string; updated_at: string }>(),
    database.prepare(`SELECT entry_slug, collection_name, created_at FROM codex_bookmarks
      WHERE customer_id = ? ORDER BY collection_name, created_at DESC`).bind(customerId)
      .all<{ entry_slug: string; collection_name: string; created_at: string }>(),
    database.prepare("SELECT poll_code, option_code, created_at, updated_at FROM studio_poll_votes WHERE customer_id = ?")
      .bind(customerId).all<{ poll_code: string; option_code: string; created_at: string; updated_at: string }>(),
    database.prepare(`SELECT poll_code, option_code, COUNT(*) AS total FROM studio_poll_votes
      GROUP BY poll_code, option_code`).all<{ poll_code: string; option_code: string; total: number }>(),
  ]);
  const availableCredits = ledger.results.filter((row) => row.benefit_type === "art_credit" && row.status === "active")
    .reduce((sum, row) => sum + Number(row.remaining), 0);
  const usedCredits = events.results.filter((row) => row.benefit_type === "art_credit" && row.action === "redeemed")
    .reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0);
  return {
    pass,
    wallet: { availableCredits, usedCredits, entries: ledger.results.map((row) => ({
      id: row.id, type: row.benefit_type, amount: Number(row.amount), remaining: Number(row.remaining), status: row.status,
      assignedAt: row.assigned_at, expiresAt: row.expires_at, usedAt: row.used_at, resourceCode: row.resource_code,
    })) },
    discounts: {
      commissions: Math.max(pass.commissionDiscountPercent, familiarLevelDiscount(familiarLevel, "commissioni")),
      games: Math.max(pass.gameDiscountPercent, familiarLevelDiscount(familiarLevel, "giwise-shop")),
      digitalProducts: Math.max(pass.digitalDiscountPercent, familiarLevelDiscount(familiarLevel, "giwise-shop")),
    },
    familiar: {
      level: familiarLevel,
      title: familiarBenefit?.title ?? "Primo legame",
      benefit: familiarBenefit?.benefit ?? "Continua a prendertene cura per sbloccare il primo riconoscimento.",
      nextLevel: familiarNext?.level ?? null,
      nextTitle: familiarNext?.title ?? null,
      commissionReward: {
        amountCents: FAMILIAR_LEVEL_50_COMMISSION_REWARD.discountCents,
        unlocked: familiarLevel >= FAMILIAR_LEVEL_50_COMMISSION_REWARD.requiredLevel,
        status: familiarCommissionReward?.status ?? "locked",
      },
      economyHistory: familiarHistory,
    },
    opportunities: UNIVERSE_PASS_OPPORTUNITIES.map((item) => ({
      ...item, available: pass.active,
      claim: (() => {
        const claim = claims.results.find((entry) => entry.benefit_code === item.code);
        return claim ? { ...claim, status: pass.active ? claim.status : "expired" } : null;
      })(),
    })),
    collectorDossiers: pass.collectorDossiers ? ["nhevara-madreferita", "kharvoss-re-sepolto"].map((slug) => codexEntryBySlug(slug)).filter((entry) => entry?.catalog.origin === "giwise-original").map((entry) => ({
      slug: entry!.slug,
      title: `${entry!.displayTitle} · dossier esteso`,
      concept: entry!.giwiseModule?.concept.value ?? entry!.summary.value,
      developmentFacts: [...(entry!.giwiseModule?.gameplayProfile ?? []), ...entry!.production.facts].slice(0, 6).map((fact) => ({ label: fact.label, value: fact.value })),
    })) : [],
    redeemableArtworks: catalogArtworks.filter((artwork) => artwork.access === "commercial-original")
      .map((artwork) => ({ code: artwork.code, title: artwork.title })),
    bookmarks: bookmarks.results.map((row) => ({ slug: row.entry_slug, collection: row.collection_name, createdAt: row.created_at })),
    polls: STUDIO_POLLS.map((poll) => ({
      ...poll,
      open: pollIsOpen(poll.opensAt, poll.closesAt),
      viewerOption: votes.results.find((vote) => vote.poll_code === poll.code)?.option_code ?? null,
      options: poll.options.map((option) => ({
        ...option,
        votes: Number(pollTotals.results.find((total) => total.poll_code === poll.code && total.option_code === option.code)?.total ?? 0),
      })),
    })),
    history: events.results.map((row) => ({ type: row.benefit_type, action: row.action, amount: Number(row.amount), referenceCode: row.reference_code, createdAt: row.created_at })),
  };
}

export async function GET() {
  try {
    const current = await context();
    if ("error" in current) return current.error;
    return Response.json(await snapshot(current.database, current.customerId), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare i vantaggi." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await context();
    if ("error" in current) return current.error;
    const { database, bucket, customerId } = current;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const action = typeof body?.action === "string" ? body.action : "";
    const pass = await getActiveUniversePass(database, customerId);

    if (action === "bookmark" || action === "remove_bookmark") {
      const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
      if (!codexEntryBySlug(slug)) return Response.json({ error: "Dossier non valido." }, { status: 400 });
      if (action === "remove_bookmark") {
        await database.prepare("DELETE FROM codex_bookmarks WHERE customer_id = ? AND entry_slug = ?").bind(customerId, slug).run();
      } else {
        const collection = typeof body?.collection === "string" ? body.collection.trim().slice(0, 40) : "Preferiti";
        await database.prepare(`INSERT INTO codex_bookmarks (customer_id, entry_slug, collection_name)
          VALUES (?, ?, ?) ON CONFLICT(customer_id, entry_slug) DO UPDATE SET collection_name = excluded.collection_name`)
          .bind(customerId, slug, collection || "Preferiti").run();
      }
    } else if (action === "vote") {
      if (!pass.active) return Response.json({ error: "La votazione è riservata agli abbonamenti attivi." }, { status: 403 });
      const pollCode = typeof body?.pollCode === "string" ? body.pollCode : "";
      const optionCode = typeof body?.optionCode === "string" ? body.optionCode : "";
      const poll = STUDIO_POLLS.find((item) => item.code === pollCode);
      if (!poll || !pollIsOpen(poll.opensAt, poll.closesAt) || !poll.options.some((option) => option.code === optionCode)) {
        return Response.json({ error: "Votazione o scelta non valida." }, { status: 400 });
      }
      const existing = await database.prepare("SELECT 1 AS found FROM studio_poll_votes WHERE customer_id = ? AND poll_code = ?")
        .bind(customerId, pollCode).first();
      if (existing) return Response.json({ error: "Hai già espresso il tuo voto per questa consultazione." }, { status: 409 });
      await database.batch([
        database.prepare("INSERT INTO studio_poll_votes (customer_id, poll_code, option_code) VALUES (?, ?, ?)").bind(customerId, pollCode, optionCode),
        database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code, metadata_json)
          VALUES (?, ?, 'studio_vote', 'cast', 1, ?, ?)`).bind(crypto.randomUUID(), customerId, pollCode, JSON.stringify({ optionCode })),
      ]);
    } else if (action === "apply" || action === "claim_access") {
      if (!pass.active) return Response.json({ error: "Questo vantaggio richiede un abbonamento attivo." }, { status: 403 });
      const benefitCode = typeof body?.benefitCode === "string" ? body.benefitCode : "";
      const opportunity = UNIVERSE_PASS_OPPORTUNITIES.find((item) => item.code === benefitCode);
      if (!opportunity) return Response.json({ error: "Vantaggio non valido." }, { status: 400 });
      const resourceCode = typeof body?.resourceCode === "string" && body.resourceCode.trim() ? body.resourceCode.trim().slice(0, 80) : benefitCode;
      try {
        await database.batch([
          database.prepare(`INSERT INTO member_benefit_claims (id, customer_id, benefit_code, resource_code, status)
            VALUES (?, ?, ?, ?, ?)`)
            .bind(crypto.randomUUID(), customerId, benefitCode, resourceCode, action === "apply" ? "submitted" : "granted"),
          database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code)
            VALUES (?, ?, ?, ?, 1, ?)`)
            .bind(crypto.randomUUID(), customerId, benefitCode, action === "apply" ? "applied" : "access_granted", resourceCode),
        ]);
      } catch {
        return Response.json({ error: "Questo vantaggio è già stato registrato sul tuo LoreWise ID." }, { status: 409 });
      }
    } else if (action === "redeem_art_credit") {
      if (!pass.active) return Response.json({ error: "I crediti Arte richiedono un abbonamento attivo." }, { status: 403 });
      const artworkCode = typeof body?.artworkCode === "string" ? body.artworkCode.toUpperCase() : "";
      const artwork = catalogArtworks.find((item) => item.code === artworkCode && item.access === "commercial-original");
      if (!artwork) return Response.json({ error: "Opera non riscattabile." }, { status: 400 });
      const delivery = await database.prepare("SELECT id FROM artwork_delivery_files WHERE artwork_code = ? AND status = 'approved' LIMIT 1")
        .bind(artworkCode).first();
      const automaticDelivery = await automaticArtworkDeliveryReady(bucket, artworkCode);
      if (!delivery && !automaticDelivery) return Response.json({ error: "Il pacchetto dell’opera non è ancora disponibile per la consegna." }, { status: 409 });
      const owned = await database.prepare(`SELECT id FROM entitlements WHERE customer_id = ? AND resource_type = 'artwork'
        AND resource_code = ? AND status = 'active' LIMIT 1`).bind(customerId, artworkCode).first();
      if (owned) return Response.json({ error: "Quest’opera è già nella tua libreria." }, { status: 409 });
      await expireBenefits(database, customerId);
      const credit = await database.prepare(`SELECT id, remaining FROM benefit_ledger WHERE customer_id = ?
        AND benefit_type = 'art_credit' AND status = 'active' AND remaining > 0
        AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP) ORDER BY expires_at, assigned_at LIMIT 1`)
        .bind(customerId).first<{ id: string; remaining: number }>();
      if (!credit) return Response.json({ error: "Non hai crediti Arte disponibili." }, { status: 409 });
      await database.batch([
        database.prepare(`UPDATE benefit_ledger SET remaining = remaining - 1,
          status = CASE WHEN remaining - 1 = 0 THEN 'consumed' ELSE status END,
          used_at = CURRENT_TIMESTAMP, resource_code = ? WHERE id = ? AND remaining > 0`).bind(artworkCode, credit.id),
        database.prepare(`INSERT INTO entitlements (id, customer_id, resource_type, resource_code, status, download_limit, download_count)
          VALUES (?, ?, 'artwork', ?, 'active', 3, 0)`).bind(crypto.randomUUID(), customerId, artworkCode),
        database.prepare(`INSERT INTO benefit_events (id, customer_id, benefit_type, action, amount, reference_code)
          VALUES (?, ?, 'art_credit', 'redeemed', 1, ?)`)
          .bind(crypto.randomUUID(), customerId, artworkCode),
      ]);
    } else {
      return Response.json({ error: "Azione non valida." }, { status: 400 });
    }
    return Response.json(await snapshot(database, customerId), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Operazione non completata. Riprova più tardi." }, { status: 503 });
  }
}
