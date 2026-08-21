import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/accountPolicy";
import { ensureAccountDeletionRequestsTable } from "@/lib/accountDeletion";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };

async function authenticatedAccount() {
  const client = await createLoreWiseServerClient();
  if (!client) return { error: Response.json({ error: "Accesso non configurato." }, { status: 503 }) };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) return { error: Response.json({ error: "Sessione non valida." }, { status: 401 }) };
  const { env } = await import("cloudflare:workers");
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return { error: Response.json({ error: "Archivio personale non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(data.user);
  await ensureAccountDeletionRequestsTable(database);
  return { client, database, user: data.user };
}

export async function POST(request: Request) {
  try {
    const authenticated = await authenticatedAccount();
    if (authenticated.error) return authenticated.error;
    const body = await request.json() as Record<string, unknown>;
    if (body.confirmation !== ACCOUNT_DELETION_CONFIRMATION || body.understood !== true) {
      return Response.json({ error: "La conferma di cancellazione non è completa." }, { status: 400 });
    }
    const customer = await authenticated.database.prepare("SELECT role, status FROM customers WHERE id = ?")
      .bind(authenticated.user.id).first<{ role: string; status: string }>();
    if (!customer || customer.status === "blocked") return Response.json({ error: "L’account non può inviare questa richiesta." }, { status: 403 });
    if (customer.role === "admin") {
      const admins = await authenticated.database.prepare("SELECT COUNT(*) AS total FROM customers WHERE role = 'admin' AND status = 'active'")
        .first<{ total: number }>();
      if (Number(admins?.total ?? 0) <= 1) {
        return Response.json({ error: "Prima di cancellare l’unico amministratore deve essere assegnato un secondo account amministrativo." }, { status: 409 });
      }
    }
    const pending = await authenticated.database.prepare("SELECT id, requested_at FROM account_deletion_requests WHERE customer_id = ? AND status = 'pending' ORDER BY requested_at DESC LIMIT 1")
      .bind(authenticated.user.id).first<{ id: string; requested_at: string }>();
    if (!pending) {
      await authenticated.database.prepare("INSERT INTO account_deletion_requests (id, customer_id, status) VALUES (?, ?, 'pending')")
        .bind(crypto.randomUUID(), authenticated.user.id).run();
    }
    await authenticated.database.prepare(`UPDATE customers SET status = 'deletion_requested', community_emails = 0,
      studio_updates_emails = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(authenticated.user.id).run();
    const current = pending ?? await authenticated.database.prepare("SELECT id, requested_at FROM account_deletion_requests WHERE customer_id = ? AND status = 'pending' ORDER BY requested_at DESC LIMIT 1")
      .bind(authenticated.user.id).first<{ id: string; requested_at: string }>();
    return Response.json({ status: "deletion_requested", requestedAt: current?.requested_at, message: "Richiesta registrata. Le interazioni Community sono state sospese." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile registrare la richiesta." }, { status: 503 });
  }
}

export async function DELETE() {
  try {
    const authenticated = await authenticatedAccount();
    if (authenticated.error) return authenticated.error;
    const pending = await authenticated.database.prepare("SELECT id FROM account_deletion_requests WHERE customer_id = ? AND status = 'pending' ORDER BY requested_at DESC LIMIT 1")
      .bind(authenticated.user.id).first<{ id: string }>();
    if (!pending) return Response.json({ error: "Non risultano richieste da annullare." }, { status: 404 });
    await authenticated.database.batch([
      authenticated.database.prepare("UPDATE account_deletion_requests SET status = 'canceled', canceled_at = CURRENT_TIMESTAMP WHERE id = ?").bind(pending.id),
      authenticated.database.prepare("UPDATE customers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'deletion_requested'").bind(authenticated.user.id),
    ]);
    return Response.json({ status: "active", message: "Richiesta annullata. L’account è nuovamente attivo." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Non è stato possibile annullare la richiesta." }, { status: 503 });
  }
}
