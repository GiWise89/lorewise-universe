"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { requiredProfileLabels, type RequiredProfileField } from "@/lib/profileCompletion";

type GateState = {
  authenticated: boolean;
  complete: boolean;
  missing: RequiredProfileField[];
};

export function ProfileCompletionGate() {
  const pathname = usePathname();
  const [state, setState] = useState<GateState>({ authenticated: false, complete: true, missing: [] });

  useEffect(() => {
    let active = true;
    void fetch("/api/account/profile", { headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return null;
        const body = await response.json() as { profile?: { profileComplete?: boolean; missingProfileFields?: RequiredProfileField[] } };
        if (!response.ok || !body.profile) return null;
        return body.profile;
      })
      .then((profile) => {
        if (!active || !profile) return;
        setState({ authenticated: true, complete: profile.profileComplete !== false, missing: profile.missingProfileFields ?? [] });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [pathname]);

  if (!state.authenticated || state.complete || pathname.startsWith("/account") || pathname.startsWith("/auth")) return null;

  return <div className="profile-completion-gate" role="dialog" aria-modal="true" aria-labelledby="profile-completion-title">
    <section>
      <p className="eyebrow">LoreWise ID · profilo richiesto</p>
      <h2 id="profile-completion-title">Prima di continuare, completa il tuo profilo.</h2>
      <p>Il nome pubblico e il nickname rendono riconoscibili e sicure le interazioni nella Community.</p>
      {state.missing.length ? <p className="profile-completion-missing">Mancano: {state.missing.map((field) => requiredProfileLabels[field]).join(", ")}.</p> : null}
      <Link href="/account#account-profile">Completa il profilo</Link>
    </section>
  </div>;
}
