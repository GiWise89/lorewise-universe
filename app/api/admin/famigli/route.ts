import { LOREWISE_OWNER_EMAIL } from "@/lib/accountPolicy";
import { FAMILIAR_COLLECTION } from "@/lib/famiglioMarketExpansion";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";

export const dynamic = "force-dynamic";

type SaveRow = {
  customer_id: string;
  email: string;
  display_name: string | null;
  account_status: string;
  save_json: string;
  revision: number;
  created_at: string;
  updated_at: string;
};

type JsonRecord = Record<string, unknown>;

const familiarNames = new Map(FAMILIAR_COLLECTION.map((entry) => [entry.id, entry.name]));
const privateHeaders = { "Cache-Control": "private, no-store" };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function houseSummary(value: unknown) {
  if (!isRecord(value) || !isRecord(value.rebuild)) return null;
  const rebuild = value.rebuild;
  const speciesId = typeof value.activeFamiliarId === "string"
    ? value.activeFamiliarId
    : typeof rebuild.selectedId === "string" ? rebuild.selectedId : "";
  const stage = typeof rebuild.stage === "string" ? rebuild.stage : "";
  if (!speciesId || !["hatched", "home"].includes(stage)) return null;
  const customName = typeof rebuild.familiarName === "string" ? rebuild.familiarName.trim().slice(0, 18) : "";
  return {
    speciesId,
    speciesName: familiarNames.get(speciesId) ?? speciesId,
    familiarName: customName || familiarNames.get(speciesId) || "Famiglio",
  };
}

function summarizeSave(serialized: string) {
  try {
    const save = JSON.parse(serialized) as unknown;
    if (!isRecord(save) || !Array.isArray(save.houses)) return [];
    return save.houses.map(houseSummary).filter((house): house is NonNullable<ReturnType<typeof houseSummary>> => Boolean(house));
  } catch {
    return [];
  }
}

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  if (auth.adminEmail.toLocaleLowerCase("it") !== LOREWISE_OWNER_EMAIL.toLocaleLowerCase("it")) {
    return Response.json({ error: "Accesso riservato al proprietario LoreWise." }, { status: 403, headers: privateHeaders });
  }

  const table = await auth.database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'nexus_pet_rebuild_saves'")
    .first<{ name: string }>();
  if (!table) return Response.json({ totalCustodians: 0, totalFamiliars: 0, custodians: [] }, { headers: privateHeaders });

  const result = await auth.database.prepare(`SELECT saves.customer_id, customers.email, customers.display_name,
      customers.status AS account_status, saves.save_json, saves.revision, saves.created_at, saves.updated_at
    FROM nexus_pet_rebuild_saves saves
    INNER JOIN customers ON customers.id = saves.customer_id
    ORDER BY saves.updated_at DESC LIMIT 500`).all<SaveRow>();

  const custodians = result.results.map((row) => ({
    customerId: row.customer_id,
    email: row.email,
    displayName: row.display_name ?? "",
    accountStatus: row.account_status,
    revision: Number(row.revision) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    familiars: summarizeSave(row.save_json),
  })).filter((row) => row.familiars.length > 0);

  return Response.json({
    totalCustodians: custodians.length,
    totalFamiliars: custodians.reduce((total, row) => total + row.familiars.length, 0),
    custodians,
  }, { headers: privateHeaders });
}
