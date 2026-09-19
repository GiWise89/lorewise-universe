import { isSameSiteOrigin } from "./requestOrigin.ts";

// Netlify can expose an internal request URL behind the public domain.
// Accept only our explicit public origins, never arbitrary forwarded headers.
export function isFamiglioRequestOriginAllowed(request: Request) {
  return isSameSiteOrigin(request, request.headers.get("origin"));
}
