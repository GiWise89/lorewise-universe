import type { Metadata } from "next";
import Link from "next/link";
import { ACCOUNT_PRIVACY_VERSION } from "@/lib/accountPolicy";

export const metadata: Metadata = {
  title: "Informativa account · bozza locale",
  description: "Bozza locale dell’informativa relativa al profilo LoreWise Universe.",
};

export default function AccountPrivacyPage() {
  return <main className="privacy-page">
    <header className="privacy-hero"><div className="shell"><p className="eyebrow">Trasparenza LoreWise ID</p><h1>I tuoi dati non sono una moneta.</h1><p>Questa è la bozza locale dell’informativa account. Prima della pubblicazione verrà completata con i dati legali definitivi e sottoposta a revisione professionale.</p><strong>{ACCOUNT_PRIVACY_VERSION}</strong></div></header>
    <article className="privacy-document shell">
      <section><span>01</span><div><h2>Dati necessari al profilo</h2><p>Per creare e proteggere LoreWise ID vengono trattati indirizzo email, identificativo tecnico dell’account, stato della verifica e dati di sicurezza della sessione. Nome pubblico e preferenze sono facoltativi.</p></div></section>
      <section><span>02</span><div><h2>Perché vengono utilizzati</h2><p>I dati necessari servono ad autenticare l’utente, proteggere l’account, collegare in futuro ordini, licenze, commissioni e download, rispondere all’assistenza e rispettare gli obblighi applicabili.</p></div></section>
      <section><span>03</span><div><h2>Comunicazioni facoltative</h2><p>Gli aggiornamenti Community e le novità GiWise Studio hanno scelte separate, inizialmente disattivate. Non è necessario accettarle per registrarsi e possono essere revocate dalle preferenze del profilo.</p></div></section>
      <section><span>04</span><div><h2>Servizi tecnici</h2><p>Supabase gestisce autenticazione e sessioni; l’infrastruttura LoreWise conserva il profilo collegato. Stripe Checkout gestisce pagamenti, abbonamenti e rimborsi senza comunicare a LoreWise i dati completi della carta. Un ordine viene riconosciuto soltanto dopo la conferma firmata ricevuta dal server.</p></div></section>
      <section><span>05</span><div><h2>Conservazione e diritti</h2><p>Un account inattivo potrà essere cancellato dopo 24 mesi, con un avviso inviato all’indirizzo associato almeno 30 giorni prima. Un nuovo accesso o l’azione indicata nell’avviso interromperanno la cancellazione. Ordini e dati soggetti a obblighi amministrativi saranno separati dal profilo operativo e conservati soltanto per i termini applicabili. La richiesta può essere avviata e annullata dal profilo finché non viene completata; accesso, rettifica, cancellazione e opposizione restano disponibili tramite l’assistenza.</p><Link href="/contatti#assistenza">Apri l’area assistenza</Link></div></section>
      <section><span>06</span><div><h2>Età minima e contenuti per adulti</h2><p>Per creare LoreWise ID è necessario dichiarare di avere almeno 16 anni. Questa soglia non autorizza l’accesso alle opere contrassegnate 18+, che restano riservate esclusivamente agli utenti maggiorenni mediante un controllo separato.</p></div></section>
      <aside><strong>Titolare indicato: Luigi Marzo</strong><p>Il contatto pubblico per privacy, account e assistenza LoreWise è <a href="mailto:lorewise.archive@gmail.com">lorewise.archive@gmail.com</a>. Non sono attualmente presenti sede, azienda o Partita IVA. Da completare prima della pubblicazione commerciale: inquadramento professionale dell’attività, recapito giuridico adeguato, destinatari definitivi, validazione della politica di conservazione, procedura di esercizio dei diritti e condizioni relative ai minori.</p></aside>
    </article>
  </main>;
}
