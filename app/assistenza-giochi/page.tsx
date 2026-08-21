import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SupportTicketCenter } from "@/components/SupportTicketCenter";
import { gameIssueChecklist, gameSupportRoutes } from "@/lib/gameSalesPolicy";

export const metadata: Metadata = { title: "Assistenza giochi e app", description: "Il percorso di assistenza GiWise Studio per account, ordini, download, installazione e aggiornamenti." };

export default function GameSupportPage() {
  return <main className="game-support-page">
    <header className="game-support-hero"><div className="shell"><Image src="/brand/icons/social-assistenza-concept-v1.webp" alt="Emblema illustrato dell’assistenza LoreWise" width={1224} height={1285} priority unoptimized /><div><p className="eyebrow">LoreWise Universe · assistenza GiWise Studio</p><h1>Ogni problema<br />ha una traccia.</h1><p>Dall’acquisto all’aggiornamento: una richiesta resta collegata al gioco, al LoreWise ID e all’ordine corretto.</p></div></div></header>
    <section className="shell game-support-route" aria-labelledby="game-support-route-title"><header><p className="eyebrow">Percorso di assistenza</p><h2 id="game-support-route-title">Parti dal punto giusto.</h2></header><ol>{gameSupportRoutes.map((item) => <li key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.action} →</Link></div></li>)}</ol></section>
    <section className="game-support-report" id="segnalazione"><div className="shell"><div><p className="eyebrow">Segnalazione tecnica</p><h2>Raccontaci cosa accade, non inviare segreti.</h2><p>Il ticket rimane collegato al LoreWise ID e al Centro Admin. Non copiare password, chiavi, codici completi di pagamento o altri dati riservati.</p></div><ol>{gameIssueChecklist.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol></div></section>
    <div className="shell"><SupportTicketCenter /></div>
    <section className="shell game-support-boundaries"><article><p className="eyebrow">Sicurezza</p><h2>Non spegnere le protezioni.</h2><p>Se Windows o l’antivirus segnalano il file, interrompi l’installazione e apri una richiesta. GiWise Studio confronterà nome, versione e SHA-256 con l’archivio approvato.</p><a href="mailto:lorewise.archive@gmail.com">lorewise.archive@gmail.com →</a></article><article><p className="eyebrow">Stato attuale</p><h2>Il canale ordini è ancora in prova.</h2><p>Nessun pagamento o download commerciale è attivo. Il percorso viene preparato adesso per essere collaudato integralmente con un ordine simulato.</p><Link href="/contatti">Torna a Social e contatti →</Link></article></section>
  </main>;
}
