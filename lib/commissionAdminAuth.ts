import { env } from "@/lib/netlifyRuntime";

import { headers } from "next/headers";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

export type CommissionAdmin = {
  displayName: string;
  email: string;
  localPreview: boolean;
};

type RuntimeEnv = { DB?: D1Database };

async function isLocalDevelopmentRequest() {
  if (process.env.NODE_ENV === "production") return false;
  const host = (await headers()).get("host")?.split(":")[0]?.toLocaleLowerCase("it");
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export async function getCommissionAdmin(): Promise<CommissionAdmin | null> {
  if (await isLocalDevelopmentRequest()) {
    return { displayName: "GiWise Studio", email: "anteprima-locale", localPreview: true };
  }

  const client = await createLoreWiseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) return null;

  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB) return null;

  await syncLoreWiseCustomer(data.user);
  await ensureCommerceTables(runtime.DB);
  const customer = await runtime.DB.prepare("SELECT display_name, role, status FROM customers WHERE id = ?")
    .bind(data.user.id)
    .first<{ display_name: string | null; role: string; status: string }>();
  if (!customer || customer.role !== "admin" || customer.status !== "active") return null;

  return {
    displayName: customer.display_name?.trim() || data.user.email,
    email: data.user.email,
    localPreview: false,
  };
}

export async function requireCommissionAdminApi() {
  const admin = await getCommissionAdmin();
  if (!admin) {
    return {
      admin: null,
      response: Response.json({ error: "Sessione amministratore LoreWise non valida." }, { status: 401 }),
    } as const;
  }
  return { admin, response: null } as const;
}
