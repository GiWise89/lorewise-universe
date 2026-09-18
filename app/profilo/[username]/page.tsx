import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/netlifyRuntime";
import { avatarUrl, normalizeUsername } from "@/lib/publicProfile";
import { ensureLoreWiseCustomersTable } from "@/lib/supabase/customer";

type RuntimeEnv = { DB?: D1Database };
type PublicProfile = { display_name: string | null; username: string; avatar_object_key: string | null; created_at: string };

const loadPublicProfile = cache(async (raw: string): Promise<PublicProfile | null> => {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return null;
  await ensureLoreWiseCustomersTable(database);
  const username = normalizeUsername(raw);
  return database.prepare(`SELECT display_name, username, avatar_object_key, created_at FROM customers
    WHERE username = ? AND profile_visibility = 'public' AND status = 'active'`).bind(username)
    .first<PublicProfile>();
});

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username: raw } = await params;
  const profile = await loadPublicProfile(raw);
  if (!profile) return { title: "Profilo non disponibile", robots: { index: false, follow: false } };
  const name = profile.display_name || profile.username;
  const image = avatarUrl(profile.username, Boolean(profile.avatar_object_key));
  const description = `Il profilo pubblico di ${name} (@${profile.username}) nel LoreWise Universe.`;
  return {
    title: `${name} (@${profile.username})`,
    description,
    alternates: { canonical: `/profilo/${encodeURIComponent(profile.username)}` },
    openGraph: { type: "profile", title: `${name} · Profilo LoreWise`, description, username: profile.username, ...(image ? { images: [{ url: image, alt: `Immagine del profilo di ${name}` }] } : {}) },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  const profile = await loadPublicProfile(raw);
  if (!profile) notFound();
  const image = avatarUrl(profile.username, Boolean(profile.avatar_object_key));
  return <main className="public-profile-page"><section className="public-profile-card">
    {image ? <Image src={image} alt={`Immagine del profilo di ${profile.display_name || profile.username}`} width={240} height={240} unoptimized /> : <div className="public-profile-fallback" aria-hidden="true">{(profile.display_name || profile.username).slice(0, 1).toUpperCase()}</div>}
    <div><p className="eyebrow">Profilo LoreWise</p><h1>{profile.display_name || profile.username}</h1><strong>@{profile.username}</strong><small>Membro dal {new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(profile.created_at))}</small></div>
  </section></main>;
}
