import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { appReleaseStatusLabels, lorewiseAndroidRelease } from "@/lib/appReleases";

export const metadata: Metadata = {
  title: "Il Famiglio sempre con te | App Android",
  description: "Scarica l’app Android del Famiglio del Nexus, consulta i requisiti e segui la guida all’installazione.",
};

const release = lorewiseAndroidRelease;

export default function DownloadAppPage() {
  return (
    <main className="app-download-page">
      <section className="app-download-hero" aria-labelledby="app-download-title">
        <div className="shell app-download-hero-inner">
          <div className="app-download-copy">
            <p className="eyebrow">App Android · Famiglio del Nexus</p>
            <span className="app-download-coming-soon">DISPONIBILE PER ANDROID</span>
            <h1 id="app-download-title">Il Famiglio<br />sempre con te.</h1>
            <p>Apri la sua Tana direttamente dallo smartphone e ricevi soltanto gli avvisi davvero importanti: il ritorno da un’uscita, la fame molto bassa o un problema di salute.</p>
            <a href="#versione-android">Vai al download <span aria-hidden="true">↓</span></a>
          </div>
          <div className="app-download-familiar-scene" aria-label="La Tana illustrata del Famiglio nell’app Android">
            <Image src="/famiglio/themes/serra-celeste/giorno-v1.png" alt="Tana illustrata del Famiglio del Nexus" width={1536} height={1024} priority unoptimized />
            <div><Image src="/famiglio/navigation/personalizza-v1.webp" alt="" width={160} height={160} unoptimized /><strong>La sua storia continua</strong><span>Stessa Tana, stesso legame, ovunque sei.</span></div>
          </div>
        </div>
      </section>

      <section className="app-download-release" id="versione-android" aria-labelledby="android-release-title">
        <div className="shell app-download-release-grid">
          <header>
            <p className="eyebrow">Android · Release del Famiglio</p>
            <h2 id="android-release-title">La sua Tana,<br />in primo piano.</h2>
            <p>L’app apre esclusivamente l’esperienza Famiglio in modalità immersiva. I progressi locali rimangono sul dispositivo; con LoreWise ID vengono ritrovati e sincronizzati quando il servizio è disponibile.</p>
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
              <small>Pacchetto Android firmato da GiWise Studio per installazione diretta. Non è una versione Play Store.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="app-download-access" aria-labelledby="app-access-title">
        <div className="shell app-download-access-grid">
          <div><p className="eyebrow">Avvisi intelligenti</p><h2 id="app-access-title">Ti chiama<br />solo quando serve.</h2></div>
          <ol>
            <li><span>01</span><div><strong>È tornato dall’uscita</strong><p>Un avviso ti invita ad aprire Fuori casa per leggere il racconto e ritirare le ricompense.</p></div></li>
            <li><span>02</span><div><strong>Ha davvero fame</strong><p>Nessuna pressione continua: la notifica arriva soltanto quando la fame diventa realmente bassa.</p></div></li>
            <li><span>03</span><div><strong>Non si sente bene</strong><p>Se la salute diventa fragile, l’app ti ricorda con calma di tornare nella Tana.</p></div></li>
            <li><span>04</span><div><strong>Sempre sotto il tuo controllo</strong><p>Gli avvisi sono facoltativi e possono essere disattivati in qualsiasi momento dal Famiglio o dalle impostazioni Android.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="app-download-install" id="installazione-android">
        <div className="shell">
          <header className="app-download-install-heading">
            <div><p className="eyebrow">Installazione Android</p><h2>Dal download alla Tana.</h2></div>
            <p>Le diciture possono cambiare leggermente in base alla marca del dispositivo e alla versione di Android.</p>
          </header>
          <ol className="app-install-steps">
            <li><span>01</span><div><strong>Scarica da questa pagina</strong><p>Usa il pulsante ufficiale e attendi che il download dell’APK sia completo.</p></div></li>
            <li><span>02</span><div><strong>Apri il file APK</strong><p>Dal browser o dalla cartella Download, tocca il file appena scaricato.</p></div></li>
            <li><span>03</span><div><strong>Autorizza questa origine</strong><p>Se Android blocca l’installazione, consenti temporaneamente l’installazione da questa origine per il browser o il gestore file usato.</p></div></li>
            <li><span>04</span><div><strong>Installa e apri</strong><p>Concludi l’installazione, apri il Famiglio e scegli se consentire le notifiche. Poi puoi revocare il permesso per le origini sconosciute.</p></div></li>
          </ol>
          <div className="app-download-security-note">
            <div><p className="eyebrow">Autenticità verificabile</p><h3>Controlla sempre provenienza e impronta del file.</h3></div>
            <div><p>La release viene preparata con firma digitale e controlli sul pacchetto. Versione, dimensione e SHA-256 permettono di confrontare il file scaricato con quello predisposto da GiWise Studio.</p><p>Non installare copie ricevute via chat, email o siti esterni. Se Play Protect segnala una minaccia concreta, interrompi l’installazione e contatta l’assistenza.</p></div>
          </div>
        </div>
      </section>

      <section className="app-download-warnings" aria-labelledby="android-warnings-title">
        <div className="shell app-download-warnings-layout">
          <header><p className="eyebrow">Avvisi possibili</p><h2 id="android-warnings-title">Cosa può mostrare il dispositivo.</h2><p>Android avverte quando un’app viene installata fuori dal Play Store. Leggi sempre il messaggio completo prima di continuare.</p></header>
          <div className="app-download-warning-list">
            <article><p>Origine sconosciuta</p><h3>Installazione bloccata</h3><span>Concedi il permesso soltanto al browser o al gestore file usato, quindi revocalo dopo l’installazione.</span></article>
            <article><p>Avviso del browser</p><h3>Il file potrebbe essere dannoso</h3><span>È un messaggio generico frequente per gli APK. Continua solo se il file proviene da questa pagina e i dati di integrità coincidono.</span></article>
            <article><p>Google Play Protect</p><h3>App non riconosciuta</h3><span>Consenti la scansione. Se compare una rilevazione di minaccia, non aggirare l’avviso e segnala il problema all’assistenza LoreWise.</span></article>
            <article><p>Errore di sistema</p><h3>App non installata</h3><span>Controlla spazio libero e compatibilità Android, riscarica il file e rimuovi eventuali versioni precedenti firmate diversamente.</span></article>
          </div>
        </div>
      </section>

      <section className="app-download-integrity" aria-labelledby="app-integrity-title">
        <div className="shell app-download-integrity-grid">
          <div><p className="eyebrow">Download controllato</p><h2 id="app-integrity-title">Sai sempre<br />cosa installi.</h2></div>
          <div>
            <p>Confronta i dati del file prima dell’installazione. Gli aggiornamenti futuri del sito saranno visibili nell’app senza trasformarla nell’intero portale: resterà dedicata al Famiglio.</p>
            <dl>
              <div><dt>Data rilascio</dt><dd>{release.publishedAt ?? "In attesa del collaudo"}</dd></div>
              <div><dt>Dimensione</dt><dd>{release.fileSize ?? "Disponibile al rilascio"}</dd></div>
              <div><dt>SHA-256</dt><dd>{release.sha256 ?? "Disponibile al rilascio"}</dd></div>
            </dl>
            <Link href="/assistenza-giochi">Apri l’assistenza installazione <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
