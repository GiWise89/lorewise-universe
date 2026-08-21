import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function createLoreWiseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.publishableKey, {
    auth: { detectSessionInUrl: false },
  });
}

export function createLoreWiseRecoveryClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createClient(config.url, config.publishableKey, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
