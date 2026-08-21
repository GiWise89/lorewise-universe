import { NextResponse } from "next/server";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const client = await createLoreWiseServerClient();
  if (!client) return NextResponse.json({ error: "Accesso non configurato." }, { status: 503 });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });

  try {
    await syncLoreWiseCustomer(data.user);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Profilo verificato, sincronizzazione non completata." }, { status: 503 });
  }
}
