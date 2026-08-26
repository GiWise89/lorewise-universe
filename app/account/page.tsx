import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccountAccessPanel, type AuthMode } from "@/components/AccountAccessPanel";
import { AccountPersonalDashboard } from "@/components/AccountPersonalDashboard";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getLoreWiseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Area personale",
  description: "Area personale LoreWise per vantaggi, ordini, opere, commissioni, abbonamenti, giochi e download protetti.",
};

const accountSections = [
  { number: "01", title: "Ordini", description: "Pagamenti singoli, ricevute, stato degli acquisti e richieste di assistenza riuniti in una sola cronologia.", image: "/brand/icons/shop-concept-v1.webp" },
  { number: "02", title: "Arte e licenze", description: "Opere acquistate, licenza associata e consegna dei file personali senza esporre gli originali pubblicamente.", image: "/brand/icons/arte-concept-v1.webp" },
  { number: "03", title: "Commissioni", description: "Preventivo, acconto, saldo, avanzamento e messaggi collegati alla stessa richiesta creativa.", image: "/brand/icons/commissioni-concept-v1.webp" },
  { number: "04", title: "Abbonamento", description: "Piano attivo, rinnovo, vantaggi, metodo di pagamento e possibilità di cancellazione trasparente.", image: "/brand/lorewise-universe-logo-concept-c.webp" },
  { number: "05", title: "Libreria giochi", description: "Edizioni acquistate, licenze personali, aggiornamenti e download verificati per Windows e Android.", image: "/brand/icons/giochi-concept-v1.webp" },
];

const accessNotices: Record<string, string> = {
  confermato: "Email confermata: il tuo profilo LoreWise è ora collegato.",
  "sessione-attiva": "Accesso completato: la sessione LoreWise è attiva su questo dispositivo.",
  "sessione-scaduta": "La sessione non è più attiva su questo dispositivo. Accedi nuovamente con email e password.",
  "confermata-accedi": "L’email risulta confermata. Accedi ora usando la password scelta durante la registrazione.",
  "profilo-parziale": "Email confermata. Il profilo è attivo, ma la sincronizzazione dell’archivio personale deve essere completata.",
  errore: "Il link non può essere verificato. Richiedine uno nuovo e usa soltanto l’email più recente.",
  "link-non-valido": "Il link di accesso è incompleto o non più valido. Richiedine uno nuovo.",
  "non-configurato": "Il servizio di accesso non è ancora configurato correttamente.",
  "password-impostata": "Password salvata correttamente. Il tuo profilo LoreWise è pronto.",
};

const paymentNotices: Record<string, string> = {
  riuscito: "Pagamento ricevuto e collegato al tuo LoreWise ID.",
  annullato: "Pagamento annullato: non è stato effettuato alcun addebito.",
};

export default async function AccountPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const configured = Boolean(getSupabasePublicConfig());
  const user = configured ? await getLoreWiseUser() : null;
  const query = await searchParams;
  const accessStatus = typeof query?.accesso === "string" ? query.accesso : "";
  const paymentStatus = typeof query?.pagamento === "string" ? query.pagamento : "";
  const checkoutSessionId = typeof query?.session_id === "string" ? query.session_id : "";
  const localHalloweenPreview = query?.anteprima === "acquisto-halloween" && process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true";
  const accountVisible = Boolean(user || localHalloweenPreview);
  const initialAuthMode: AuthMode = query?.modalita === "registrazione" ? "register" : "login";
  const accessNotice = paymentNotices[paymentStatus]
    ?? (accessStatus === "confermato" && !user
      ? accessNotices["confermata-accedi"]
      : accessStatus === "sessione-attiva" && !user
        ? accessNotices["sessione-scaduta"]
        : accessNotices[accessStatus]);
  return <main className={`account-page${accountVisible ? " account-page-authenticated" : ""}`}>
    <section className="account-hero" aria-labelledby="account-title"><div className="shell account-hero-inner">
      <div><p className="eyebrow">LoreWise ID · area personale</p><h1 id="account-title">Tutto ciò che<br />ti appartiene.</h1><p>Un solo profilo per seguire acquisti, commissioni, abbonamento e giochi senza perdere licenze, ricevute o aggiornamenti.</p><strong className="account-access-state">{localHalloweenPreview ? "Anteprima locale · nessun ordine reale" : user ? "Profilo LoreWise verificato" : configured ? "Accesso sicuro disponibile" : "Accesso sicuro in preparazione"}</strong></div>
      <div className="account-hero-emblem"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="Emblema LoreWise Universe" width={1536} height={1024} priority unoptimized /></div>
    </div></section>

    {!localHalloweenPreview ? <div className="shell">{accessNotice ? <p className="account-access-notice" role="status">{accessNotice}</p> : null}<AccountAccessPanel configured={configured} userEmail={user?.email} initialMode={initialAuthMode} /></div> : null}

    {accountVisible ? <div className="shell"><AccountPersonalDashboard successfulSessionId={localHalloweenPreview ? "cs_test_preview_halloween_2" : paymentStatus === "riuscito" ? checkoutSessionId : ""} localHalloweenPreview={localHalloweenPreview} /></div> : null}

    {!accountVisible ? <><section className="account-principle shell" aria-labelledby="account-principle-title"><span>Un’identità</span><div><p className="eyebrow">Una sola relazione con GiWise Studio</p><h2 id="account-principle-title">Non cinque account diversi.</h2><p>Ogni pagamento produrrà un ordine LoreWise. Sarà il tipo di acquisto a determinare cosa compare nell’area personale: un file artistico, una commissione, un vantaggio mensile oppure un videogioco.</p></div></section>

    <section className="account-sections" aria-labelledby="account-sections-title"><div className="shell"><header><p className="eyebrow">Archivio personale</p><h2 id="account-sections-title">Cinque spazi, un solo profilo.</h2></header><ol>{accountSections.map((section) => <li key={section.number}><div className="account-section-icon"><Image src={section.image} alt="" width={1224} height={1285} unoptimized /></div><span>{section.number}</span><h3>{section.title}</h3><p>{section.description}</p><small>Modulo predisposto · dati personali non ancora raccolti</small></li>)}</ol></div></section></> : null}

    {!accountVisible ? <section className="account-security shell" aria-labelledby="account-security-title"><div><p className="eyebrow">Protezione e trasparenza</p><h2 id="account-security-title">Il pagamento non basta: serve una conferma sicura.</h2></div><ol><li><span>01</span><strong>Pagamento verificato</strong><p>L’ordine cambia stato soltanto dopo la conferma ricevuta dal sistema di pagamento.</p></li><li><span>02</span><strong>Diritto assegnato</strong><p>Il sistema collega all’utente licenza, abbonamento, commissione o gioco acquistato.</p></li><li><span>03</span><strong>Consegna personale</strong><p>Download e documenti diventano disponibili esclusivamente nella libreria del proprietario.</p></li></ol></section> : null}

    {!accountVisible ? <section className="account-next-step"><div className="shell"><p className="eyebrow">Stato del progetto</p><h2>Il LoreWise ID ha superato il collaudo completo.</h2><p>{configured ? "Registrazione, conferma email, accesso e recupero password sono collegati e verificati. Acquisti, commissioni e Universe Pass condividono lo stesso profilo; l’accesso con Google rimane un’aggiunta facoltativa." : "La pagina non accetta ancora registrazioni o pagamenti finché i servizi dell’ambiente pubblico non risultano collegati."}</p><Link href="/contatti">Hai una domanda? Contatta GiWise Studio →</Link></div></section> : null}
  </main>;
}
