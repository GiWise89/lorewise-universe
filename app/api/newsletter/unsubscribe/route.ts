import { env } from "@/lib/netlifyRuntime";
import { isNewsletterToken, isNewsletterTopic, newsletterTopicLabel } from "@/lib/newsletter";
import { findNewsletterUnsubscribe, unsubscribeNewsletter } from "@/lib/newsletterServer";

type RuntimeEnv = { DB?: D1Database };

const noStore = { "Cache-Control": "private, no-store" };

function topicLabel(topic: string) {
  return isNewsletterTopic(topic) ? newsletterTopicLabel(topic) : "questa lista";
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!isNewsletterToken(token)) return Response.json({ valid: false }, { headers: noStore });
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ valid: true, localPreview: true, label: "questa lista" }, { headers: noStore });
  try {
    const row = await findNewsletterUnsubscribe(database, token);
    return Response.json(row ? { valid: true, label: topicLabel(row.topic), alreadyUnsubscribed: row.status === "unsubscribed" } : { valid: false }, { headers: noStore });
  } catch {
    return Response.json({ valid: false, unavailable: true }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403, headers: noStore });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  if (!isNewsletterToken(body?.token)) return Response.json({ error: "Link di disiscrizione non valido." }, { status: 400, headers: noStore });
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ message: "Anteprima locale: la procedura è pronta, ma non modifica dati reali.", localPreview: true }, { headers: noStore });
  try {
    const row = await unsubscribeNewsletter(database, body.token);
    if (!row) return Response.json({ error: "Link di disiscrizione non valido o non più disponibile." }, { status: 404, headers: noStore });
    return Response.json({ message: `Fatto: non riceverai più email per “${topicLabel(row.topic)}”. Puoi iscriverti di nuovo quando vuoi.` }, { headers: noStore });
  } catch {
    return Response.json({ error: "Servizio momentaneamente non disponibile. Riprova tra poco." }, { status: 503, headers: noStore });
  }
}
