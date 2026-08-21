"use client";

import { useMemo, useState } from "react";

type OwnerDecision = {
  siteUrl: string;
  legalName: string;
  legalAddress: string;
  privacyContact: string;
  retentionPolicy: string;
  minimumAge: string;
  supportPolicy: string;
};

const initialDecision: OwnerDecision = {
  siteUrl: "https://lorewisenexus.it",
  legalName: "Luigi Marzo",
  legalAddress: "",
  privacyContact: "lorewise.archive@gmail.com",
  retentionPolicy: "Account inattivi cancellabili dopo 24 mesi con avviso email 30 giorni prima; ordini e dati obbligatori conservati per i termini di legge",
  minimumAge: "16",
  supportPolicy: "Prima risposta entro 2 giorni lavorativi",
};

const fields: Array<{ key: keyof OwnerDecision; label: string; hint: string; placeholder: string }> = [
  { key: "siteUrl", label: "Dominio pubblico definitivo", hint: "Dominio confermato dal proprietario; non costituisce autorizzazione alla pubblicazione.", placeholder: "https://lorewisenexus.it" },
  { key: "legalName", label: "Titolare legale", hint: "Nome completo o denominazione da mostrare nelle informative e nelle vendite.", placeholder: "Da confermare" },
  { key: "legalAddress", label: "Sede o indirizzo pubblico", hint: "Inseriscilo soltanto dopo aver deciso quale recapito è corretto pubblicare.", placeholder: "Da confermare" },
  { key: "privacyContact", label: "Contatto privacy", hint: "Può coincidere con il recapito generale LoreWise.", placeholder: "privacy@example.com" },
  { key: "retentionPolicy", label: "Conservazione dei dati", hint: "Periodo e criterio definitivi, da verificare professionalmente prima della pubblicazione.", placeholder: "Esempio da approvare: ..." },
  { key: "minimumAge", label: "Età minima account", hint: "Deve essere coerente con opere 18+, community e normativa applicabile.", placeholder: "Da confermare" },
  { key: "supportPolicy", label: "Tempi di assistenza e rimborso", hint: "Indica giorni lavorativi e canale ufficiale, senza promettere tempi che non puoi rispettare.", placeholder: "Esempio: risposta entro ... giorni lavorativi" },
];

function envValue(value: string) {
  return JSON.stringify(value.trim());
}

export function LaunchOwnerDecisions() {
  const [decision, setDecision] = useState(initialDecision);
  const [message, setMessage] = useState("");
  const completed = fields.filter((field) => decision[field.key].trim()).length;
  const snippet = useMemo(() => [
    `NEXT_PUBLIC_SITE_URL=${envValue(decision.siteUrl)}`,
    `LOREWISE_LEGAL_NAME=${envValue(decision.legalName)}`,
    `LOREWISE_LEGAL_ADDRESS=${envValue(decision.legalAddress)}`,
    `LOREWISE_PRIVACY_CONTACT=${envValue(decision.privacyContact)}`,
    `LOREWISE_DATA_RETENTION_POLICY=${envValue(decision.retentionPolicy)}`,
    `LOREWISE_MINIMUM_ACCOUNT_AGE=${envValue(decision.minimumAge)}`,
    `LOREWISE_SUPPORT_RESPONSE_POLICY=${envValue(decision.supportPolicy)}`,
  ].join("\n"), [decision]);

  async function copyConfiguration() {
    if (completed !== fields.length) return setMessage("Completa prima tutti e sette i dati da approvare.");
    try {
      await navigator.clipboard.writeText(snippet);
      setMessage("Configurazione copiata. Non contiene password né chiavi segrete.");
    } catch {
      setMessage("Copia non disponibile: seleziona manualmente il riepilogo qui sotto.");
    }
  }

  return <section className="launch-decisions" aria-labelledby="launch-decisions-title">
    <header><div><p className="eyebrow">Decisioni del proprietario</p><h2 id="launch-decisions-title">Sette dati,<br />nessuna supposizione.</h2><p>Questa scheda resta nel dispositivo e non invia né salva i valori. Serve a preparare con precisione la configurazione pubblica.</p></div><strong aria-label={`${completed} dati compilati su ${fields.length}`}>{completed}<span>/{fields.length}</span></strong></header>
    <div className="launch-decisions-fields">
      {fields.map((field, index) => <label key={field.key} htmlFor={`launch-${field.key}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{field.label}</strong><small>{field.hint}</small><input id={`launch-${field.key}`} value={decision[field.key]} onChange={(event) => setDecision((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} autoComplete="off" /></div></label>)}
    </div>
    <div className="launch-decisions-output"><div><p className="eyebrow">Configurazione generata</p><p>Nessuna credenziale deve essere incollata qui. Le approvazioni di SMTP, Stripe, R2, Supabase e Hoplix restano separate e vanno attivate solo dopo una prova reale.</p></div><pre tabIndex={0}>{snippet}</pre><button type="button" onClick={() => void copyConfiguration()}>Copia configurazione pubblica</button>{message ? <p role="status" aria-live="polite">{message}</p> : null}</div>
  </section>;
}
