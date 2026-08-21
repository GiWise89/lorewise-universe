"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    let active = true;

    async function completeAccess() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const requestedType = params.get("type");
      const destination = safeNext(params.get("next"));
      const client = createLoreWiseBrowserClient();

      if (!client || (!code && !tokenHash)) {
        window.location.replace(destinationWithStatus("/account", !client ? "non-configurato" : "link-non-valido"));
        return;
      }

      const otpTypes = new Set<EmailOtpType>(["email", "signup", "invite", "magiclink", "recovery", "email_change"]);
      const verification = tokenHash && requestedType && otpTypes.has(requestedType as EmailOtpType)
        ? await client.auth.verifyOtp({ token_hash: tokenHash, type: requestedType as EmailOtpType })
        : code
          ? await client.auth.exchangeCodeForSession(code)
          : { error: new Error("Tipo di verifica non valido.") };
      if (!active) return;
      if (verification.error) {
        window.location.replace(destinationWithStatus("/account", "errore"));
        return;
      }

      const syncResponse = await fetch("/api/account/sync", { method: "POST" });
      if (!active) return;
      window.location.replace(destinationWithStatus(destination, syncResponse.ok ? "confermato" : "profilo-parziale"));
    }

    void completeAccess();
    return () => { active = false; };
  }, []);

  return <main className="auth-callback-page" aria-labelledby="auth-callback-title">
    <div>
      <p className="eyebrow">LoreWise ID</p>
      <h1 id="auth-callback-title">Verifica dell’accesso in corso.</h1>
      <p>Stiamo collegando in modo sicuro la tua email al profilo LoreWise. Questa pagina si chiuderà automaticamente.</p>
    </div>
  </main>;
}
