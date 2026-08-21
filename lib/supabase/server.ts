import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

async function isLocalRequest() {
  try {
    const requestHeaders = await headers();
    const rawHost = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "").toLowerCase();
    const host = rawHost.startsWith("[") ? rawHost.slice(0, rawHost.indexOf("]") + 1) : rawHost.split(":")[0];
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

export async function createLoreWiseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // I Server Component non possono sempre aggiornare cookie; proxy.ts gestirà il rinnovo.
        }
      },
    },
  });
}

export async function getLoreWiseUser() {
  const client = await createLoreWiseServerClient();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (!error && data.user) return data.user;
  } catch {
    // Il recupero locale sottostante gestisce un provider temporaneamente irraggiungibile.
  }

  if (await isLocalRequest()) {
    try {
      const { data } = await client.auth.getSession();
      return data.session?.user ?? null;
    } catch {
      return null;
    }
  }

  return null;
}
