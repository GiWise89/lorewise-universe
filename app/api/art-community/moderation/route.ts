import { env } from "@/lib/netlifyRuntime";

import { ensureArtCommunityTables } from "@/lib/artCommunityServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };
type Moderator = { id: string; email: string; role: "admin" | "moderator" };

type ReportRow = {
  comment_id: string;
  artwork_code: string;
  body: string;
  comment_status: string;
  author_id: string;
  author_name: string | null;
  author_email: string;
  report_count: number;
  reasons: string;
  reported_at: string;
};

type BlockedAccountRow = {
  id: string;
  email: string;
  display_name: string | null;
  updated_at: string;
};

type HiddenCommentRow = {
  id: string;
  artwork_code: string;
  body: string;
  author_name: string | null;
  author_email: string;
  updated_at: string;
};

async function requireModerator() {
  const client = await createLoreWiseServerClient();
  if (!client) return { error: Response.json({ error: "Accesso non configurato." }, { status: 503 }) };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) return { error: Response.json({ error: "Accesso richiesto." }, { status: 401 }) };
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return { error: Response.json({ error: "Archivio di moderazione non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(data.user);
  await ensureArtCommunityTables(database);
  const customer = await database.prepare("SELECT role, status FROM customers WHERE id = ?").bind(data.user.id).first<{ role: string; status: string }>();
  if (!customer || customer.status !== "active" || !["admin", "moderator"].includes(customer.role)) {
    return { error: Response.json({ error: "Non hai i permessi per gestire la Community." }, { status: 403 }) };
  }
  return { database, moderator: { id: data.user.id, email: data.user.email, role: customer.role as Moderator["role"] } };
}

async function moderationPayload(database: D1Database, moderator: Moderator) {
  const reports = await database.prepare(`SELECT reports.comment_id, comments.artwork_code, comments.body,
      comments.status AS comment_status, comments.user_id AS author_id, authors.display_name AS author_name,
      authors.email AS author_email, COUNT(*) AS report_count, GROUP_CONCAT(DISTINCT reports.reason) AS reasons,
      MIN(reports.created_at) AS reported_at
    FROM artwork_comment_reports AS reports
    JOIN artwork_comments AS comments ON comments.id = reports.comment_id
    JOIN customers AS authors ON authors.id = comments.user_id
    WHERE reports.status = 'open'
    GROUP BY reports.comment_id, comments.artwork_code, comments.body, comments.status,
      comments.user_id, authors.display_name, authors.email
    ORDER BY reported_at ASC LIMIT 100`).all<ReportRow>();
  const stats = await database.prepare(`SELECT
    (SELECT COUNT(*) FROM artwork_comment_reports WHERE status = 'open') AS open_reports,
    (SELECT COUNT(*) FROM artwork_comments WHERE status = 'visible') AS visible_comments,
    (SELECT COUNT(*) FROM artwork_comments WHERE status = 'hidden') AS hidden_comments,
    (SELECT COUNT(*) FROM customers WHERE status = 'blocked') AS blocked_accounts`).first<Record<string, number>>();
  const events = await database.prepare(`SELECT action, comment_id, target_user_id, note, created_at
    FROM community_moderation_events ORDER BY created_at DESC LIMIT 25`).all<{
      action: string; comment_id: string | null; target_user_id: string | null; note: string | null; created_at: string;
    }>();
  const blockedAccounts = await database.prepare(`SELECT id, email, display_name, updated_at
    FROM customers WHERE status = 'blocked' ORDER BY updated_at DESC LIMIT 100`).all<BlockedAccountRow>();
  const hiddenComments = await database.prepare(`SELECT comments.id, comments.artwork_code, comments.body,
      authors.display_name AS author_name, authors.email AS author_email, comments.updated_at
    FROM artwork_comments AS comments JOIN customers AS authors ON authors.id = comments.user_id
    WHERE comments.status = 'hidden' ORDER BY comments.updated_at DESC LIMIT 100`).all<HiddenCommentRow>();
  return {
    moderator,
    stats: {
      openReports: Number(stats?.open_reports ?? 0),
      visibleComments: Number(stats?.visible_comments ?? 0),
      hiddenComments: Number(stats?.hidden_comments ?? 0),
      blockedAccounts: Number(stats?.blocked_accounts ?? 0),
    },
    reports: reports.results.map((report) => ({
      commentId: report.comment_id,
      artworkCode: report.artwork_code,
      body: report.body,
      commentStatus: report.comment_status,
      authorId: report.author_id,
      authorName: report.author_name?.trim() || "Membro LoreWise",
      authorEmail: report.author_email,
      reportCount: Number(report.report_count),
      reasons: report.reasons.split(","),
      reportedAt: report.reported_at,
    })),
    blockedAccounts: blockedAccounts.results.map((account) => ({
      id: account.id,
      email: account.email,
      displayName: account.display_name?.trim() || "Membro LoreWise",
      blockedAt: account.updated_at,
    })),
    hiddenComments: hiddenComments.results.map((comment) => ({
      id: comment.id,
      artworkCode: comment.artwork_code,
      body: comment.body,
      authorName: comment.author_name?.trim() || "Membro LoreWise",
      authorEmail: comment.author_email,
      hiddenAt: comment.updated_at,
    })),
    events: events.results.map((event) => ({
      action: event.action,
      commentId: event.comment_id,
      targetUserId: event.target_user_id,
      note: event.note,
      createdAt: event.created_at,
    })),
  };
}

export async function GET() {
  try {
    const authenticated = await requireModerator();
    if (authenticated.error) return authenticated.error;
    return Response.json(await moderationPayload(authenticated.database, authenticated.moderator), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile caricare la moderazione." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authenticated = await requireModerator();
    if (authenticated.error) return authenticated.error;
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const commentId = typeof body.commentId === "string" ? body.commentId : "";
    const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : "";
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";

    if (action === "unblock_account") {
      if (authenticated.moderator.role !== "admin") {
        return Response.json({ error: "Questa azione è riservata all’amministratore." }, { status: 403 });
      }
      if (!/^[0-9a-f-]{36}$/i.test(targetUserId)) return Response.json({ error: "Account non valido." }, { status: 400 });
      if (targetUserId === authenticated.moderator.id) return Response.json({ error: "Non puoi modificare il tuo account amministratore." }, { status: 400 });
      const targetAccount = await authenticated.database.prepare("SELECT status FROM customers WHERE id = ?")
        .bind(targetUserId).first<{ status: string }>();
      if (!targetAccount) return Response.json({ error: "Account non trovato." }, { status: 404 });
      if (targetAccount.status !== "blocked") return Response.json({ error: "L’account non risulta bloccato." }, { status: 409 });
      await authenticated.database.prepare("UPDATE customers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(targetUserId).run();
      await authenticated.database.prepare(`INSERT INTO community_moderation_events
        (id, moderator_user_id, action, comment_id, target_user_id, note) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), authenticated.moderator.id, action, null, targetUserId, note || null).run();
      return Response.json({ ...(await moderationPayload(authenticated.database, authenticated.moderator)), message: "Account sbloccato e azione registrata." }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (!/^[0-9a-f-]{36}$/i.test(commentId)) return Response.json({ error: "Commento non valido." }, { status: 400 });
    const target = await authenticated.database.prepare(`SELECT user_id, status FROM artwork_comments WHERE id = ?`)
      .bind(commentId).first<{ user_id: string; status: string }>();
    if (!target) return Response.json({ error: "Commento non trovato." }, { status: 404 });

    if (["delete_comment", "block_author"].includes(action) && authenticated.moderator.role !== "admin") {
      return Response.json({ error: "Questa azione è riservata all’amministratore." }, { status: 403 });
    }
    if (action === "hide_comment") {
      await authenticated.database.prepare("UPDATE artwork_comments SET status = 'hidden', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(commentId).run();
    } else if (action === "restore_comment") {
      await authenticated.database.prepare("UPDATE artwork_comments SET status = 'visible', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(commentId).run();
      await authenticated.database.prepare("UPDATE artwork_comment_reports SET status = 'resolved' WHERE comment_id = ? AND status = 'open'").bind(commentId).run();
    } else if (action === "delete_comment") {
      await authenticated.database.prepare("UPDATE artwork_comments SET status = 'deleted', body = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(commentId).run();
      await authenticated.database.prepare("UPDATE artwork_comment_reports SET status = 'resolved' WHERE comment_id = ? AND status = 'open'").bind(commentId).run();
    } else if (action === "dismiss_reports") {
      await authenticated.database.prepare("UPDATE artwork_comment_reports SET status = 'dismissed' WHERE comment_id = ? AND status = 'open'").bind(commentId).run();
    } else if (action === "block_author") {
      if (target.user_id === authenticated.moderator.id) return Response.json({ error: "Non puoi bloccare il tuo account amministratore." }, { status: 400 });
      await authenticated.database.prepare("UPDATE customers SET status = 'blocked', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(target.user_id).run();
      await authenticated.database.prepare("UPDATE artwork_comments SET status = 'hidden', updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'visible'").bind(target.user_id).run();
      await authenticated.database.prepare(`UPDATE artwork_comment_reports SET status = 'resolved' WHERE status = 'open'
        AND comment_id IN (SELECT id FROM artwork_comments WHERE user_id = ?)`).bind(target.user_id).run();
    } else {
      return Response.json({ error: "Azione di moderazione non valida." }, { status: 400 });
    }

    await authenticated.database.prepare(`INSERT INTO community_moderation_events
      (id, moderator_user_id, action, comment_id, target_user_id, note) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), authenticated.moderator.id, action, commentId, target.user_id, note || null).run();
    return Response.json({ ...(await moderationPayload(authenticated.database, authenticated.moderator)), message: "Azione registrata nell’archivio di moderazione." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Azione di moderazione non completata." }, { status: 503 });
  }
}
