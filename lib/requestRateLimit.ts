// Limitatore dei tentativi basato su D1. Salva solo impronte SHA-256 di IP ed email,
// mai i valori in chiaro, e scarta i tentativi più vecchi della finestra osservata.

export function clientAddress(request: Request) {
  const netlifyAddress = request.headers.get("x-nf-client-connection-ip");
  if (netlifyAddress) return netlifyAddress.trim();
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "sconosciuto";
}

async function fingerprint(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureRateLimitTable(database: D1Database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS request_attempts (
    bucket TEXT NOT NULL,
    subject_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS request_attempts_lookup ON request_attempts (bucket, subject_hash, created_at)").run();
}

/** Restituisce true quando uno dei soggetti ha già raggiunto il limite di tentativi nella finestra. */
export async function isRateLimited(database: D1Database, bucket: string, subjects: string[], limit: number, windowMinutes: number) {
  await ensureRateLimitTable(database);
  for (const subject of subjects) {
    const row = await database.prepare(`SELECT COUNT(*) AS total FROM request_attempts
      WHERE bucket = ? AND subject_hash = ? AND datetime(created_at) > datetime('now', ?)`)
      .bind(bucket, await fingerprint(subject), `-${windowMinutes} minutes`).first<{ total: number }>();
    if (Number(row?.total ?? 0) >= limit) return true;
  }
  return false;
}

/** Registra un tentativo per ciascun soggetto ed elimina i record scaduti del bucket. */
export async function recordAttempt(database: D1Database, bucket: string, subjects: string[], windowMinutes: number) {
  await ensureRateLimitTable(database);
  const statements = await Promise.all(subjects.map(async (subject) => database
    .prepare("INSERT INTO request_attempts (bucket, subject_hash) VALUES (?, ?)").bind(bucket, await fingerprint(subject))));
  statements.push(database.prepare("DELETE FROM request_attempts WHERE bucket = ? AND datetime(created_at) <= datetime('now', ?)")
    .bind(bucket, `-${windowMinutes} minutes`));
  await database.batch(statements);
}
