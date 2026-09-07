import { getStore } from "@netlify/blobs";
import { getDatabase } from "@netlify/database";
import { translateSqliteSql } from "@/lib/netlifySql";

type BoundValue = string | number | boolean | null | Uint8Array | ArrayBuffer;
type QueryResult<T> = { results: T[]; success: boolean; meta: { changes: number; duration?: number } };

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
