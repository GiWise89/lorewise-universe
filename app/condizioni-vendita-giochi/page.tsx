import type { Metadata } from "next";
import Link from "next/link";
import { gameSalesClauses } from "@/lib/gameSalesPolicy";

export const metadata: Metadata = {
  title: "Condizioni di vendita · Giochi digitali",
  description: "Bozza precontrattuale locale per la futura vendita diretta dei giochi digitali GiWise Studio.",
};

export default function GameSalesTermsPage() {
  return <main className="game-sales-terms-page">
    <header><div className="shell"><p className="eyebrow">Bozza precontrattuale · modalità prova</p><h1>Vendita digitale,<br />senza zone d’ombra.</h1><p>Questa pagina prepara il percorso commerciale dell’edizione Windows. Non sostituisce una revisione legale professionale e non attiva alcun pagamento.</p></div></header>
    <div className="shell game-sales-terms-document">
      <aside><strong>Vendita reale non ancora attivabile</strong><p>Luigi Marzo ha dichiarato di non disporre attualmente di azienda, sede o Partita IVA. Prima della pubblicazione commerciale servono un inquadramento professionale dell’attività, i dati obbligatori del venditore, il canale ufficiale di assistenza, la durata del supporto e l’informativa di recesso definitiva. I dati tecnici dell’installer 1.0.2 sono già verificati localmente.</p></aside>
      <ol>{gameSalesClauses.map((clause) => <li key={clause.number}><span>{clause.number}</span><div><h2>{clause.title}</h2><p>{clause.text}</p></div></li>)}</ol>
      <section className="game-sales-terms-sources"><div><p className="eyebrow">Fonti istituzionali consultate</p><h2>La regola tecnica segue quella commerciale.</h2><p>Le formulazioni definitive dovranno essere ricontrollate prima dell’attivazione pubblica. Questa bozza è basata sulle informazioni istituzionali per vendite a distanza, recesso e garanzia dei contenuti digitali.</p></div><ul><li><a href="https://www.mimit.gov.it/it/mercato-e-consumatori/tutela-del-consumatore/diritti-del-consumatore/vendita-a-distanza" target="_blank" rel="noopener noreferrer">MIMIT · Vendita a distanza ↗</a></li><li><a href="https://www.mimit.gov.it/it/mercato-e-consumatori/tutela-del-consumatore/diritti-del-consumatore/diritto-di-recesso" target="_blank" rel="noopener noreferrer">MIMIT · Diritto di recesso ↗</a></li><li><a href="https://www.mimit.gov.it/it/mercato-e-consumatori/tutela-del-consumatore/diritti-del-consumatore/garanzia-legale" target="_blank" rel="noopener noreferrer">MIMIT · Garanzia legale ↗</a></li></ul></section>
      <p className="game-sales-terms-back"><Link href="/licenza-gioco">← Leggi anche la licenza personale</Link></p>
    </div>
  </main>;
}
