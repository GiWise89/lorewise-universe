import { env } from "@/lib/netlifyRuntime";
import { newsletterAcceptedMessage, validateNewsletterSignup } from "@/lib/newsletter";
import { requestNewsletterSubscription } from "@/lib/newsletterServer";
import { clientAddress, isRateLimited, recordAttempt } from "@/lib/requestRateLimit";

type RuntimeEnv = {
  DB?: D1Database;
  URL?: string;
  RESEND_API_KEY?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
};

const noStore = { "Cache-Control": "private, no-store" };

function publicOrigin(runtime: RuntimeEnv, request: Request) {
  const configured = runtime.URL?.trim();
  return configured && /^https?:\/\//.test(configured) ? configured.replace(/\/$/, "") : new URL(request.url).origin;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403, headers: noStore });

  const body = await request.json().catch(() => null) as unknown;
  const validation = validateNewsletterSignup(body);
  if (!validation.ok) {
    // Il campo esca compilato riceve la stessa risposta di un’iscrizione riuscita, senza effetti.
    if (validation.reason === "honeypot") return Response.json({ ok: true, message: newsletterAcceptedMessage("cronache") }, { headers: noStore });
    return Response.json({ error: validation.error }, { status: 400, headers: noStore });
  }

  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB) return Response.json({ error: "Iscrizioni momentaneamente non disponibili." }, { status: 503, headers: noStore });
  try {
    // Al massimo 8 richieste ogni 15 minuti per IP e 3 all’ora per indirizzo, qualunque sia l’esito.
    const ipSubject = [`ip:${clientAddress(request)}`];
    const emailSubject = [`email:${validation.email}`];
    if (await isRateLimited(runtime.DB, "newsletter-ip", ipSubject, 8, 15) || await isRateLimited(runtime.DB, "newsletter-email", emailSubject, 3, 60)) {
      return Response.json({ error: "Troppe richieste in poco tempo. Riprova più tardi." }, { status: 429, headers: { ...noStore, "Retry-After": "900" } });
    }
    await recordAttempt(runtime.DB, "newsletter-ip", ipSubject, 15);
    await recordAttempt(runtime.DB, "newsletter-email", emailSubject, 60);
    await requestNewsletterSubscription(runtime.DB, runtime, { email: validation.email, topic: validation.topic, origin: publicOrigin(runtime, request), source: "site" });
  } catch (error) {
    console.error("[newsletter] iscrizione non riuscita", error instanceof Error ? error.message : error);
    return Response.json({ error: "Iscrizioni momentaneamente non disponibili. Riprova tra poco." }, { status: 503, headers: noStore });
  }
  // Stessa risposta per indirizzi nuovi, in attesa o già confermati.
  return Response.json({ ok: true, message: newsletterAcceptedMessage(validation.topic) }, { headers: noStore });
}
