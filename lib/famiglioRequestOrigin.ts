import { isSameSiteOrigin } from "./requestOrigin.ts";

// Netlify can expose an internal request URL behind the public domain.
// Accept only our explicit public origins, never arbitrary forwarded headers.
export function isFamiglioRequestOriginAllowed(request: Request) {
  return isSameSiteOrigin(request, request.headers.get("origin"));
}

export type BoundedJsonBody =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 };

/**
 * Legge un corpo JSON con un tetto in byte. Il solo controllo su Content-Length non basta:
 * una richiesta "chunked" non lo invia e request.json() avrebbe letto tutto in memoria.
 * JSON non valido produce 400 invece di finire nel 503 generico della rotta.
 */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<BoundedJsonBody> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
