import { ensureBenefitEngineTables } from "@/lib/benefitEngine";
import { codexEntries } from "@/lib/codex";
import { requireVipAccess } from "@/lib/vipAccess";
import { isLocalLoreWiseRequest } from "@/lib/supabase/server";

type SuggestionRow = {
  id: string;
  requested_name: string;
  universe: string;
  reason: string;
  status: string;
  created_at: string;
};

function serialize(row: SuggestionRow) {
  return {
    id: row.id,
    character: row.requested_name,
    universe: row.universe,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function isLocalVipPreview() {
  return process.env.NODE_ENV !== "production" && await isLocalLoreWiseRequest();
}

export async function GET() {
  if (await isLocalVipPreview()) {
    return Response.json({ vip: true, localOnly: true, suggestions: [] });
  }
  const access = await requireVipAccess();
  if ("error" in access) return access.error;
  const database = access.runtime.DB;
  if (!database) return Response.json({ vip: true, localOnly: true, suggestions: [] });
  await ensureBenefitEngineTables(database);
  const rows = await database.prepare(`SELECT id, requested_name, universe, reason, status, created_at
    FROM codex_character_suggestions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 40`)
    .bind(access.user.id).all<SuggestionRow>();
  return Response.json({ vip: true, localOnly: false, suggestions: rows.results.map(serialize) });
}

export async function POST(request: Request) {
  const localPreview = await isLocalVipPreview();
  const access = localPreview ? null : await requireVipAccess();
  if (access && "error" in access) return access.error;
  const body = await request.json().catch(() => null) as { character?: unknown; universe?: unknown; reason?: unknown } | null;
  const character = typeof body?.character === "string" ? body.character.trim().slice(0, 90) : "";
  const universe = typeof body?.universe === "string" ? body.universe.trim().slice(0, 90) : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 600) : "";
  if (character.length < 2 || universe.length < 2 || reason.length < 10) {
    return Response.json({ error: "Completa nome, universo e motivo della proposta." }, { status: 400 });
  }
  const normalized = character.toLocaleLowerCase("it");
  if (codexEntries.some((entry) => entry.displayTitle.toLocaleLowerCase("it").includes(normalized))) {
    return Response.json({ error: "Questo personaggio risulta già presente nel Codex." }, { status: 409 });
  }
  if (localPreview) {
    return Response.json({ vip: true, localOnly: true, suggestion: { id: crypto.randomUUID(), character, universe, reason, status: "submitted", createdAt: new Date().toISOString() } });
  }
  if (!access || "error" in access) {
    return Response.json({ error: "Accesso VIP non disponibile." }, { status: 403 });
  }
  const database = access.runtime.DB;
  if (!database) return Response.json({ vip: true, localOnly: true, suggestion: { id: crypto.randomUUID(), character, universe, reason, status: "submitted", createdAt: new Date().toISOString() } });
  await ensureBenefitEngineTables(database);
  const duplicate = await database.prepare(`SELECT id FROM codex_character_suggestions
    WHERE customer_id = ? AND lower(requested_name) = lower(?) AND status IN ('submitted', 'reviewing', 'accepted') LIMIT 1`)
    .bind(access.user.id, character).first<{ id: string }>();
  if (duplicate) return Response.json({ error: "Hai già inviato questa proposta." }, { status: 409 });
  const id = crypto.randomUUID();
  await database.prepare(`INSERT INTO codex_character_suggestions
    (id, customer_id, requested_name, universe, reason) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, access.user.id, character, universe, reason).run();
  return Response.json({ vip: true, localOnly: false, suggestion: { id, character, universe, reason, status: "submitted", createdAt: new Date().toISOString() } });
}
