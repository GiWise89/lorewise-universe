"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("LoreWise route error", error);
  }, [error]);

  return <main className="system-state-page system-state-error">
    <p className="eyebrow">Interruzione temporanea</p>
    <h1>Questa porta non si è aperta correttamente.</h1>
    <p>I tuoi dati non sono stati modificati. Puoi riprovare oppure tornare alla mappa principale.</p>
    <div><button type="button" onClick={reset}>Riprova</button><Link href="/">Torna alla home</Link></div>
    {error.digest ? <small>Riferimento tecnico: {error.digest}</small> : null}
  </main>;
}
