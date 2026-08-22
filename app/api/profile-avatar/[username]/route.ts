import { env } from "@/lib/netlifyRuntime";
import { normalizeUsername } from "@/lib/publicProfile";
import { ensureLoreWiseCustomersTable } from "@/lib/supabase/customer";
import { isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { localProfileAvatarForUsername } from "@/lib/localProfileAvatar";

type RuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

export async function GET(_request: Request, context: { params: Promise<{ username: string }> }) {
  const { username: raw } = await context.params;
  const username = normalizeUsername(raw);
  if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
    const avatar = localProfileAvatarForUsername(username);
    if (!avatar) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(avatar.bytes).buffer, { headers: { "Content-Type": avatar.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  }
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB || !runtime.COMMISSION_UPLOADS) return new Response(null, { status: 404 });
  await ensureLoreWiseCustomersTable(runtime.DB);
  const profile = await runtime.DB.prepare(`SELECT avatar_object_key, avatar_content_type FROM customers
    WHERE username = ? AND profile_visibility = 'public' AND status = 'active'`).bind(username)
    .first<{ avatar_object_key: string | null; avatar_content_type: string | null }>();
  if (!profile?.avatar_object_key) return new Response(null, { status: 404 });
  const object = await runtime.COMMISSION_UPLOADS.get(profile.avatar_object_key);
  if (!object) return new Response(null, { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": profile.avatar_content_type || object.httpMetadata?.contentType || "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
