import { NextResponse } from "next/server";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origine della richiesta non valida." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "La password deve contenere almeno 8 caratteri." }, { status: 400 });
  }

  const client = await createLoreWiseServerClient();
  if (!client) return NextResponse.json({ error: "Il servizio di accesso non è configurato." }, { status: 503 });
  const { data: current, error: userError } = await client.auth.getUser();
  if (userError || !current.user) return NextResponse.json({ error: "La conferma di recupero non è più attiva." }, { status: 401 });

  const { error } = await client.auth.updateUser({ password });
  if (error) return NextResponse.json({ error: "Non è stato possibile salvare la nuova password. Riprova senza richiedere un’altra email." }, { status: 400 });
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
