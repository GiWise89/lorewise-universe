import { env } from "@/lib/netlifyRuntime";
import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";
import { ensureArtCommunityTables } from "@/lib/artCommunityServer";
import { catalogArtworks } from "@/lib/artCatalog";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { createUserNotification } from "@/lib/userNotifications";
import { profileCompletion } from "@/lib/profileCompletion";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { localArtCommunityPayload, updateLocalArtCommunity } from "@/lib/localArtCommunity";
import { meaningfulMissionComment } from "@/lib/nexusFamiliarMissionCatalog";
import { recordFamiliarMissionActivity } from "@/lib/nexusFamiliarMissionServer";
import { familiarCommunityTitle } from "@/lib/nexusFamiliarBenefits";

type RuntimeEnv = { DB?: D1Database; LOREWISE_ADMIN_EMAILS?: string };
type Viewer = { id: string; canParticipate: boolean };
type CommentRow = { id: string; user_id: string; parent_comment_id: string | null; body: string; display_name: string | null; username: string | null; avatar_object_key: string | null; profile_visibility: string; created_at: string; updated_at: string; membership_badge: string | null; familiar_level: number | null; like_count: number; viewer_liked: number };

function selectedArtwork(request: Request) {
  const code = (new URL(request.url).searchParams.get("artwork") ?? "").toUpperCase();
  return catalogArtworks.find((artwork) => artwork.code === code) ?? null;
}

function publicAuthor(row: CommentRow) {
  const publicProfile = row.profile_visibility === "public" && Boolean(row.username);
  return { name: row.display_name?.trim() || row.username || "Membro LoreWise", username: publicProfile ? row.username : null, avatarUrl: publicProfile && row.avatar_object_key ? `/api/profile-avatar/${encodeURIComponent(row.username!)}` : null };
}

async function payload(database: D1Database, artworkCode: string, viewer?: Viewer) {
  const likes = await database.prepare("SELECT COUNT(*) AS total FROM artwork_likes WHERE artwork_code = ?").bind(artworkCode).first<{ total: number }>();
  const rows = await database.prepare(`SELECT c.id, c.user_id, c.parent_comment_id, c.body, c.created_at, c.updated_at,
      u.display_name, u.username, u.avatar_object_key, u.profile_visibility,
      (SELECT CASE s.plan_code WHEN 'LW-PASS-COLLECTOR' THEN 'Collector' WHEN 'LW-PASS-SUPPORTER' THEN 'Supporter' END FROM subscriptions s WHERE s.customer_id = c.user_id AND s.status IN ('active','trialing') AND (s.current_period_end IS NULL OR datetime(s.current_period_end) > CURRENT_TIMESTAMP) ORDER BY s.created_at DESC LIMIT 1) membership_badge,
      (SELECT CAST(json_extract(f.state_json, '$.level') AS INTEGER) FROM nexus_familiars f WHERE f.customer_id = c.user_id LIMIT 1) familiar_level,
      (SELECT COUNT(*) FROM artwork_comment_likes l WHERE l.comment_id = c.id) like_count,
      (SELECT COUNT(*) FROM artwork_comment_likes l WHERE l.comment_id = c.id AND l.user_id = ?) viewer_liked
    FROM artwork_comments c JOIN customers u ON u.id = c.user_id
    WHERE c.artwork_code = ? AND c.status = 'visible' ORDER BY c.created_at ASC LIMIT 120`).bind(viewer?.id ?? "", artworkCode).all<CommentRow>();
  type Serialized = { id: string; name: string; username: string | null; avatarUrl: string | null; body: string; createdAt: string; edited: boolean; ownedByViewer: boolean; membershipBadge: string | null; familiarBadge: string | null; likeCount: number; viewerLiked: boolean; replies: Serialized[] };
  const serialize = (row: CommentRow): Serialized => ({ id: row.id, ...publicAuthor(row), body: row.body, createdAt: row.created_at, edited: row.updated_at !== row.created_at, ownedByViewer: row.user_id === viewer?.id, membershipBadge: row.membership_badge, familiarBadge: familiarCommunityTitle(Number(row.familiar_level ?? 1)), likeCount: Number(row.like_count), viewerLiked: Boolean(row.viewer_liked), replies: [] });
  const comments = rows.results.filter((row) => !row.parent_comment_id).map(serialize);
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  for (const row of rows.results.filter((item) => item.parent_comment_id)) byId.get(row.parent_comment_id!)?.replies.push(serialize(row));
  const viewerLiked = viewer?.id ? Boolean(await database.prepare("SELECT 1 FROM artwork_likes WHERE artwork_code = ? AND user_id = ?").bind(artworkCode, viewer.id).first()) : false;
  return { authenticated: Boolean(viewer), canParticipate: Boolean(viewer?.canParticipate), likeCount: Number(likes?.total ?? 0), viewerLiked, comments: comments.reverse() };
}

async function viewerFor(database: D1Database) {
  const user = await getLoreWiseUser();
  if (!user) return { user: null, viewer: undefined };
  await syncLoreWiseCustomer(user);
  const customer = await database.prepare("SELECT status, display_name, username, bio FROM customers WHERE id = ?").bind(user.id).first<{ status: string; display_name: string | null; username: string | null; bio: string | null }>();
  const complete = customer ? profileCompletion({ displayName: customer.display_name, username: customer.username }).profileComplete : false;
  return { user, viewer: { id: user.id, canParticipate: customer?.status === "active" && complete } };
}

export async function GET(request: Request) {
  const artwork = selectedArtwork(request);
  if (!artwork) return Response.json({ error: "Opera non trovata." }, { status: 404 });
  if (!netlifyDatabaseIsConfigured() && await isLocalLoreWiseRequest()) {
    const user = await getLoreWiseUser();
    return Response.json(localArtCommunityPayload(artwork.code, user, env as unknown as RuntimeEnv), { headers: { "Cache-Control": "private, no-store" } });
  }
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ error: "Community non disponibile." }, { status: 503 });
  try { await ensureCommerceTables(database); await ensureArtCommunityTables(database); const { viewer } = await viewerFor(database); return Response.json(await payload(database, artwork.code, viewer), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return Response.json({ error: "Non è stato possibile caricare la Community." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
  const artwork = selectedArtwork(request);
  if (!artwork) return Response.json({ error: "Opera non trovata." }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  if (!netlifyDatabaseIsConfigured() && await isLocalLoreWiseRequest()) {
    const user = await getLoreWiseUser();
    const result = updateLocalArtCommunity(artwork.code, user, env as unknown as RuntimeEnv, body);
    return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "private, no-store" } });
  }
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ error: "Community non disponibile." }, { status: 503 });
  try {
    await ensureCommerceTables(database);
    await ensureArtCommunityTables(database);
    const { user, viewer } = await viewerFor(database);
    if (!user) return Response.json({ error: "Accedi al tuo LoreWise ID per partecipare." }, { status: 401 });
    if (!viewer?.canParticipate) return Response.json({ error: "Questo profilo non può partecipare alla Community." }, { status: 403 });
    const action = typeof body.action === "string" ? body.action : "";
    if (action === "toggle_like") {
      const exists = await database.prepare("SELECT 1 FROM artwork_likes WHERE artwork_code = ? AND user_id = ?").bind(artwork.code, user.id).first();
      if (exists) await database.prepare("DELETE FROM artwork_likes WHERE artwork_code = ? AND user_id = ?").bind(artwork.code, user.id).run();
      else {
        await database.prepare("INSERT INTO artwork_likes(user_id, artwork_code) VALUES(?, ?)").bind(user.id, artwork.code).run();
        await recordFamiliarMissionActivity(database, { customerId: user.id, activity: "artwork_like", sourceKey: artwork.code });
      }
      return Response.json(await payload(database, artwork.code, viewer));
    }
    if (action === "comment") {
      const text = typeof body.comment === "string" ? body.comment.trim() : "";
      if (text.length < ART_COMMENT_LIMITS.minimum || text.length > ART_COMMENT_LIMITS.maximum) return Response.json({ error: `Il commento deve contenere da ${ART_COMMENT_LIMITS.minimum} a ${ART_COMMENT_LIMITS.maximum} caratteri.` }, { status: 400 });
      const recent = await database.prepare("SELECT 1 FROM artwork_comments WHERE user_id = ? AND created_at > datetime('now', ?) LIMIT 1").bind(user.id, `-${ART_COMMENT_LIMITS.cooldownSeconds} seconds`).first();
      if (recent) return Response.json({ error: `Attendi ${ART_COMMENT_LIMITS.cooldownSeconds} secondi prima di pubblicare ancora.` }, { status: 429 });
      const parentId = typeof body.parentCommentId === "string" ? body.parentCommentId : null;
      let recipient: string | null = null;
      if (parentId) {
        const parent = await database.prepare("SELECT user_id, parent_comment_id FROM artwork_comments WHERE id = ? AND artwork_code = ? AND status = 'visible'").bind(parentId, artwork.code).first<{ user_id: string; parent_comment_id: string | null }>();
        if (!parent || parent.parent_comment_id) return Response.json({ error: "Puoi rispondere soltanto al commento principale." }, { status: 400 });
        recipient = parent.user_id;
      }
      const id = crypto.randomUUID();
      await database.prepare("INSERT INTO artwork_comments(id,user_id,artwork_code,parent_comment_id,body) VALUES(?,?,?,?,?)").bind(id, user.id, artwork.code, parentId, text).run();
      if (meaningfulMissionComment(text)) {
        await recordFamiliarMissionActivity(database, { customerId: user.id, activity: "meaningful_comment", sourceKey: artwork.code, qualityScore: text.length });
      }
      if (recipient) await createUserNotification(database, { userId: recipient, actorUserId: user.id, type: "reply", artworkCode: artwork.code, commentId: id, title: "Nuova risposta al tuo commento", message: `${artwork.title || "Un'opera"}: qualcuno ha risposto alla conversazione.`, targetUrl: `/arte/${artwork.slug}#community-${artwork.code}`, groupKey: `reply:${id}` });
      return Response.json(await payload(database, artwork.code, viewer), { status: 201 });
    }
    const commentId = typeof body.commentId === "string" ? body.commentId : "";
    if (!/^[0-9a-f-]{36}$/i.test(commentId)) return Response.json({ error: "Commento non valido." }, { status: 400 });
    const target = await database.prepare("SELECT user_id FROM artwork_comments WHERE id = ? AND artwork_code = ? AND status = 'visible'").bind(commentId, artwork.code).first<{ user_id: string }>();
    if (!target) return Response.json({ error: "Commento non disponibile." }, { status: 404 });
    if (action === "toggle_comment_like") {
      const exists = await database.prepare("SELECT 1 FROM artwork_comment_likes WHERE user_id = ? AND comment_id = ?").bind(user.id, commentId).first();
      if (exists) await database.prepare("DELETE FROM artwork_comment_likes WHERE user_id = ? AND comment_id = ?").bind(user.id, commentId).run();
      else {
        await database.prepare("INSERT INTO artwork_comment_likes(user_id,comment_id) VALUES(?,?)").bind(user.id, commentId).run();
        if (target.user_id !== user.id) await recordFamiliarMissionActivity(database, { customerId: user.id, activity: "comment_like", sourceKey: commentId });
        await createUserNotification(database, { userId: target.user_id, actorUserId: user.id, type: "comment_like", artworkCode: artwork.code, commentId, title: "Il tuo commento è piaciuto", message: `Una nuova reazione su ${artwork.title || "un'opera"}.`, targetUrl: `/arte/${artwork.slug}#community-${artwork.code}`, groupKey: `comment-like:${commentId}` });
      }
      return Response.json(await payload(database, artwork.code, viewer));
    }
    if (action === "edit_comment") {
      const text = typeof body.comment === "string" ? body.comment.trim() : "";
      if (text.length < ART_COMMENT_LIMITS.minimum || text.length > ART_COMMENT_LIMITS.maximum) return Response.json({ error: "Lunghezza del commento non valida." }, { status: 400 });
      const result = await database.prepare("UPDATE artwork_comments SET body=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND status='visible'").bind(text, commentId, user.id).run();
      if (!result.meta.changes) return Response.json({ error: "Non puoi modificare questo commento." }, { status: 403 });
      return Response.json(await payload(database, artwork.code, viewer));
    }
    if (action === "delete_comment") {
      const result = await database.prepare("UPDATE artwork_comments SET status='deleted',body='',updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND status='visible'").bind(commentId, user.id).run();
      if (!result.meta.changes) return Response.json({ error: "Non puoi eliminare questo commento." }, { status: 403 });
      return Response.json(await payload(database, artwork.code, viewer));
    }
    if (action === "report_comment") {
      const reason = typeof body.reason === "string" ? body.reason : "";
      if (!(ART_REPORT_REASONS as readonly string[]).includes(reason) || target.user_id === user.id) return Response.json({ error: "Segnalazione non valida." }, { status: 400 });
      const previous = await database.prepare("SELECT id, status FROM artwork_comment_reports WHERE comment_id = ? AND reporter_user_id = ?").bind(commentId, user.id).first<{ id: string; status: string }>();
      if (previous?.status === "open") return Response.json({ error: "Hai già segnalato questo commento." }, { status: 409 });
      if (previous) await database.prepare("UPDATE artwork_comment_reports SET reason = ?, status = 'open', created_at = CURRENT_TIMESTAMP, resolved_at = NULL, resolved_by = NULL WHERE id = ?").bind(reason, previous.id).run();
      else await database.prepare("INSERT INTO artwork_comment_reports(id,comment_id,reporter_user_id,reason) VALUES(?,?,?,?)").bind(crypto.randomUUID(), commentId, user.id, reason).run();
      return Response.json({ message: "Segnalazione ricevuta." });
    }
    return Response.json({ error: "Azione non valida." }, { status: 400 });
  } catch { return Response.json({ error: "Operazione non completata. Riprova più tardi." }, { status: 503 }); }
}
