import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Licenza personale giochi",
  description: "Bozza trasparente delle condizioni per le future edizioni Windows e Android distribuite direttamente da GiWise Studio e LoreWise Universe.",
};

const clauses = [
  ["01", "Licenza personale", "L’acquisto attribuirà al LoreWise ID indicato una licenza d’uso personale, non esclusiva e non trasferibile. Il gioco e tutti i relativi diritti resteranno di GiWise Studio."],
  ["02", "Uso consentito", "Il titolare potrà installare e utilizzare l’edizione acquistata sui propri dispositivi compatibili, nel rispetto dei limiti tecnici e di accesso comunicati nella scheda prodotto."],
  ["03", "Usi vietati", "Non saranno consentiti rivendita, redistribuzione, condivisione pubblica dell’installer, rimozione delle informazioni di tutela, elusione dei controlli di accesso o utilizzo commerciale non autorizzato."],
  ["04", "Account e consegna", "Ordine, diritto al download, ricevuta e aggiornamenti saranno collegati allo stesso LoreWise ID. L’installer non avrà un indirizzo pubblico permanente."],
  ["05", "Aggiornamenti", "Gli aggiornamenti inclusi verranno indicati nella scheda dell’edizione. Ogni nuova build dovrà superare nuovamente integrità, scansione, installazione e prova di aggiornamento."],
  ["06", "Assistenza", "Problemi di download, installazione o accesso saranno gestiti attraverso l’area assistenza. Il cliente non dovrà mai disattivare antivirus o protezioni di Windows per installare il gioco."],
] as const;

export default function GameLicensePage() {
  return <main className="game-license-page">
    <header><div className="shell"><Image src="/brand/icons/giochi-concept-v1.webp" alt="Emblema illustrato di Giochi e App" width={1024} height={1024} priority unoptimized /><div><p className="eyebrow">LoreWise Universe · GiWise Studio</p><h1>Licenza personale<br />dei giochi.</h1><p>Bozza precontrattuale locale delle edizioni Windows e Android distribuite dal catalogo LoreWise. Nessun acquisto o download è attivo.</p></div></div></header>
    <div className="shell game-license-document">
      <section className="game-license-status"><strong>Stato: bozza da approvare prima della vendita</strong><p>Versione, prezzo, durata del supporto e dati dell’installer saranno inseriti soltanto dopo il collaudo definitivo.</p></section>
      <ol>{clauses.map(([number, title, text]) => <li key={number}><span>{number}</span><div><h2>{title}</h2><p>{text}</p></div></li>)}</ol>
      <section className="game-license-signature"><div><p className="eyebrow">Integrità dei file</p><h2>Nessun avviso nascosto.</h2><p>Firma, provenienza e stato di verifica saranno dichiarati prima dell’acquisto insieme a nome file, versione, dimensione e SHA-256. LoreWise non inviterà mai a disattivare SmartScreen, Defender, Play Protect o altri strumenti di sicurezza.</p></div><ul><li>Download solo dalla libreria LoreWise</li><li>SHA-256 pubblicato e verificabile</li><li>Scansione antivirus registrata</li><li>Assistenza collegata all’ordine</li></ul></section>
      <section className="game-license-commerce"><p className="eyebrow">Acquisto e tutela</p><h2>Licenza e condizioni non sono la stessa cosa.</h2><p>Questa pagina descrive l’uso consentito del gioco. Informazioni precontrattuali, recesso, conformità e rimborsi sono raccolti nella bozza separata delle condizioni di vendita.</p><Link href="/condizioni-vendita-giochi">Leggi le condizioni di vendita →</Link></section>
      <p className="game-license-back"><Link href="/giochi/the-wound-remembers#edizione-windows">← Torna all’edizione Windows</Link></p>
    </div>
  </main>;
}
