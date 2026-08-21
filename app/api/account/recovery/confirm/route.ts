import { NextResponse } from "next/server";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function safeDestination(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/account/password";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origine della richiesta non valida." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const tokenHash = typeof body.tokenHash === "string" ? body.tokenHash.trim() : "";
  if (!tokenHash || tokenHash.length > 4096) {
    return NextResponse.json({ error: "Il collegamento di recupero è incompleto." }, { status: 400 });
  }

  const client = await createLoreWiseServerClient();
  if (!client) return NextResponse.json({ error: "Il servizio di accesso non è configurato." }, { status: 503 });

  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (error || !data.user || !data.session) {
    return NextResponse.json({ error: "Questo recupero non è più valido. Richiedi un nuovo messaggio e usa il pulsante LoreWise al suo interno." }, { status: 401 });
  }

  try {
    await syncLoreWiseCustomer(data.user);
  } catch {
    // La sessione di recupero resta valida: la sincronizzazione potrà essere ripetuta dopo l’accesso.
  }

  return NextResponse.json(
    { destination: safeDestination(body.destination) },
    { status: 200, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } },
  );
}
