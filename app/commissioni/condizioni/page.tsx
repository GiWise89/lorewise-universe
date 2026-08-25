import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COMMISSION_TERMS_VERSION, commissionContentRules } from "@/lib/commissionTerms";

export const metadata: Metadata = {
  title: "Condizioni delle commissioni",
  description: "Regole, tutela delle immagini, preventivi e condizioni del servizio commissioni GiWise Studio.",
};

export default function CommissionTermsPage() {
  return (
    <main className="commission-terms-page">
      <section className="commission-terms-hero">
        <div className="shell">
          <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema illustrato GiWise Commissioni" width={1224} height={1285} unoptimized priority />
          <div><p className="eyebrow">GiWise Studio · Regole del servizio</p><h1>Un accordo chiaro,<br />prima di creare.</h1><p>Queste condizioni definiscono cosa posso realizzare, come vengono protette le immagini e quali passaggi precedono l’inizio del lavoro.</p></div>
        </div>
      </section>

      <div className="shell commission-terms-layout">
        <aside><strong>Versione</strong><span>{COMMISSION_TERMS_VERSION}</span><p>La versione accettata viene registrata insieme alla richiesta e al preventivo.</p><Link href="/commissioni?request=preventivo#richiesta">Prepara la richiesta →</Link></aside>
        <article>
          <section><p className="eyebrow">01 · Politica dei contenuti</p><h2>Limiti creativi non negoziabili.</h2><ul>{commissionContentRules.map((rule) => <li key={rule}>{rule}</li>)}</ul><p>GiWise Studio può rifiutare richieste che violino queste regole o che risultino illegali, discriminatorie, lesive o sfruttino persone vulnerabili. La valutazione avviene prima del preventivo.</p></section>
          <section><p className="eyebrow">02 · Minori e autorizzazioni</p><h2>La tutela viene prima del portfolio.</h2><p>Il richiedente deve essere il genitore o il tutore legale, oppure dimostrare di avere una sua autorizzazione esplicita. Potrà essere richiesta una verifica prima dell’avvio. L’eventuale esposizione pubblica richiede un consenso separato e facoltativo.</p></section>
          <section><p className="eyebrow">03 · Preventivo e lavorazione</p><h2>Nessun lavoro parte automaticamente.</h2><p>La richiesta iniziale non obbliga all’acquisto. Il preventivo specifica prezzo, tempi, revisioni, formato di consegna, utilizzo consentito e acconto. Il lavoro inizia soltanto dopo accettazione e pagamento dell’acconto concordato.</p></section>
          <section><p className="eyebrow">04 · Modifiche, rinuncia e rimborsi</p><h2>Le condizioni economiche sono nel preventivo.</h2><p>Revisioni ulteriori, cambi strutturali, annullamento e possibili rimborsi vengono indicati nel singolo preventivo prima di qualsiasi pagamento, in base allo stato effettivo del lavoro.</p></section>
          <section><p className="eyebrow">05 · Dati e immagini</p><h2>Materiale privato, uso limitato.</h2><p>Dati e allegati vengono utilizzati per valutare, gestire e realizzare la commissione. Non sono pubblicati automaticamente e non vengono usati per addestrare sistemi di intelligenza artificiale. Sono conservati nell’archivio protetto per il tempo necessario al servizio e agli obblighi applicabili; puoi richiederne la cancellazione tramite la sezione contatti.</p><Link href="/contatti">Contatta GiWise Studio</Link></section>
        </article>
      </div>
    </main>
  );
}
