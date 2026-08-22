import type { User } from "@supabase/supabase-js";

import { ART_COMMENT_LIMITS, ART_REPORT_REASONS } from "@/lib/artCommunity";
import { localAccountProfile } from "@/lib/localAccountFallback";
import { profileCompletion } from "@/lib/profileCompletion";

type RuntimeEnv = { LOREWISE_ADMIN_EMAILS?: string };
type LocalComment = {
  id: string;
  artworkCode: string;
  userId: string;
  parentId: string | null;
  body: string;
  name: string;
  username: string | null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
};
type LocalCommunityStore = { artworkLikes: Set<string>; commentLikes: Set<string>; comments: LocalComment[] };

const globalStore = globalThis as typeof globalThis & { __lorewiseLocalArtCommunity?: LocalCommunityStore };
const store = globalStore.__lorewiseLocalArtCommunity ??= {
  artworkLikes: new Set<string>(),
  commentLikes: new Set<string>(),
  comments: [],
};

function viewer(user: User | null, runtime: RuntimeEnv) {
  if (!user) return null;
  const profile = localAccountProfile(user, runtime);
  const complete = profileCompletion({ displayName: profile.displayName, username: profile.username }).profileComplete;
  return { id: user.id, canParticipate: profile.status === "active" && complete, name: profile.displayName || profile.username || "Membro LoreWise", username: profile.profileVisibility === "public" ? profile.username || null : null };
}

type SerializedComment = {
  id: string; name: string; username: string | null; avatarUrl: string | null; body: string; createdAt: string;
  edited: boolean; ownedByViewer: boolean; membershipBadge: null; likeCount: number; viewerLiked: boolean; replies: SerializedComment[];
};

function serialize(comment: LocalComment, userId: string | null): SerializedComment {
  return {
    id: comment.id,
    name: comment.name,
    username: comment.username,
    avatarUrl: comment.username ? `/api/profile-avatar/${encodeURIComponent(comment.username)}` : null,
    body: comment.body,
    createdAt: comment.createdAt,
    edited: comment.updatedAt !== comment.createdAt,
    ownedByViewer: comment.userId === userId,
    membershipBadge: null,
    likeCount: [...store.commentLikes].filter((key) => key.startsWith(`${comment.id}:`)).length,
    viewerLiked: userId ? store.commentLikes.has(`${comment.id}:${userId}`) : false,
    replies: [],
  };
}

export function localArtCommunityPayload(artworkCode: string, user: User | null, runtime: RuntimeEnv) {
  const current = viewer(user, runtime);
  const visible = store.comments.filter((entry) => entry.artworkCode === artworkCode && !entry.deleted);
  const roots = visible.filter((entry) => !entry.parentId).map((entry) => serialize(entry, current?.id ?? null));
  const byId = new Map(roots.map((entry) => [entry.id, entry]));
  for (const reply of visible.filter((entry) => entry.parentId)) byId.get(reply.parentId!)?.replies.push(serialize(reply, current?.id ?? null));
  return {
    authenticated: Boolean(user),
    canParticipate: Boolean(current?.canParticipate),
    likeCount: [...store.artworkLikes].filter((key) => key.startsWith(`${artworkCode}:`)).length,
    viewerLiked: current ? store.artworkLikes.has(`${artworkCode}:${current.id}`) : false,
    comments: roots.reverse(),
  };
}

export function updateLocalArtCommunity(artworkCode: string, user: User | null, runtime: RuntimeEnv, body: Record<string, unknown>) {
  const current = viewer(user, runtime);
  if (!user || !current) return { status: 401, body: { error: "Accedi al tuo LoreWise ID per partecipare." } };
  if (!current.canParticipate) return { status: 403, body: { error: "Completa nome pubblico e nickname prima di partecipare." } };
  const action = typeof body.action === "string" ? body.action : "";
  if (action === "toggle_like") {
    const key = `${artworkCode}:${user.id}`;
    if (store.artworkLikes.has(key)) store.artworkLikes.delete(key); else store.artworkLikes.add(key);
    return { status: 200, body: localArtCommunityPayload(artworkCode, user, runtime) };
  }
  if (action === "comment") {
    const text = typeof body.comment === "string" ? body.comment.trim() : "";
    if (text.length < ART_COMMENT_LIMITS.minimum || text.length > ART_COMMENT_LIMITS.maximum) return { status: 400, body: { error: `Il commento deve contenere da ${ART_COMMENT_LIMITS.minimum} a ${ART_COMMENT_LIMITS.maximum} caratteri.` } };
    const parentId = typeof body.parentCommentId === "string" ? body.parentCommentId : null;
    if (parentId && !store.comments.some((entry) => entry.id === parentId && entry.artworkCode === artworkCode && !entry.parentId && !entry.deleted)) return { status: 400, body: { error: "Puoi rispondere soltanto al commento principale." } };
    const now = new Date().toISOString();
    store.comments.push({ id: crypto.randomUUID(), artworkCode, userId: user.id, parentId, body: text, name: current.name, username: current.username, createdAt: now, updatedAt: now, deleted: false });
    return { status: 201, body: localArtCommunityPayload(artworkCode, user, runtime) };
  }
  const commentId = typeof body.commentId === "string" ? body.commentId : "";
  const target = store.comments.find((entry) => entry.id === commentId && entry.artworkCode === artworkCode && !entry.deleted);
  if (!target) return { status: 404, body: { error: "Commento non disponibile." } };
  if (action === "toggle_comment_like") {
    const key = `${commentId}:${user.id}`;
    if (store.commentLikes.has(key)) store.commentLikes.delete(key); else store.commentLikes.add(key);
    return { status: 200, body: localArtCommunityPayload(artworkCode, user, runtime) };
  }
  if (action === "edit_comment") {
    if (target.userId !== user.id) return { status: 403, body: { error: "Non puoi modificare questo commento." } };
    const text = typeof body.comment === "string" ? body.comment.trim() : "";
    if (text.length < ART_COMMENT_LIMITS.minimum || text.length > ART_COMMENT_LIMITS.maximum) return { status: 400, body: { error: "Lunghezza del commento non valida." } };
    target.body = text; target.updatedAt = new Date().toISOString();
    return { status: 200, body: localArtCommunityPayload(artworkCode, user, runtime) };
  }
  if (action === "delete_comment") {
    if (target.userId !== user.id) return { status: 403, body: { error: "Non puoi eliminare questo commento." } };
    target.deleted = true; target.body = ""; target.updatedAt = new Date().toISOString();
    return { status: 200, body: localArtCommunityPayload(artworkCode, user, runtime) };
  }
  if (action === "report_comment") {
    const reason = typeof body.reason === "string" ? body.reason : "";
    if (!(ART_REPORT_REASONS as readonly string[]).includes(reason) || target.userId === user.id) return { status: 400, body: { error: "Segnalazione non valida." } };
    return { status: 200, body: { message: "Segnalazione ricevuta nell’anteprima locale." } };
  }
  return { status: 400, body: { error: "Azione non valida." } };
}
