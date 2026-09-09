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
  { number: "01", title: "Acquisti e licenze", description: "Ritrova ordini, ricevute, opere e giochi nella tua libreria personale.", image: "/brand/icons/shop-concept-v1.webp", href: "/shop", action: "Esplora lo Shop" },
  { number: "02", title: "Universe Pass", description: "Controlla piano, crediti Arte, sconti e vantaggi attivi.", image: "/brand/lorewise-universe-logo-concept-c.webp", href: "/abbonamento", action: "Scopri i piani" },
  { number: "03", title: "Commissioni", description: "Segui preventivo, lavorazione, pagamenti e consegna della tua richiesta.", image: "/brand/icons/commissioni-concept-v1.webp", href: "/commissioni", action: "Apri le commissioni" },
  { number: "04", title: "Famiglio e giochi", description: "Accedi ai tuoi giochi e porta con te i progressi collegati al LoreWise ID.", image: "/brand/icons/giochi-concept-v1.webp", href: "/giochi", action: "Vai ai giochi" },
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
      <div className="account-hero-copy"><p className="eyebrow">LoreWise ID · area personale</p><h1 id="account-title">Il tuo universo, sempre con te.</h1><p>Un solo profilo per ritrovare acquisti, commissioni, Universe Pass e giochi insieme a licenze, ricevute e aggiornamenti.</p><strong className="account-access-state">{localHalloweenPreview ? "Anteprima locale · nessun ordine reale" : user ? "Profilo LoreWise verificato" : configured ? "Accesso sicuro disponibile" : "Accesso sicuro in preparazione"}</strong></div>
      <div className="account-hero-emblem"><Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="Emblema LoreWise Universe" width={1536} height={1024} priority unoptimized /></div>
    </div></section>

    {!localHalloweenPreview ? <div className="shell">{accessNotice ? <p className="account-access-notice" role="status">{accessNotice}</p> : null}<AccountAccessPanel configured={configured} userEmail={user?.email} initialMode={initialAuthMode} /></div> : null}

    {accountVisible ? <div className="shell"><AccountPersonalDashboard successfulSessionId={localHalloweenPreview ? "cs_test_preview_halloween_2" : paymentStatus === "riuscito" ? checkoutSessionId : ""} localHalloweenPreview={localHalloweenPreview} /></div> : null}

    {!accountVisible ? <><section className="account-principle shell" aria-labelledby="account-principle-title"><span>Un’identità</span><div><p className="eyebrow">Una sola relazione con GiWise Studio</p><h2 id="account-principle-title">Tutto ciò che scegli, nello stesso posto.</h2><p>Il LoreWise ID accompagna acquisti, Universe Pass, commissioni, Famiglio e giochi. Accedi una volta e ritrova subito ciò che ti appartiene.</p></div></section>

    <section className="account-sections" aria-labelledby="account-sections-title"><div className="shell"><header><p className="eyebrow">Il tuo LoreWise ID</p><h2 id="account-sections-title">Quattro accessi, un solo profilo.</h2></header><ol>{accountSections.map((section) => <li key={section.number}><div className="account-section-icon"><Image src={section.image} alt="" width={1224} height={1285} unoptimized /></div><span>{section.number}</span><h3>{section.title}</h3><p>{section.description}</p><Link href={section.href}>{section.action} →</Link></li>)}</ol></div></section></> : null}

    {!accountVisible ? <section className="account-security shell" aria-labelledby="account-security-title"><div><p className="eyebrow">Protezione e trasparenza</p><h2 id="account-security-title">Il tuo archivio resta personale.</h2></div><ol><li><span>01</span><strong>Acquisti riconoscibili</strong><p>Ogni ordine conserva stato, ricevuta e contenuto associato.</p></li><li><span>02</span><strong>Vantaggi sempre visibili</strong><p>Piano, crediti e sconti compaiono insieme nel tuo profilo.</p></li><li><span>03</span><strong>Consegne riservate</strong><p>Download e documenti personali restano disponibili soltanto a te.</p></li></ol></section> : null}

    {!accountVisible ? <section className="account-next-step"><div className="shell"><p className="eyebrow">LoreWise ID</p><h2>Un profilo, tutto il tuo universo.</h2><p>{configured ? "Crea il tuo profilo per ritrovare acquisti, commissioni, vantaggi Universe Pass e preferenze in un unico posto." : "L’accesso al LoreWise ID aprirà qui appena sarà disponibile. Nel frattempo puoi esplorare liberamente l’universo e contattare GiWise Studio."}</p><Link href="/contatti">Hai una domanda? Contatta GiWise Studio →</Link></div></section> : null}
  </main>;
}
