import { env } from "@/lib/netlifyRuntime";
import { ACCOUNT_PROFILE_LIMITS } from "@/lib/accountPolicy";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { localAccountProfile, netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { removeLocalProfileAvatar, saveLocalProfileAvatar } from "@/lib/localProfileAvatar";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket; LOREWISE_ADMIN_EMAILS?: string };

function detectedType(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

async function authenticated() {
  const user = await getLoreWiseUser();
  if (!user) return { response: Response.json({ error: "Accedi al tuo LoreWise ID." }, { status: 401 }) };
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return { response: Response.json({ error: "Archivio immagini non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(user);
  return { user, database: runtime.DB, bucket: runtime.COMMISSION_UPLOADS };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File)) return Response.json({ error: "Scegli un'immagine." }, { status: 400 });
  if (file.size < 32 || file.size > ACCOUNT_PROFILE_LIMITS.avatarBytes) return Response.json({ error: "L'immagine deve pesare meno di 2 MB." }, { status: 400 });
  const buffer = await file.arrayBuffer();
  const contentType = detectedType(new Uint8Array(buffer).slice(0, 16));
  if (!contentType) return Response.json({ error: "Formato non valido. Usa PNG, JPG o WebP." }, { status: 400 });
  const extension = contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : "webp";
  if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
    const user = await getLoreWiseUser();
    if (!user) return Response.json({ error: "Accedi al tuo LoreWise ID." }, { status: 401 });
    const profile = localAccountProfile(user, env as unknown as RuntimeEnv);
    const saved = saveLocalProfileAvatar({
      userId: user.id,
      username: profile.username,
      contentType,
      bytes: new Uint8Array(buffer),
    });
    return Response.json({ message: "Immagine del profilo aggiornata.", avatarUrl: profile.username ? `/api/profile-avatar/${encodeURIComponent(profile.username)}?v=${encodeURIComponent(saved.updatedAt)}` : null });
  }
  const auth = await authenticated();
  if ("response" in auth) return auth.response;
  const objectKey = `profile-avatars/${auth.user.id}/avatar.${extension}`;
  const previous = await auth.database.prepare("SELECT avatar_object_key FROM customers WHERE id = ?").bind(auth.user.id).first<{ avatar_object_key: string | null }>();
  await auth.bucket.put(objectKey, buffer, { httpMetadata: { contentType }, customMetadata: { size: String(file.size), owner: auth.user.id } });
  await auth.database.prepare("UPDATE customers SET avatar_object_key = ?, avatar_content_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(objectKey, contentType, auth.user.id).run();
  if (previous?.avatar_object_key && previous.avatar_object_key !== objectKey) await auth.bucket.delete(previous.avatar_object_key);
  return Response.json({ message: "Immagine del profilo aggiornata." });
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
  if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
    const user = await getLoreWiseUser();
    if (!user) return Response.json({ error: "Accedi al tuo LoreWise ID." }, { status: 401 });
    removeLocalProfileAvatar(user.id);
    return Response.json({ message: "Immagine del profilo rimossa." });
  }
  const auth = await authenticated();
  if ("response" in auth) return auth.response;
  const previous = await auth.database.prepare("SELECT avatar_object_key FROM customers WHERE id = ?").bind(auth.user.id).first<{ avatar_object_key: string | null }>();
  if (previous?.avatar_object_key) await auth.bucket.delete(previous.avatar_object_key);
  await auth.database.prepare("UPDATE customers SET avatar_object_key = NULL, avatar_content_type = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(auth.user.id).run();
  return Response.json({ message: "Immagine del profilo rimossa." });
}
