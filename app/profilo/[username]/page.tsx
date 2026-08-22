import Image from "next/image";
import { notFound } from "next/navigation";
import { env } from "@/lib/netlifyRuntime";
import { avatarUrl, normalizeUsername } from "@/lib/publicProfile";
import { ensureLoreWiseCustomersTable } from "@/lib/supabase/customer";

type RuntimeEnv = { DB?: D1Database };

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) notFound();
  await ensureLoreWiseCustomersTable(database);
  const { username: raw } = await params;
  const username = normalizeUsername(raw);
  const profile = await database.prepare(`SELECT display_name, username, avatar_object_key, created_at FROM customers
    WHERE username = ? AND profile_visibility = 'public' AND status = 'active'`).bind(username)
    .first<{ display_name: string | null; username: string; avatar_object_key: string | null; created_at: string }>();
  if (!profile) notFound();
  const image = avatarUrl(profile.username, Boolean(profile.avatar_object_key));
  return <main className="public-profile-page"><section className="public-profile-card">
    {image ? <Image src={image} alt={`Immagine del profilo di ${profile.display_name || profile.username}`} width={240} height={240} unoptimized /> : <div className="public-profile-fallback" aria-hidden="true">{(profile.display_name || profile.username).slice(0, 1).toUpperCase()}</div>}
    <div><p className="eyebrow">Profilo LoreWise</p><h1>{profile.display_name || profile.username}</h1><strong>@{profile.username}</strong><small>Membro dal {new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(profile.created_at))}</small></div>
  </section></main>;
}
