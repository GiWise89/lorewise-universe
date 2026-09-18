// Netlify can expose an internal request URL behind the public domain.
// Accept only our explicit public origins, never arbitrary forwarded headers.
export function isFamiglioRequestOriginAllowed(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  if (origin === 'https://lorewisenexus.it' || origin === 'https://www.lorewisenexus.it') return true;
  return origin === new URL(request.url).origin;
}
