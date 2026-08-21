import { requireVipAccess } from "@/lib/vipAccess";
import { VIP_FUORI_TRAMA_DROP } from "@/lib/vipZone";

type CandidateRow = {
  id: string;
  display_name: string;
  total: number;
};

async function ensureTables(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS vip_singer_candidates (
    id TEXT PRIMARY KEY NOT NULL,
    poll_code TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_code, normalized_name),
    FOREIGN KEY (created_by) REFERENCES customers(id) ON DELETE CASCADE
  )`).run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS vip_singer_votes (
    customer_id TEXT NOT NULL,
    poll_code TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(customer_id, poll_code),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES vip_singer_candidates(id) ON DELETE CASCADE
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS vip_singer_votes_ranking_idx ON vip_singer_votes(poll_code, candidate_id)").run();
}

function cleanName(value: unknown) {
  if (typeof value !== "string") return null;
  const displayName = value.replace(/\s+/g, " ").trim();
  if (displayName.length < 2 || displayName.length > 60 || !/^[\p{L}\p{N} .&'’+-]+$/u.test(displayName)) return null;
  return { displayName, normalizedName: displayName.toLocaleLowerCase("it-IT") };
}

async function snapshot(database: D1Database, customerId: string) {
  const pollCode = VIP_FUORI_TRAMA_DROP.communityVote.code;
  const [ranking, viewer] = await Promise.all([
    database.prepare(`SELECT candidates.id, candidates.display_name, COUNT(votes.customer_id) AS total
      FROM vip_singer_candidates AS candidates
      LEFT JOIN vip_singer_votes AS votes
        ON votes.candidate_id = candidates.id AND votes.poll_code = candidates.poll_code
      WHERE candidates.poll_code = ?
      GROUP BY candidates.id, candidates.display_name
      ORDER BY total DESC, candidates.created_at ASC, candidates.display_name ASC
      LIMIT 12`).bind(pollCode).all<CandidateRow>(),
    database.prepare(`SELECT candidates.display_name FROM vip_singer_votes AS votes
      JOIN vip_singer_candidates AS candidates ON candidates.id = votes.candidate_id
      WHERE votes.customer_id = ? AND votes.poll_code = ? LIMIT 1`)
      .bind(customerId, pollCode).first<{ display_name: string }>(),
  ]);
  return {
    ranking: ranking.results.map((candidate, index) => ({
      id: candidate.id,
      name: candidate.display_name,
      votes: Number(candidate.total),
      position: index + 1,
    })),
    viewerChoice: viewer?.display_name ?? null,
  };
}

export async function GET() {
  try {
    const access = await requireVipAccess();
    if ("error" in access) return access.error;
    if (!access.user) return Response.json({ error: "Accesso non valido." }, { status: 401 });
    await ensureTables(access.runtime.DB!);
    return Response.json(await snapshot(access.runtime.DB!, access.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "La classifica non è disponibile in questo momento." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireVipAccess();
    if ("error" in access) return access.error;
    if (!access.user) return Response.json({ error: "Accesso non valido." }, { status: 401 });
    const candidate = cleanName((await request.json().catch(() => null) as { candidate?: unknown } | null)?.candidate);
    if (!candidate) {
      return Response.json({ error: "Inserisci un nome valido da 2 a 60 caratteri." }, { status: 400 });
    }

    const database = access.runtime.DB!;
    const pollCode = VIP_FUORI_TRAMA_DROP.communityVote.code;
    await ensureTables(database);
    await database.prepare(`INSERT INTO vip_singer_candidates
      (id, poll_code, normalized_name, display_name, created_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(poll_code, normalized_name) DO NOTHING`)
      .bind(crypto.randomUUID(), pollCode, candidate.normalizedName, candidate.displayName, access.user.id).run();
    const selected = await database.prepare(`SELECT id FROM vip_singer_candidates
      WHERE poll_code = ? AND normalized_name = ? LIMIT 1`)
      .bind(pollCode, candidate.normalizedName).first<{ id: string }>();
    if (!selected) return Response.json({ error: "Candidatura non registrata." }, { status: 503 });

    await database.prepare(`INSERT INTO vip_singer_votes
      (customer_id, poll_code, candidate_id, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(customer_id, poll_code) DO UPDATE SET
        candidate_id = excluded.candidate_id,
        updated_at = CURRENT_TIMESTAMP`)
      .bind(access.user.id, pollCode, selected.id).run();

    return Response.json(await snapshot(database, access.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "Il voto non è stato registrato. Riprova più tardi." }, { status: 503 });
  }
}
