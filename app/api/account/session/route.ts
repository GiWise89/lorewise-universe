import { NextResponse } from "next/server";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function loginError(error: { code?: string; message: string; status?: number }) {
  if (error.status === 0 || /fetch|network|internal error/i.test(error.message)) {
    return NextResponse.json({ error: "Il servizio di accesso non è raggiungibile dal server locale. La password non è stata rifiutata: riprova dopo il riavvio del servizio." }, { status: 503 });
  }
  if (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message)) {
    return NextResponse.json({ error: "Devi ancora confermare il tuo indirizzo email." }, { status: 403 });
  }
  if (error.status === 429 || error.code === "over_request_rate_limit" || /rate limit/i.test(error.message)) {
    return NextResponse.json({ error: "Troppi tentativi ravvicinati. Attendi qualche minuto e riprova una sola volta." }, { status: 429 });
  }
  return NextResponse.json({ error: "Email o password non corrette." }, { status: 401 });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "Inserisci email e password valide." }, { status: 400 });
  }

  const client = await createLoreWiseServerClient();
  if (!client) return NextResponse.json({ error: "Il servizio di accesso non è configurato." }, { status: 503 });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) return loginError(error ?? { message: "Sessione non creata." });
  try {
    await syncLoreWiseCustomer(data.user);
  } catch {
    await client.auth.signOut();
    return NextResponse.json({ error: "Accesso verificato, ma il profilo LoreWise non può ancora essere aperto." }, { status: 503 });
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const client = await createLoreWiseServerClient();
  if (!client) return NextResponse.json({ error: "Il servizio di accesso non è configurato." }, { status: 503 });
  await client.auth.signOut();
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
