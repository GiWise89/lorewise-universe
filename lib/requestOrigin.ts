// Netlify può esporre alle funzioni un indirizzo interno (per esempio main--lorewise.netlify.app)
// dietro il dominio pubblico. I controlli anti-CSRF accettano quindi l'origine della richiesta
// e soltanto i domini pubblici espliciti: mai intestazioni inoltrate scelte dal client.
const PUBLIC_ORIGINS = ["https://lorewisenexus.it", "https://www.lorewisenexus.it"];

/** Origine pubblica del sito: NEXT_PUBLIC_SITE_URL se valida, altrimenti il dominio di produzione. */
export function publicSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https:\/\//.test(configured)) {
    try { return new URL(configured).origin; } catch { /* valore non valido: si usa il dominio noto */ }
  }
  return PUBLIC_ORIGINS[0];
}

export function trustedRequestOrigins(request: Request) {
  return new Set([new URL(request.url).origin, publicSiteOrigin(), ...PUBLIC_ORIGINS]);
}

/** Vero se l'intestazione Origin manca (richieste stesso sito senza Origin) o è una delle origini attendibili. */
export function isSameSiteOrigin(request: Request, origin: string | null | undefined) {
  return !origin || trustedRequestOrigins(request).has(origin);
}

/** Origine da usare nei link assoluti e nei reindirizzamenti verso il sito. */
export function siteOriginFor(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  return /\.netlify\.app$/i.test(new URL(request.url).hostname) ? publicSiteOrigin() : requestOrigin;
}
