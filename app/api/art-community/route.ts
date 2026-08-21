import { env } from "@/lib/netlifyRuntime";

import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";
import { ensureArtCommunityTables } from "@/lib/artCommunityServer";
import { catalogArtworks } from "@/lib/artCatalog";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";
import { ensureCommerceTables } from "@/lib/commerceServer";

type RuntimeEnv = { DB?: D1Database };
type CommentRow = {
  id: string;
  user_id: string;
  body: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  membership_badge: string | null;
};

async function runtimeDatabase() {
  return (env as unknown as RuntimeEnv).DB;
}

async function currentUser() {
  const client = await createLoreWiseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

function artworkCodeFrom(request: Request) {
  const normalized = (new URL(request.url).searchParams.get("artwork") ?? "").toUpperCase();
  return catalogArtworks.some((artwork) => artwork.code === normalized) ? normalized : null;
}

type CommunityViewer = { id: string; canParticipate: boolean };

async function communityPayload(database: D1Database, artworkCode: string, viewer?: CommunityViewer) {
  const likes = await database.prepare("SELECT COUNT(*) AS total FROM artwork_likes WHERE artwork_code = ?")
    .bind(artworkCode).first<{ total: number }>();
  const comments = await database.prepare(`SELECT artwork_comments.id, artwork_comments.user_id, artwork_comments.body,
      artwork_comments.created_at, artwork_comments.updated_at, customers.display_name,
      (SELECT CASE subscriptions.plan_code WHEN 'LW-PASS-COLLECTOR' THEN 'Collector' WHEN 'LW-PASS-SUPPORTER' THEN 'Supporter' END
       FROM subscriptions WHERE subscriptions.customer_id = artwork_comments.user_id
       AND subscriptions.status IN ('active', 'trialing')
       AND (subscriptions.current_period_end IS NULL OR datetime(subscriptions.current_period_end) > CURRENT_TIMESTAMP)
       ORDER BY subscriptions.created_at DESC LIMIT 1) AS membership_badge
    FROM artwork_comments JOIN customers ON customers.id = artwork_comments.user_id
    WHERE artwork_comments.artwork_code = ? AND artwork_comments.status = 'visible'
    ORDER BY artwork_comments.created_at DESC LIMIT 40`).bind(artworkCode).all<CommentRow>();
  const viewerLiked = viewer?.id
    ? Boolean(await database.prepare("SELECT 1 AS found FROM artwork_likes WHERE artwork_code = ? AND user_id = ?").bind(artworkCode, viewer.id).first())
    : false;
  return {
    authenticated: Boolean(viewer?.id),
    canParticipate: Boolean(viewer?.canParticipate),
    likeCount: Number(likes?.total ?? 0),
    viewerLiked,
    comments: comments.results.map((comment) => ({
      id: comment.id,
      author: comment.display_name?.trim() || "Membro LoreWise",
      membershipBadge: comment.membership_badge,
      body: comment.body,
      createdAt: comment.created_at,
      edited: comment.updated_at !== comment.created_at,
      ownedByViewer: comment.user_id === viewer?.id,
    })),
  };
}

export async function GET(request: Request) {
  const artworkCode = artworkCodeFrom(request);
  if (!artworkCode) return Response.json({ error: "Opera non trovata." }, { status: 404 });
  const database = await runtimeDatabase();
  if (!database) return Response.json({ error: "Community non disponibile." }, { status: 503 });
  try {
    await ensureArtCommunityTables(database);
    await ensureCommerceTables(database);
    const user = await currentUser();
    let viewer: CommunityViewer | undefined;
    if (user) {
      await syncLoreWiseCustomer(user);
      const customer = await database.prepare("SELECT status FROM customers WHERE id = ?").bind(user.id).first<{ status: string }>();
      viewer = { id: user.id, canParticipate: customer?.status === "active" };
    }
    return Response.json(await communityPayload(database, artworkCode, viewer), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare le reazioni." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const artworkCode = artworkCodeFrom(request);
  if (!artworkCode) return Response.json({ error: "Opera non trovata." }, { status: 404 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "Accedi al tuo LoreWise ID per partecipare." }, { status: 401 });
  const database = await runtimeDatabase();
  if (!database) return Response.json({ error: "Community non disponibile." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";

  try {
    await syncLoreWiseCustomer(user);
    await ensureArtCommunityTables(database);
    await ensureCommerceTables(database);
    const participation = await database.prepare("SELECT status FROM customers WHERE id = ?").bind(user.id).first<{ status: string }>();
    if (participation?.status === "blocked") {
      return Response.json({ error: "Questo profilo non può partecipare alla Community. Contatta l’assistenza se ritieni che si tratti di un errore." }, { status: 403 });
    }
    if (participation?.status === "deletion_requested") {
      return Response.json({ error: "Le interazioni sono sospese mentre la richiesta di cancellazione è attiva. Annulla la richiesta dal profilo per partecipare di nuovo." }, { status: 403 });
    }
    if (participation?.status !== "active") {
      return Response.json({ error: "Questo profilo non è abilitato a partecipare alla Community." }, { status: 403 });
    }

    const viewer = { id: user.id, canParticipate: true };

    if (action === "toggle_like") {
      const existing = await database.prepare("SELECT 1 AS found FROM artwork_likes WHERE artwork_code = ? AND user_id = ?")
        .bind(artworkCode, user.id).first();
      if (existing) await database.prepare("DELETE FROM artwork_likes WHERE artwork_code = ? AND user_id = ?").bind(artworkCode, user.id).run();
      else await database.prepare("INSERT INTO artwork_likes (user_id, artwork_code) VALUES (?, ?)").bind(user.id, artworkCode).run();
      return Response.json(await communityPayload(database, artworkCode, viewer), { headers: { "Cache-Control": "private, no-store" } });
    }

    if (action === "comment") {
      const commentBody = typeof body.comment === "string" ? body.comment.trim() : "";
      if (commentBody.length < ART_COMMENT_LIMITS.minimum || commentBody.length > ART_COMMENT_LIMITS.maximum) {
        return Response.json({ error: `Il commento deve contenere da ${ART_COMMENT_LIMITS.minimum} a ${ART_COMMENT_LIMITS.maximum} caratteri.` }, { status: 400 });
      }
      const recent = await database.prepare(`SELECT 1 AS found FROM artwork_comments WHERE user_id = ?
        AND created_at > datetime('now', ?) LIMIT 1`).bind(user.id, `-${ART_COMMENT_LIMITS.cooldownSeconds} seconds`).first();
      if (recent) return Response.json({ error: `Attendi ${ART_COMMENT_LIMITS.cooldownSeconds} secondi prima di pubblicare un altro commento.` }, { status: 429 });
      await database.prepare("INSERT INTO artwork_comments (id, user_id, artwork_code, body) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), user.id, artworkCode, commentBody).run();
      return Response.json(await communityPayload(database, artworkCode, viewer), { status: 201, headers: { "Cache-Control": "private, no-store" } });
    }

    const commentId = typeof body.commentId === "string" ? body.commentId : "";
    if (!/^[0-9a-f-]{36}$/i.test(commentId)) return Response.json({ error: "Commento non valido." }, { status: 400 });

    if (action === "edit_comment") {
      const commentBody = typeof body.comment === "string" ? body.comment.trim() : "";
      if (commentBody.length < ART_COMMENT_LIMITS.minimum || commentBody.length > ART_COMMENT_LIMITS.maximum) {
        return Response.json({ error: `Il commento deve contenere da ${ART_COMMENT_LIMITS.minimum} a ${ART_COMMENT_LIMITS.maximum} caratteri.` }, { status: 400 });
      }
      const result = await database.prepare(`UPDATE artwork_comments SET body = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND artwork_code = ? AND user_id = ? AND status = 'visible'`)
        .bind(commentBody, commentId, artworkCode, user.id).run();
      if (!result.meta.changes) return Response.json({ error: "Non puoi modificare questo commento." }, { status: 403 });
      return Response.json(await communityPayload(database, artworkCode, viewer), { headers: { "Cache-Control": "private, no-store" } });
    }

    if (action === "delete_comment") {
      const result = await database.prepare(`UPDATE artwork_comments SET status = 'deleted', body = '', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND artwork_code = ? AND user_id = ? AND status = 'visible'`).bind(commentId, artworkCode, user.id).run();
      if (!result.meta.changes) return Response.json({ error: "Non puoi eliminare questo commento." }, { status: 403 });
      return Response.json(await communityPayload(database, artworkCode, viewer), { headers: { "Cache-Control": "private, no-store" } });
    }

    if (action === "report_comment") {
      const reason = typeof body.reason === "string" ? body.reason : "";
      if (!(ART_REPORT_REASONS as readonly string[]).includes(reason)) return Response.json({ error: "Motivo della segnalazione non valido." }, { status: 400 });
      const target = await database.prepare("SELECT user_id FROM artwork_comments WHERE id = ? AND artwork_code = ? AND status = 'visible'")
        .bind(commentId, artworkCode).first<{ user_id: string }>();
      if (!target) return Response.json({ error: "Commento non disponibile." }, { status: 404 });
      if (target.user_id === user.id) return Response.json({ error: "Puoi modificare o eliminare direttamente il tuo commento." }, { status: 400 });
      try {
        await database.prepare("INSERT INTO artwork_comment_reports (id, comment_id, reporter_user_id, reason) VALUES (?, ?, ?, ?)")
          .bind(crypto.randomUUID(), commentId, user.id, reason).run();
      } catch {
        const existingReport = await database.prepare("SELECT status FROM artwork_comment_reports WHERE comment_id = ? AND reporter_user_id = ?")
          .bind(commentId, user.id).first<{ status: string }>();
        if (existingReport?.status === "open") {
          return Response.json({ error: "Hai già segnalato questo commento." }, { status: 409 });
        }
        const reopened = await database.prepare(`UPDATE artwork_comment_reports
          SET reason = ?, status = 'open', created_at = CURRENT_TIMESTAMP
          WHERE comment_id = ? AND reporter_user_id = ? AND status <> 'open'`)
          .bind(reason, commentId, user.id).run();
        if (!reopened.meta.changes) return Response.json({ error: "Segnalazione non completata." }, { status: 409 });
      }
      return Response.json({ message: "Segnalazione ricevuta. Il commento verrà controllato." });
    }

    return Response.json({ error: "Azione non valida." }, { status: 400 });
  } catch {
    return Response.json({ error: "Operazione non completata. Riprova più tardi." }, { status: 503 });
  }
}
