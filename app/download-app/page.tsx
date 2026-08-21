import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { appReleaseStatusLabels, lorewiseAndroidRelease } from "@/lib/appReleases";

export const metadata: Metadata = {
  title: "Scarica l'app LoreWise Universe",
  description: "Pagina ufficiale per scaricare e verificare la beta APK Android di LoreWise Universe.",
};

const release = lorewiseAndroidRelease;

export default function DownloadAppPage() {
  return (
    <main className="app-download-page">
      <section className="app-download-hero" aria-labelledby="app-download-title">
        <div className="shell app-download-hero-inner">
          <div className="app-download-copy">
            <p className="eyebrow">Applicazione Android GiWise Studio</p>
            <h1 id="app-download-title">LoreWise<br />sempre con te.</h1>
            <p>Esplora progetti, opere, dossier e contenuti riservati da un unico accesso. La beta Android include le sezioni e i servizi LoreWise disponibili sul dominio ufficiale. Richiede una connessione internet.</p>
            <a href="#versione-android">Controlla la versione Android <span aria-hidden="true">↓</span></a>
          </div>
          <div className="app-download-identity" aria-label="Identita visiva di LoreWise Universe per Android">
            <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="LoreWise Universe" width={1536} height={1024} priority unoptimized />
            <Image src="/brand/icons/giochi-concept-v1.webp" alt="" width={1536} height={1024} unoptimized />
          </div>
        </div>
      </section>

      <section className="app-download-release" id="versione-android" aria-labelledby="android-release-title">
        <div className="shell app-download-release-grid">
          <header>
            <p className="eyebrow">Android · Beta ufficiale</p>
            <h2 id="android-release-title">APK<br />LoreWise Universe</h2>
            <p>Il pacchetto ha superato compilazione, lint, controllo della firma e verifica di integrita. Il collaudo su dispositivo fisico resta parte del programma beta.</p>
          </header>
          <div className="app-download-release-data">
            <dl>
              <div><dt>Versione</dt><dd>{release.version}</dd></div>
              <div><dt>Formato</dt><dd>{release.format}</dd></div>
              <div><dt>Requisiti</dt><dd>{release.minimumSystem}</dd></div>
              <div><dt>Funzionamento</dt><dd>{release.connection}</dd></div>
            </dl>
            <div className={`app-download-state app-download-state-${release.status}`}>
              <span>Stato distribuzione</span>
              <strong>{appReleaseStatusLabels[release.status]}</strong>
              {release.downloadHref ? <a href={release.downloadHref} download>Scarica APK <span aria-hidden="true">↓</span></a> : <span className="app-download-disabled" aria-disabled="true">APK in verifica</span>}
              <small>Release firmata per installazione diretta. Non e una build Play Store.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="app-download-access" aria-labelledby="app-access-title">
        <div className="shell app-download-access-grid">
          <div><p className="eyebrow">Un'app, accessi distinti</p><h2 id="app-access-title">Pubblico fuori.<br />Riservato dentro.</h2></div>
          <ol>
            <li><span>01</span><div><strong>Esplorazione pubblica</strong><p>Progetti, novita, opere e dossier consultabili senza abbonamento.</p></div></li>
            <li><span>02</span><div><strong>LoreWise ID</strong><p>Un solo profilo per ordini, assistenza, preferenze e contenuti personali.</p></div></li>
            <li><span>03</span><div><strong>Universe Pass</strong><p>La VIP Zone si apre soltanto agli abbonati con un Pass realmente attivo.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="app-download-install" id="installazione-android">
        <div className="shell">
          <header className="app-download-install-heading">
            <div><p className="eyebrow">Installazione Android</p><h2>Dal download al primo avvio.</h2></div>
            <p>La beta viene distribuita come APK LoreWise firmato per installazione diretta. Le diciture possono cambiare leggermente in base alla marca del dispositivo e alla versione di Android.</p>
          </header>
          <ol className="app-install-steps">
            <li><span>01</span><div><strong>Scarica da questa pagina</strong><p>Usa soltanto il pulsante ufficiale e attendi che il download sia completo.</p></div></li>
            <li><span>02</span><div><strong>Apri il file APK</strong><p>Dal browser o dalla cartella Download, tocca il file appena scaricato.</p></div></li>
            <li><span>03</span><div><strong>Autorizza questa origine</strong><p>Se Android blocca l'installazione, apri Impostazioni e abilita temporaneamente &quot;Consenti da questa origine&quot; per il browser o il gestore file usato.</p></div></li>
            <li><span>04</span><div><strong>Installa e ripristina la protezione</strong><p>Torna al file, scegli Installa e, al termine, disattiva nuovamente il permesso per le app sconosciute.</p></div></li>
          </ol>
          <div className="app-download-security-note">
            <div><p className="eyebrow">Autenticità verificabile</p><h3>La beta APK viene controllata prima della pubblicazione.</h3></div>
            <div><p>Nessun software può essere garantito sicuro al 100% in senso assoluto. La release LoreWise viene però pubblicata solo dopo firma, verifica del pacchetto e controllo di integrita. Hash SHA-256, dimensione e data permetteranno di confrontare il file scaricato con l'originale ufficiale.</p><p>Non installare copie ricevute via chat, email o siti esterni. Se Play Protect segnala una minaccia concreta, interrompi l'installazione e contatta l'assistenza.</p></div>
          </div>
        </div>
      </section>

      <section className="app-download-warnings" aria-labelledby="android-warnings-title">
        <div className="shell app-download-warnings-layout">
          <header><p className="eyebrow">Avvisi possibili</p><h2 id="android-warnings-title">Cosa può mostrare il dispositivo.</h2><p>Un avviso non indica sempre un problema: Android avverte quando un'app arriva fuori dal Play Store. Leggi comunque il messaggio prima di continuare.</p></header>
          <div className="app-download-warning-list">
            <article><p>Origine sconosciuta</p><h3>Installazione bloccata</h3><span>Concedi il permesso soltanto al browser o al gestore file usato per questo download, quindi revocalo dopo l'installazione.</span></article>
            <article><p>Avviso del browser</p><h3>Il file potrebbe essere dannoso</h3><span>È un messaggio generico per i file APK. Continua solo se il download proviene da questa pagina e i dati di integrità coincidono.</span></article>
            <article><p>Google Play Protect</p><h3>App non riconosciuta</h3><span>Consenti la scansione. Se compare una vera rilevazione di minaccia, non aggirare l'avviso e segnala il problema all'assistenza LoreWise.</span></article>
            <article><p>Errore di sistema</p><h3>App non installata</h3><span>Controlla spazio libero e compatibilità Android, riscarica il file e rimuovi eventuali versioni precedenti firmate diversamente.</span></article>
          </div>
        </div>
      </section>
      <section className="app-download-integrity" aria-labelledby="app-integrity-title">
        <div className="shell app-download-integrity-grid">
          <div><p className="eyebrow">Download controllato</p><h2 id="app-integrity-title">Sai sempre<br />cosa installi.</h2></div>
          <div>
            <p>Ogni rilascio mostrera versione, dimensione, data e impronta SHA-256. In questo modo il file scaricato potra essere confrontato con quello pubblicato da GiWise Studio.</p>
            <dl>
              <div><dt>Data rilascio</dt><dd>{release.publishedAt ?? "In attesa del collaudo"}</dd></div>
              <div><dt>Dimensione</dt><dd>{release.fileSize ?? "Disponibile al rilascio"}</dd></div>
              <div><dt>SHA-256</dt><dd>{release.sha256 ?? "Disponibile al rilascio"}</dd></div>
            </dl>
            <Link href="/assistenza-giochi">Apri l'assistenza installazione <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
