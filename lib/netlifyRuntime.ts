import { getStore } from "@netlify/blobs";
import { getDatabase } from "@netlify/database";

type BoundValue = string | number | boolean | null | Uint8Array | ArrayBuffer;
type QueryResult<T> = { results: T[]; success: boolean; meta: { changes: number; duration?: number } };

function replaceQuestionPlaceholders(sql: string) {
  let index = 0;
  let quote: "'" | '"' | "`" | null = null;
  let output = "";
  for (let cursor = 0; cursor < sql.length; cursor += 1) {
    const character = sql[cursor];
    if (quote) {
      output += character;
      if (character === quote && sql[cursor - 1] !== "\\") quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      output += character;
      continue;
    }
    if (character === "?") {
      index += 1;
      output += `$${index}`;
      continue;
    }
    output += character;
  }
  return output;
}

function translateSqliteSql(source: string) {
  const sqliteTableLookup = source.trim().match(/^SELECT\s+1\s+AS\s+found\s+FROM\s+sqlite_master\s+WHERE\s+type\s*=\s*'table'\s+AND\s+name\s*=\s*\?\s+LIMIT\s+1$/i);
  if (sqliteTableLookup) {
    return {
      sql: "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1",
      ignoredBindings: false,
    };
  }

  const sqliteTableList = source.trim().match(/^SELECT\s+name\s+FROM\s+sqlite_master\s+WHERE\s+type\s*=\s*'table'$/i);
  if (sqliteTableList) {
    return {
      sql: "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public'",
      ignoredBindings: true,
    };
  }

  const pragma = source.trim().match(/^PRAGMA\s+table_info\(([^)]+)\)$/i);
  if (pragma) {
    const table = pragma[1].replace(/["'`]/g, "");
    return {
      sql: `SELECT column_name AS name, ordinal_position - 1 AS cid, data_type AS type,
        CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
        column_default AS dflt_value
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table.replace(/'/g, "''")}'
        ORDER BY ordinal_position`,
      ignoredBindings: true,
    };
  }

  let sql = source
    .replace(/`/g, '"')
    .replace(/\bDEFAULT\s+false\b/gi, "DEFAULT 0")
    .replace(/\bDEFAULT\s+true\b/gi, "DEFAULT 1")
    .replace(/\bdatetime\(\s*'now'\s*,\s*\?\s*\)/gi, "(CURRENT_TIMESTAMP + (?::interval))")
    .replace(/\bdatetime\(\s*'now'\s*,\s*'([^']+)'\s*\)/gi, "(CURRENT_TIMESTAMP + INTERVAL '$1')")
    .replace(/\bdatetime\(\s*([a-zA-Z_][\w.]*)\s*\)/gi, "NULLIF($1, '')::timestamptz")
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
    .replace(/printf\(\s*'%.2f'\s*,\s*([^\)]+)\)/gi, "to_char($1, 'FM999999990.00')");

  const wasInsertOrIgnore = /\bINSERT\s+OR\s+IGNORE\s+INTO\b/i.test(source);
  if (wasInsertOrIgnore && !/\bON\s+CONFLICT\b/i.test(sql)) {
    sql = `${sql.replace(/;\s*$/, "")} ON CONFLICT DO NOTHING`;
  }
  return { sql: replaceQuestionPlaceholders(sql), ignoredBindings: false };
}

class NetlifyPreparedStatement {
  readonly values: BoundValue[];
  constructor(readonly source: string, values: BoundValue[] = []) { this.values = values; }
  bind(...values: BoundValue[]) { return new NetlifyPreparedStatement(this.source, values); }
  private async execute<T extends Record<string, unknown>>() {
    const translated = translateSqliteSql(this.source);
    return getDatabase().pool.query<T>(translated.sql, translated.ignoredBindings ? [] : this.values);
  }
  async all<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<QueryResult<T>> {
    const startedAt = performance.now();
    const result = await this.execute<T>();
    return { results: result.rows, success: true, meta: { changes: result.rowCount ?? 0, duration: performance.now() - startedAt } };
  }
  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const result = await this.execute<Record<string, unknown>>();
    const first = result.rows[0] ?? null;
    if (first && column) return first[column] as T;
    return first as T | null;
  }
  async run(): Promise<QueryResult<Record<string, unknown>>> {
    const startedAt = performance.now();
    const result = await this.execute<Record<string, unknown>>();
    return { results: result.rows, success: true, meta: { changes: result.rowCount ?? 0, duration: performance.now() - startedAt } };
  }
}

class NetlifyD1Database {
  prepare(sql: string) { return new NetlifyPreparedStatement(sql); }
  async batch(statements: NetlifyPreparedStatement[]) {
    const client = await getDatabase().pool.connect();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const statement of statements) {
        const translated = translateSqliteSql(statement.source);
        const result = await client.query(translated.sql, translated.ignoredBindings ? [] : statement.values);
        results.push({ results: result.rows, success: true, meta: { changes: result.rowCount ?? 0 } });
      }
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}

type BlobMetadata = { size?: number; contentType?: string; customMetadata?: Record<string, string> };
function normalizeMetadata(metadata: Record<string, unknown> | undefined): BlobMetadata {
  if (!metadata) return {};
  return {
    size: typeof metadata.size === "number" ? metadata.size : Number(metadata.size || 0),
    contentType: typeof metadata.contentType === "string" ? metadata.contentType : undefined,
    customMetadata: metadata.customMetadata && typeof metadata.customMetadata === "object"
      ? metadata.customMetadata as Record<string, string> : undefined,
  };
}

class NetlifyR2Bucket {
  private metadataKey(key: string) {
    return `__metadata__/${key}.json`;
  }
  private get store() {
    return getStore({ name: "lorewise-private-deliveries", consistency: "strong" });
  }
  private async supplementalMetadata(key: string): Promise<BlobMetadata> {
    const metadata = await this.store.get(this.metadataKey(key), { type: "json", consistency: "strong" });
    return normalizeMetadata(metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : undefined);
  }
  async head(key: string) {
    const result = await this.store.getMetadata(key, { consistency: "strong" });
    if (!result) return null;
    const primary = normalizeMetadata(result.metadata);
    const supplemental = await this.supplementalMetadata(key);
    const metadata = { ...primary, ...supplemental };
    return { size: metadata.size ?? 0, customMetadata: metadata.customMetadata };
  }
  async get(key: string) {
    const result = await this.store.getWithMetadata(key, { type: "stream", consistency: "strong" });
    if (!result) return null;
    const primary = normalizeMetadata(result.metadata);
    const supplemental = await this.supplementalMetadata(key);
    const metadata = { ...primary, ...supplemental };
    const stream = result.data;
    return { body: stream, size: metadata.size ?? 0, customMetadata: metadata.customMetadata,
      httpMetadata: { contentType: metadata.contentType }, arrayBuffer: async () => new Response(stream).arrayBuffer() };
  }
  async put(key: string, value: Blob | ArrayBuffer | Uint8Array | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }) {
    const size = value instanceof Blob ? value.size : value instanceof ArrayBuffer ? value.byteLength
      : value instanceof Uint8Array ? value.byteLength : Number(options?.customMetadata?.size ?? 0);
    const blobValue = value instanceof ReadableStream ? await new Response(value).arrayBuffer()
      : value instanceof Uint8Array ? Uint8Array.from(value).buffer : value;
    await this.store.set(key, blobValue, { metadata: { size, contentType: options?.httpMetadata?.contentType,
      customMetadata: options?.customMetadata } });
    await this.store.setJSON(this.metadataKey(key), {
      size,
      contentType: options?.httpMetadata?.contentType,
      customMetadata: options?.customMetadata,
    });
    return { key };
  }
  async delete(key: string) {
    await this.store.delete(key);
    await this.store.delete(this.metadataKey(key));
  }
}

const runtimeBindings = {
  DB: new NetlifyD1Database() as unknown as D1Database,
  COMMISSION_UPLOADS: new NetlifyR2Bucket() as unknown as R2Bucket,
};

export const env = new Proxy(runtimeBindings as typeof runtimeBindings & Record<string, unknown>, {
  get(target, property, receiver) {
    if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
    return typeof property === "string" ? process.env[property] : undefined;
  },
});
export function getRuntimeEnv() { return env; }
