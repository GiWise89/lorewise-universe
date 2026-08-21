import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";
import { ensureGameCommunityTables } from "@/lib/gameCommunityServer";
import { gameProjects } from "@/lib/gameCatalog";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";
import { ensureCommerceTables } from "@/lib/commerceServer";

type RuntimeEnv = { DB?: D1Database };
type Viewer = { id: string; canParticipate: boolean };
type ReviewRow = {
  comment_id: string;
  user_id: string;
  body: string;
  display_name: string | null;
  rating: number;
  game_version: string;
  created_at: string;
  updated_at: string;
  membership_badge: string | null;
};

async function runtimeDatabase() {
  const { env } = await import("cloudflare:workers");
  return (env as unknown as RuntimeEnv).DB;
}

async function currentUser() {
  const client = await createLoreWiseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

function availableGame(request: Request) {
  const code = (new URL(request.url).searchParams.get("game") ?? "").toUpperCase();
  return gameProjects.find((game) => game.code === code && game.statusTone === "available") ?? null;
}

async function payload(database: D1Database, gameCode: string, viewer?: Viewer) {
  const reviews = await database.prepare(`SELECT ratings.comment_id, comments.user_id, comments.body,
      customers.display_name, ratings.rating, ratings.game_version, ratings.created_at, ratings.updated_at,
      (SELECT CASE subscriptions.plan_code WHEN 'LW-PASS-COLLECTOR' THEN 'Collector' WHEN 'LW-PASS-SUPPORTER' THEN 'Supporter' END
       FROM subscriptions WHERE subscriptions.customer_id = comments.user_id
       AND subscriptions.status IN ('active', 'trialing')
       AND (subscriptions.current_period_end IS NULL OR datetime(subscriptions.current_period_end) > CURRENT_TIMESTAMP)
       ORDER BY subscriptions.created_at DESC LIMIT 1) AS membership_badge
    FROM game_ratings AS ratings
    JOIN artwork_comments AS comments ON comments.id = ratings.comment_id
    JOIN customers ON customers.id = comments.user_id
    WHERE ratings.game_code = ? AND comments.status = 'visible'
    ORDER BY ratings.created_at DESC LIMIT 50`).bind(gameCode).all<ReviewRow>();
  const aggregate = await database.prepare(`SELECT COUNT(*) AS total, ROUND(AVG(rating), 1) AS average
    FROM game_ratings JOIN artwork_comments ON artwork_comments.id = game_ratings.comment_id
    WHERE game_ratings.game_code = ? AND artwork_comments.status = 'visible'`).bind(gameCode).first<{ total: number; average: number | null }>();
  const viewerReview = viewer?.id ? reviews.results.find((review) => review.user_id === viewer.id) : undefined;
  return {
    authenticated: Boolean(viewer?.id),
    canParticipate: Boolean(viewer?.canParticipate),
    reviewCount: Number(aggregate?.total ?? 0),
    averageRating: aggregate?.average == null ? null : Number(aggregate.average),
    viewerReviewId: viewerReview?.comment_id ?? null,
    viewerRating: viewerReview?.rating ?? null,
    viewerVersion: viewerReview?.game_version ?? null,
    reviews: reviews.results.map((review) => ({
      id: review.comment_id,
      author: review.display_name?.trim() || "Membro LoreWise",
      membershipBadge: review.membership_badge,
      body: review.body,
      rating: Number(review.rating),
      version: review.game_version,
      createdAt: review.created_at,
      edited: review.updated_at !== review.created_at,
      ownedByViewer: review.user_id === viewer?.id,
    })),
  };
}

async function viewerFor(database: D1Database) {
  const user = await currentUser();
  if (!user) return { user: null, viewer: undefined };
  await syncLoreWiseCustomer(user);
  const customer = await database.prepare("SELECT status FROM customers WHERE id = ?").bind(user.id).first<{ status: string }>();
  return { user, viewer: { id: user.id, canParticipate: customer?.status === "active" } };
}

export async function GET(request: Request) {
  const game = availableGame(request);
  if (!game) return Response.json({ error: "Le recensioni sono disponibili soltanto per giochi pubblicati." }, { status: 404 });
  const database = await runtimeDatabase();
  if (!database) return Response.json({ error: "Community non disponibile." }, { status: 503 });
  try {
    await ensureGameCommunityTables(database);
    await ensureCommerceTables(database);
    const { viewer } = await viewerFor(database);
    return Response.json(await payload(database, game.code, viewer), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare le recensioni." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const game = availableGame(request);
  if (!game) return Response.json({ error: "Questo progetto non accetta ancora recensioni." }, { status: 404 });
  if (!await currentUser()) return Response.json({ error: "Accedi al tuo LoreWise ID per partecipare." }, { status: 401 });
  const database = await runtimeDatabase();
  if (!database) return Response.json({ error: "Community non disponibile." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }

  try {
    await ensureGameCommunityTables(database);
    await ensureCommerceTables(database);
    const { user, viewer } = await viewerFor(database);
    if (!user || !viewer) return Response.json({ error: "Accedi al tuo LoreWise ID per partecipare." }, { status: 401 });
    if (!viewer.canParticipate) return Response.json({ error: "Questo profilo non può partecipare alla Community." }, { status: 403 });
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "review") {
      const reviewBody = typeof body.review === "string" ? body.review.trim() : "";
      const rating = Number(body.rating);
      const version = game.latestUpdate?.version ?? game.version.replace(/^Versione\s+(?:web\s+)?/i, "");
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "Scegli un voto da 1 a 5." }, { status: 400 });
      if (reviewBody.length < 20 || reviewBody.length > ART_COMMENT_LIMITS.maximum) return Response.json({ error: `La recensione deve contenere da 20 a ${ART_COMMENT_LIMITS.maximum} caratteri.` }, { status: 400 });
      const existing = await database.prepare("SELECT comment_id FROM game_ratings WHERE user_id = ? AND game_code = ?")
        .bind(user.id, game.code).first<{ comment_id: string }>();
      if (existing) {
        await database.batch([
          database.prepare("UPDATE artwork_comments SET body = ?, status = 'visible', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?").bind(reviewBody, existing.comment_id, user.id),
          database.prepare("UPDATE game_ratings SET rating = ?, game_version = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND game_code = ?").bind(rating, version, user.id, game.code),
        ]);
      } else {
        const recent = await database.prepare(`SELECT 1 AS found FROM artwork_comments WHERE user_id = ?
          AND created_at > datetime('now', ?) LIMIT 1`).bind(user.id, `-${ART_COMMENT_LIMITS.cooldownSeconds} seconds`).first();
        if (recent) return Response.json({ error: `Attendi ${ART_COMMENT_LIMITS.cooldownSeconds} secondi prima di pubblicare un altro contenuto.` }, { status: 429 });
        const commentId = crypto.randomUUID();
        await database.batch([
          database.prepare("INSERT INTO artwork_comments (id, user_id, artwork_code, body) VALUES (?, ?, ?, ?)").bind(commentId, user.id, game.code, reviewBody),
          database.prepare("INSERT INTO game_ratings (user_id, game_code, rating, game_version, comment_id) VALUES (?, ?, ?, ?, ?)").bind(user.id, game.code, rating, version, commentId),
        ]);
      }
      return Response.json(await payload(database, game.code, viewer), { status: existing ? 200 : 201, headers: { "Cache-Control": "private, no-store" } });
    }

    const commentId = typeof body.commentId === "string" ? body.commentId : "";
    if (!/^[0-9a-f-]{36}$/i.test(commentId)) return Response.json({ error: "Recensione non valida." }, { status: 400 });
    if (action === "delete_review") {
      const owned = await database.prepare("SELECT 1 AS found FROM game_ratings WHERE comment_id = ? AND user_id = ? AND game_code = ?")
        .bind(commentId, user.id, game.code).first();
      if (!owned) return Response.json({ error: "Non puoi eliminare questa recensione." }, { status: 403 });
      await database.batch([
        database.prepare("DELETE FROM game_ratings WHERE comment_id = ? AND user_id = ?").bind(commentId, user.id),
        database.prepare("UPDATE artwork_comments SET status = 'deleted', body = '', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?").bind(commentId, user.id),
      ]);
      return Response.json(await payload(database, game.code, viewer), { headers: { "Cache-Control": "private, no-store" } });
    }
    if (action === "report_review") {
      const reason = typeof body.reason === "string" ? body.reason : "";
      if (!(ART_REPORT_REASONS as readonly string[]).includes(reason)) return Response.json({ error: "Motivo non valido." }, { status: 400 });
      const target = await database.prepare(`SELECT comments.user_id FROM artwork_comments AS comments
        JOIN game_ratings ON game_ratings.comment_id = comments.id
        WHERE comments.id = ? AND game_ratings.game_code = ? AND comments.status = 'visible'`).bind(commentId, game.code).first<{ user_id: string }>();
      if (!target) return Response.json({ error: "Recensione non disponibile." }, { status: 404 });
      if (target.user_id === user.id) return Response.json({ error: "Puoi modificare o eliminare direttamente la tua recensione." }, { status: 400 });
      try {
        await database.prepare("INSERT INTO artwork_comment_reports (id, comment_id, reporter_user_id, reason) VALUES (?, ?, ?, ?)")
          .bind(crypto.randomUUID(), commentId, user.id, reason).run();
      } catch {
        return Response.json({ error: "Hai già segnalato questa recensione." }, { status: 409 });
      }
      return Response.json({ message: "Segnalazione ricevuta dalla moderazione LoreWise." });
    }
    return Response.json({ error: "Azione non valida." }, { status: 400 });
  } catch {
    return Response.json({ error: "Operazione non completata. Riprova più tardi." }, { status: 503 });
  }
}
