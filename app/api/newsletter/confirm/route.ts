import { env } from "@/lib/netlifyRuntime";
import { isNewsletterToken } from "@/lib/newsletter";
import { confirmNewsletterSubscription } from "@/lib/newsletterServer";
import { isSameSiteOrigin, siteOriginFor } from "@/lib/requestOrigin";

// La conferma avviene solo con un invio esplicito del modulo: i filtri antispam che
// aprono i link delle email non possono così confermare un’iscrizione al posto della persona.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!isSameSiteOrigin(request, origin)) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const token = typeof form?.get("token") === "string" ? String(form?.get("token")) : "";
  const target = new URL("/newsletter/conferma", siteOriginFor(request));
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!isNewsletterToken(token)) target.searchParams.set("esito", "invalid");
  else if (!database) target.searchParams.set("esito", "unavailable");
  else {
    try {
      const result = await confirmNewsletterSubscription(database, token);
      target.searchParams.set("esito", result.outcome);
      if (result.topic) target.searchParams.set("tema", result.topic);
      if (result.unsubscribeToken) target.searchParams.set("annulla", result.unsubscribeToken);
    } catch {
      target.searchParams.set("esito", "unavailable");
    }
  }
  return Response.redirect(target, 303);
}
