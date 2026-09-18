import { redirect } from "next/navigation";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";
import { getLoreWiseUser } from "@/lib/supabase/server";

/**
 * Protegge le pagine del Centro Admin. In produzione serve il ruolo amministratore attivo;
 * in sviluppo resta sufficiente l’accesso, così le anteprime locali senza database continuano a funzionare.
 */
export async function requireAdminPage(options?: { allowAnonymousInDevelopment?: boolean }) {
  if (process.env.NODE_ENV !== "production") {
    if (options?.allowAnonymousInDevelopment) return;
    if (!await getLoreWiseUser()) redirect("/account");
    return;
  }
  const auth = await requireOrderAdmin();
  if ("response" in auth) redirect("/account");
}
