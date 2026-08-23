import type { Metadata } from "next";
import Link from "next/link";
import { ACCOUNT_PRIVACY_VERSION, LOREWISE_OWNER_EMAIL } from "@/lib/accountPolicy";

export const metadata: Metadata = {
  title: "Privacy, cookie e dati",
  description: "Informativa sul trattamento dei dati, sui cookie tecnici e sull’archiviazione locale di LoreWise Universe.",
  alternates: { canonical: "/privacy" },
};

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

const privacyIndex = [
  ["titolare", "Titolare e contatti"],
  ["dati-finalita", "Dati, finalità e basi giuridiche"],
  ["account-acquisti", "Account, acquisti e richieste"],
  ["statistiche", "Statistiche proprietarie"],
  ["cookie", "Cookie e memoria locale"],
  ["fornitori", "Fornitori e trasferimenti"],
  ["conservazione", "Conservazione"],
  ["diritti", "Diritti e reclami"],
  ["minori", "Minori e contenuti 18+"],
  ["aggiornamenti", "Aggiornamenti dell’informativa"],
] as const;

export default function PrivacyPage() {
  return <main className="privacy-page">
    <header className="privacy-hero"><div className="shell">
      <p className="eyebrow">Trasparenza LoreWise Universe</p>
      <h1>I tuoi dati non sono una moneta.</h1>
      <p>Qui trovi, in un solo documento, come LoreWise tratta i dati personali, quali strumenti tecnici utilizza e quali scelte restano sempre sotto il tuo controllo.</p>
      <strong>{ACCOUNT_PRIVACY_VERSION} · aggiornata il 24 agosto 2026</strong>
    </div></header>

    <div className="privacy-layout shell">
      <nav className="privacy-index" aria-label="Indice dell’informativa">
        <p>Indice dell’informativa</p>
        <ol>{privacyIndex.map(([id, label], index) => <li key={id}><a href={`#${id}`}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a></li>)}</ol>
        <small>Nessun cookie pubblicitario o di profilazione è attualmente installato da LoreWise.</small>
      </nav>

      <article className="privacy-document">
        <section id="titolare"><span>01</span><div>
          <p className="privacy-kicker">Chi decide finalità e modalità</p><h2>Titolare e contatti</h2>
          <p>Il titolare del trattamento è <strong>Luigi Marzo</strong>, responsabile del progetto LoreWise Universe e GiWise Studio. Per richieste relative a privacy, account e dati personali puoi scrivere a <a href={`mailto:${LOREWISE_OWNER_EMAIL}`}>{LOREWISE_OWNER_EMAIL}</a> oppure utilizzare l’area assistenza. Non risulta nominato un responsabile della protezione dei dati; le richieste vanno quindi indirizzate direttamente al titolare.</p>
          <Link href="/contatti#assistenza">Apri l’area assistenza</Link>
        </div></section>

        <section id="dati-finalita"><span>02</span><div>
          <p className="privacy-kicker">Cosa viene trattato e perché</p><h2>Dati, finalità e basi giuridiche</h2>
          <div className="privacy-facts">
            <article><h3>Navigazione e sicurezza</h3><p>Dati tecnici della richiesta e registri indispensabili a consegnare le pagine, prevenire abusi e proteggere il servizio.</p><small>Base giuridica: legittimo interesse alla sicurezza e corretta erogazione del servizio.</small></article>
            <article><h3>LoreWise ID</h3><p>Email, identificativo dell’account, verifica, dati di sessione, nome pubblico e preferenze eventualmente inserite.</p><small>Base giuridica: esecuzione del servizio richiesto e misure precontrattuali.</small></article>
            <article><h3>Ordini e pagamenti</h3><p>Riferimenti dell’ordine, prodotti, importi, stato del pagamento, ricevute, licenze, consegne e rimborsi. LoreWise non riceve il numero completo della carta.</p><small>Base giuridica: contratto e obblighi amministrativi, fiscali e contabili applicabili.</small></article>
            <article><h3>Commissioni e assistenza</h3><p>Contatti, brief, allegati, messaggi, stato della richiesta e informazioni necessarie a preparare un preventivo o risolvere un problema.</p><small>Base giuridica: misure precontrattuali, contratto e gestione della richiesta dell’utente.</small></article>
            <article><h3>Community</h3><p>Profilo pubblico facoltativo, commenti, reazioni, recensioni, segnalazioni e dati necessari alla moderazione.</p><small>Base giuridica: servizio richiesto e legittimo interesse alla tutela della community.</small></article>
            <article><h3>Comunicazioni facoltative</h3><p>Aggiornamenti Community e novità GiWise Studio vengono inviati solo dopo una scelta separata, inizialmente disattivata.</p><small>Base giuridica: consenso, revocabile in qualsiasi momento senza effetti sull’account.</small></article>
          </div>
        </div></section>

        <section id="account-acquisti"><span>03</span><div>
          <p className="privacy-kicker">Servizi personali e commerciali</p><h2>Account, acquisti e richieste</h2>
          <p>I dati dell’account collegano in modo protetto ordini, licenze, Universe Pass, commissioni, download e richieste di assistenza a un unico LoreWise ID. I campi facoltativi restano tali e le preferenze promozionali non condizionano registrazione, acquisto o assistenza. I dati non vengono venduti, ceduti per pubblicità comportamentale o utilizzati per addestrare sistemi di intelligenza artificiale.</p>
          <p>Quando l’utente avvia un pagamento viene aperto Stripe Checkout. Stripe tratta direttamente i dati di pagamento e può operare anche come autonomo titolare per prevenzione delle frodi e obblighi normativi. I prodotti del GiWise Shop sono invece aperti sul negozio esterno, soggetto alla propria informativa.</p>
        </div></section>

        <section id="statistiche"><span>04</span><div>
          <p className="privacy-kicker">Misurazione senza profilazione</p><h2>Statistiche proprietarie</h2>
          <p>Sul solo dominio pubblico LoreWise registra l’apertura delle pagine, il solo dominio referente e un identificatore casuale temporaneo della sessione, trasformato ogni giorno in hash. L’applicazione non salva nell’archivio statistico indirizzi IP, email, URL completi di provenienza o informazioni pubblicitarie. Account, amministrazione e aree di gestione sono escluse.</p>
          <p>Le statistiche servono esclusivamente a comprendere quali sezioni funzionano e a migliorare il sito. Non vengono combinate con profili, ordini o dati di terzi e gli eventi dettagliati vengono eliminati dopo 90 giorni. Per questa configurazione proprietaria e minimizzata non viene richiesto un consenso preventivo.</p>
        </div></section>

        <section id="cookie"><span>05</span><div>
          <p className="privacy-kicker">Cosa resta sul dispositivo</p><h2>Cookie e memoria locale</h2>
          <p>LoreWise utilizza soltanto strumenti necessari al servizio richiesto o alla memorizzazione di una scelta espressa dall’utente. Per questo non viene mostrato un banner di consenso. Se in futuro saranno introdotti strumenti di profilazione o marketing, resteranno bloccati fino a una scelta esplicita.</p>
          <div className="privacy-storage-table" role="region" aria-label="Elenco di cookie e archiviazione locale" tabIndex={0}>
            <table><thead><tr><th>Strumento</th><th>Finalità</th><th>Durata</th><th>Tipo</th></tr></thead><tbody>
              <tr><td><code>lorewise-session-mode</code></td><td>Ricorda se la sessione richiesta deve terminare col browser o restare attiva.</td><td>Sessione oppure massimo 400 giorni.</td><td>Cookie tecnico, HttpOnly</td></tr>
              <tr><td><code>sb-…-auth-token</code></td><td>Mantiene autenticazione e rinnovo sicuro della sessione Supabase.</td><td>Sessione, uscita dall’account o scadenza configurata.</td><td>Cookie tecnico di autenticazione</td></tr>
              <tr><td>Email ricordata</td><td>Compila l’email di accesso soltanto quando “Ricordami” è selezionato.</td><td>Fino alla rimozione della scelta o dei dati del sito.</td><td>Archiviazione locale funzionale</td></tr>
              <tr><td>Preferenza spoiler Codex</td><td>Conserva il livello di spoiler scelto per i dossier.</td><td>Fino alla modifica o cancellazione dei dati del sito.</td><td>Archiviazione locale funzionale</td></tr>
              <tr><td>Raccolta e proposte Codex</td><td>Conserva sul dispositivo segnalibri e bozze locali richieste dall’utente.</td><td>Fino alla rimozione da parte dell’utente o del browser.</td><td>Archiviazione locale funzionale</td></tr>
            </tbody></table>
          </div>
          <p className="privacy-note">La cancellazione dei cookie del browser può chiudere la sessione. La cancellazione della memoria locale rimuove email ricordata, preferenze, segnalibri e bozze non inviate.</p>
        </div></section>

        <section id="fornitori"><span>06</span><div>
          <p className="privacy-kicker">Destinatari tecnici</p><h2>Fornitori e trasferimenti</h2>
          <p>I dati sono accessibili soltanto a chi ne ha bisogno per fornire o proteggere il servizio. I principali destinatari tecnici, secondo le funzioni effettivamente attivate, sono:</p>
          <ul className="privacy-provider-list">
            <li><strong>Supabase</strong><span>Autenticazione, account e sessioni.</span><a href="https://supabase.com/privacy" {...externalLinkProps}>Privacy Supabase ↗</a></li>
            <li><strong>Stripe</strong><span>Checkout, pagamenti, abbonamenti, rimborsi e prevenzione delle frodi.</span><a href="https://stripe.com/privacy" {...externalLinkProps}>Privacy Stripe ↗</a></li>
            <li><strong>Netlify e Cloudflare</strong><span>Hosting, distribuzione, database, archivi protetti, sicurezza e registri tecnici di rete.</span><span><a href="https://www.netlify.com/privacy/" {...externalLinkProps}>Netlify ↗</a> · <a href="https://www.cloudflare.com/privacypolicy/" {...externalLinkProps}>Cloudflare ↗</a></span></li>
            <li><strong>Resend</strong><span>Invio delle email operative e, soltanto se autorizzate, delle comunicazioni facoltative.</span><a href="https://resend.com/legal/privacy-policy" {...externalLinkProps}>Privacy Resend ↗</a></li>
          </ul>
          <p>Alcuni fornitori o loro sub-responsabili possono trattare dati fuori dallo Spazio economico europeo. In tali casi il trasferimento deve avvenire mediante decisioni di adeguatezza, Data Privacy Framework ove applicabile, clausole contrattuali standard o altre garanzie previste dagli articoli 44 e seguenti del GDPR. I semplici collegamenti a social network, Discord, WhatsApp e negozi esterni non installano strumenti di tali piattaforme su LoreWise; aprendoli, l’utente entra nei rispettivi servizi e nelle relative informative.</p>
        </div></section>

        <section id="conservazione"><span>07</span><div>
          <p className="privacy-kicker">Tempi proporzionati allo scopo</p><h2>Conservazione</h2>
          <ul className="privacy-retention-list">
            <li><strong>Statistiche dettagliate:</strong> massimo 90 giorni.</li>
            <li><strong>Account attivo:</strong> per la durata del rapporto; un account inattivo può essere cancellato dopo 24 mesi, con avviso almeno 30 giorni prima.</li>
            <li><strong>Richieste e assistenza:</strong> per il tempo necessario alla gestione e, successivamente, entro i termini utili alla tutela delle parti.</li>
            <li><strong>Ordini, fatture e dati amministrativi:</strong> per il periodo imposto dalla normativa fiscale, contabile e civilistica applicabile.</li>
            <li><strong>Consensi e preferenze:</strong> fino alla revoca, sostituzione o cessazione del servizio, conservando quando necessario la prova della scelta.</li>
            <li><strong>Contenuti Community:</strong> finché restano pubblicati o necessari alla moderazione; segnalazioni e provvedimenti possono essere conservati per prevenire abusi e contestazioni.</li>
          </ul>
          <p>Scaduto il termine, i dati vengono cancellati, anonimizzati o isolati quando un obbligo giuridico ne impone una conservazione ulteriore.</p>
        </div></section>

        <section id="diritti"><span>08</span><div>
          <p className="privacy-kicker">Controllo dell’interessato</p><h2>Diritti e reclami</h2>
          <p>Nei casi previsti dal GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione; puoi inoltre revocare un consenso senza pregiudicare la liceità del trattamento precedente. Puoi gestire alcune preferenze e avviare la cancellazione direttamente dall’account oppure scrivere al contatto privacy. Prima di intervenire potrà essere richiesta una verifica dell’identità per evitare accessi non autorizzati.</p>
          <p>Se ritieni che il trattamento violi la normativa, puoi presentare reclamo al <a href="https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/4535524" {...externalLinkProps}>Garante per la protezione dei dati personali ↗</a>. Non vengono adottate decisioni esclusivamente automatizzate che producano effetti giuridici sull’utente e non viene effettuata profilazione pubblicitaria.</p>
          <Link href="/account">Gestisci dati e preferenze</Link>
        </div></section>

        <section id="minori"><span>09</span><div>
          <p className="privacy-kicker">Protezione aggiuntiva</p><h2>Minori e contenuti 18+</h2>
          <p>Per creare LoreWise ID è richiesto dichiarare di avere almeno 16 anni. Questa soglia non autorizza l’accesso alle opere contrassegnate 18+, riservate esclusivamente agli adulti mediante un controllo separato. Chi esercita la responsabilità genitoriale può contattare LoreWise per segnalare dati inviati senza i presupposti richiesti.</p>
        </div></section>

        <section id="aggiornamenti"><span>10</span><div>
          <p className="privacy-kicker">Versione e modifiche</p><h2>Aggiornamenti dell’informativa</h2>
          <p>Questa informativa descrive la configurazione attuale del progetto. Sarà aggiornata quando cambieranno funzioni, fornitori o tempi di conservazione. Le modifiche sostanziali verranno comunicate nell’account o con un avviso adeguato; quando una nuova finalità richiederà il consenso, non sarà attivata prima di una scelta libera e specifica.</p>
          <p><strong>Versione:</strong> {ACCOUNT_PRIVACY_VERSION}<br /><strong>Ultimo aggiornamento:</strong> 24 agosto 2026</p>
        </div></section>

        <aside><strong>Una regola semplice.</strong><p>Cookie tecnici e preferenze richieste rendono possibile il servizio; non vengono usati per inseguire l’utente sul web. Se questa configurazione cambierà, cambieranno prima l’informativa e gli strumenti di scelta.</p></aside>
      </article>
    </div>
  </main>;
}
