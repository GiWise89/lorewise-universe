"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createLoreWiseBrowserClient } from "@/lib/supabase/client";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function destinationWithStatus(destination: string, status: string) {
  const url = new URL(destination, window.location.origin);
  url.searchParams.set("accesso", status);
  return `${url.pathname}${url.search}`;
}

export default function AuthCallbackPage() {
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function completeAccess() {
      try {
        const params = new URLSearchParams(window.location.search);
        const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const requestedType = params.get("type");
        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");
        const destination = safeNext(params.get("next"));
        const client = createLoreWiseBrowserClient();

        if (!client) throw new Error("Servizio di accesso non configurato.");

        const otpTypes = new Set<EmailOtpType>(["email", "signup", "invite", "magiclink", "recovery", "email_change"]);
        const verification = accessToken && refreshToken
          ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : tokenHash && requestedType && otpTypes.has(requestedType as EmailOtpType)
            ? await client.auth.verifyOtp({ token_hash: tokenHash, type: requestedType as EmailOtpType })
            : code
              ? await client.auth.exchangeCodeForSession(code)
              : { error: new Error("Collegamento di conferma incompleto.") };
        if (!active) return;
        if (verification.error) throw verification.error;

        // Evita che token temporanei restino nella cronologia o negli screenshot.
        if (window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

        const syncResponse = await fetch("/api/account/sync", { method: "POST" }).catch(() => null);
        if (!active) return;
        window.location.replace(destinationWithStatus(destination, syncResponse?.ok ? "confermato" : "profilo-parziale"));
      } catch {
        if (!active) return;
        setErrorMessage("Non è stato possibile completare la conferma. Il link potrebbe essere scaduto, già utilizzato oppure aperto in un browser che blocca la sessione. Torna all’area account e accedi con la password scelta; se l’email non risulta confermata, richiedi un nuovo messaggio.");
      }
    }

    void completeAccess();
    return () => { active = false; };
  }, []);

  return <main className="auth-callback-page" aria-labelledby="auth-callback-title">
    <div>
      <p className="eyebrow">LoreWise ID</p>
      <h1 id="auth-callback-title">{errorMessage ? "Conferma non completata." : "Verifica dell’accesso in corso."}</h1>
      <p role={errorMessage ? "alert" : "status"}>{errorMessage || "Stiamo collegando in modo sicuro la tua email al profilo LoreWise. Al termine verrai portato automaticamente nell’area personale."}</p>
      {errorMessage ? <Link href="/account">Torna all’area account</Link> : null}
    </div>
  </main>;
}
