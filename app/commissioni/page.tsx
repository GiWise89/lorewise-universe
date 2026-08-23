import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommissionPortfolio } from "@/components/CommissionPortfolio";
import { CommissionRequestForm } from "@/components/CommissionRequestForm";
import { CommissionAvailability } from "@/components/CommissionAvailability";
import { UniverseGuide } from "@/components/UniverseGuide";
import { commissionContentRules } from "@/lib/commissionTerms";
import { commissionOpeningPromotion, isCommissionOpeningPromotionActive } from "@/lib/commissionPromotion";
import { getLoreWiseUser } from "@/lib/supabase/server";
import {
  carolineProject,
  commissionCategories,
  commissionWorks,
  featuredCommissionWorks,
  giorgegoProject,
} from "@/lib/commissionCatalog";

export const metadata: Metadata = {
  title: "Commissioni artistiche",
  description: "Scopri 37 lavori realizzati su commissione da GiWise Studio: ritratti, coppie, animali, trasformazioni fantasy e fan art protette.",
};

const steps = [
  ["01", "Racconta l’idea", "Soggetto, atmosfera, formato, riferimenti e uso previsto."],
  ["02", "Ricevi la proposta", "Fattibilità, preventivo, tempi, revisioni e condizioni vengono definiti prima dell’inizio."],
  ["03", "Segui il lavoro", "Bozza e revisione concordata permettono di verificare la direzione del ritratto."],
  ["04", "Ricevi i file", "La consegna avviene nel formato e nella risoluzione previsti dall’accordo."],
] as const;

const pricingPackages = [
  {
    name: "Ritratto Essenziale",
    price: "49 €",
    image: commissionWorks[12].image,
    alt: "Contrasto, esempio protetto di ritratto essenziale a soggetto singolo su sfondo neutro",
    description: "Un soggetto, mezzo busto, sfondo semplice e una revisione inclusa.",
    timing: "3 giorni lavorativi",
    idealFor: "Un volto, un animale o un regalo essenziale.",
    includes: ["1 soggetto", "Sfondo semplice", "1 revisione", "JPG e PNG finali"],
  },
  {
    name: "Ritratto Completo",
    price: "79 €",
    image: commissionWorks[27].image,
    alt: "Estate elettrica, esempio protetto di ritratto completo con posa dinamica e luce ambientata",
    description: "Figura completa o coppia semplice, sfondo curato e due revisioni incluse.",
    timing: "5 giorni lavorativi",
    idealFor: "Una figura intera, una coppia o un ritratto più ambientato.",
    includes: ["1 figura intera o coppia semplice", "Sfondo curato", "2 revisioni", "JPG e PNG finali"],
  },
  {
    name: "Opera Narrativa",
    price: "119 €",
    image: commissionWorks[30].image,
    alt: "Campione del Caos, esempio protetto di trasformazione narrativa fantasy completa",
    description: "Trasformazione fantasy o horror, scena articolata e tre revisioni incluse.",
    timing: "8 giorni lavorativi",
    idealFor: "Una scena fantasy o horror con atmosfera e racconto.",
    includes: ["Scena articolata", "Trasformazione narrativa", "3 revisioni", "JPG e PNG finali"],
  },
] as const;

export default async function CommissionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getLoreWiseUser();
  const query = await searchParams;
  const initialPackage = typeof query?.package === "string" ? query.package : "";
  const initialReference = typeof query?.reference === "string" ? query.reference : "";
  const promotionActive = isCommissionOpeningPromotionActive();
  return (
    <main className="commission-page">
      <section className="commission-hero" aria-labelledby="commission-title">
        <div className="shell commission-hero-grid">
          <div className="commission-hero-copy">
            <p className="eyebrow">GiWise Studio · Ritratti su richiesta</p>
            <h1 id="commission-title">
              <span>La tua storia,</span>
              <span>in un’immagine.</span>
            </h1>
            <p>Ritratti personali, coppie, animali e trasformazioni fantasy costruiti attorno al soggetto. Qui non trovi prodotti da rivendere: trovi lavori realmente eseguiti su commissione.</p>
            <div className="button-row">
              <Link className="button button-primary" href="#richiesta">Raccontami la tua idea</Link>
              <Link className="button button-ghost" href="#portfolio">Esplora i 37 lavori</Link>
              <Link className="button button-ghost" href="/commissioni/stato">Segui una richiesta</Link>
            </div>
          </div>
          <div className="commission-hero-art" aria-label="Selezione di ritratti protetti realizzati su commissione">
            {featuredCommissionWorks.slice(0, 3).map((work) => (
              <Image key={work.code} src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized priority />
            ))}
          </div>
        </div>
      </section>

      <section className="commission-featured shell" aria-labelledby="commission-featured-title">
        <header className="commission-section-heading">
          <div><p className="eyebrow">Sei linguaggi su commissione</p><h2 id="commission-featured-title">Dal volto reale al personaggio.</h2></div>
          <p>Una selezione iniziale attraversa ritratto, coppia, animale, horror, lifestyle e trasformazione narrativa.</p>
        </header>
        <div className="commission-featured-grid">
          {featuredCommissionWorks.map((work) => (
            <Link href={`/commissioni/${work.slug}`} key={work.code}>
              <Image src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized />
              <span><small>{work.requestType}</small><strong>{work.title}</strong><em>Commissione realizzata</em></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="commission-pricing" id="listino" aria-labelledby="commission-pricing-title">
        <div className="shell">
          <header className="commission-section-heading">
            <div><p className="eyebrow">Tariffe di lancio 2026</p><h2 id="commission-pricing-title">Un prezzo speciale per iniziare insieme.</h2></div>
            <p>I prezzi sono di partenza: il preventivo definitivo viene confermato prima di iniziare e dipende dalla complessità reale della richiesta.</p>
          </header>
          <CommissionAvailability />
          {promotionActive ? <aside className="commission-promotion-banner" aria-label="Promozione commissioni attiva">
            <div>
              <small>{commissionOpeningPromotion.shortLabel}</small>
              <strong>Più vantaggi per chi entra ora nel Nexus.</strong>
              <p>{commissionOpeningPromotion.deadlineLabel}. Lo sconto viene calcolato sul preventivo finale e resta acquisito anche se il lavoro termina dopo la scadenza.</p>
            </div>
            <dl>
              <div><dt>Visitatori</dt><dd>−{commissionOpeningPromotion.rates.visitor}%</dd></div>
              <div><dt>Supporter</dt><dd>−{commissionOpeningPromotion.rates.supporter}%</dd></div>
              <div><dt>Collector</dt><dd>−{commissionOpeningPromotion.rates.collector}%</dd></div>
            </dl>
          </aside> : null}
          <div className="commission-price-grid">
            {pricingPackages.map((item) => (
              <article key={item.name}>
                <Image src={item.image} alt={item.alt} width={1131} height={1600} unoptimized />
                <div>
                  {promotionActive ? <span className="commission-card-promo">Fino al 20% di sconto sul preventivo</span> : null}
                  <small>A partire da</small>
                  <strong>{item.price}</strong>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <em>{item.idealFor}</em>
                  <ul>{item.includes.map((entry) => <li key={entry}>{entry}</li>)}</ul>
                  <span>{item.timing}</span>
                  <Link href={`/commissioni?package=${encodeURIComponent(item.name)}#richiesta`}>Scegli questo percorso →</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="commission-pricing-details">
            <section aria-labelledby="commission-extras-title">
              <p className="eyebrow">Supplementi</p>
              <h3 id="commission-extras-title">Quando la richiesta cresce.</h3>
              <dl>
                <div><dt>Soggetto aggiuntivo</dt><dd>+30 €</dd></div>
                <div><dt>Animale aggiuntivo</dt><dd>+20 €</dd></div>
                <div><dt>Sfondo molto complesso</dt><dd>da +25 €</dd></div>
                <div><dt>Revisione aggiuntiva</dt><dd>+15 €</dd></div>
                <div><dt>Consegna urgente concordata</dt><dd>+20%</dd></div>
                <div><dt>Utilizzo commerciale</dt><dd>Preventivo separato</dd></div>
              </dl>
            </section>
            <section aria-labelledby="commission-terms-title">
              <p className="eyebrow">Condizioni essenziali</p>
              <h3 id="commission-terms-title">Tutto chiaro prima della bozza.</h3>
              <ul>
                <li>Acconto del 50% per prenotare e iniziare il lavoro.</li>
                <li>Saldo prima della consegna dei file definitivi ad alta risoluzione.</li>
                <li>JPG e PNG appiattiti inclusi nella consegna.</li>
                <li>Modifiche strutturali dopo l’approvazione della bozza valutate separatamente.</li>
                <li>Pubblicazione nel portfolio facoltativa e concordata con il cliente.</li>
                <li>Consenso del tutore necessario per i ritratti di minori.</li>
              </ul>
              <Link className="commission-terms-link" href="/commissioni/condizioni">Leggi tutte le condizioni e la politica dei contenuti →</Link>
            </section>
          </div>
          <p className="commission-pricing-note">Le disponibilità vengono aggiornate soltanto dopo la conferma effettiva di ogni incarico. Acconto e saldo vengono aperti esclusivamente dopo l’accettazione del preventivo e restano collegati alla stessa pratica.</p>
        </div>
      </section>

      <CommissionPortfolio works={commissionWorks} />

      <section className="commission-case-studies" aria-labelledby="case-studies-title">
        <div className="shell">
          <header className="commission-section-heading">
            <div><p className="eyebrow">Progetti in evidenza</p><h2 id="case-studies-title">Lo stesso soggetto può raccontare storie diverse.</h2></div>
            <p>Le serie mostrano come posa, atmosfera e livello di dettaglio cambino il risultato senza perdere l’identità della persona.</p>
          </header>
          <article className="commission-case-study">
            <div className="commission-case-copy"><small>Progetto 01 · Tre interpretazioni</small><h3>Tre modi di essere</h3><p>Una serie di tre ritratti dedicata allo stesso soggetto: primo piano, figura e ambientazione costruiscono tre presenze distinte.</p></div>
            <div className="commission-case-images">{carolineProject.map((work) => <Link href={`/commissioni/${work.slug}`} key={work.code}><Image src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized /></Link>)}</div>
          </article>
          <article className="commission-case-study commission-case-reverse">
            <div className="commission-case-copy"><small>Progetto 02 · Due atmosfere</small><h3>Dal segno al paesaggio</h3><p>Due versioni dello stesso ritratto mettono a confronto un taglio grafico ravvicinato e una composizione più aperta e atmosferica.</p></div>
            <div className="commission-case-images">{giorgegoProject.map((work) => <Link href={`/commissioni/${work.slug}`} key={work.code}><Image src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized /></Link>)}</div>
          </article>
        </div>
      </section>

      <section className="commission-process shell" aria-labelledby="commission-process-title">
        <header className="commission-section-heading"><div><p className="eyebrow">Metodo di lavoro</p><h2 id="commission-process-title">Un percorso chiaro, prima di disegnare.</h2></div></header>
        <div className="process-grid">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</div>
      </section>

      <section className="commission-fanart-note" aria-labelledby="commission-fanart-title">
        <div className="shell commission-fanart-grid">
          <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema illustrato delle commissioni GiWise Studio" width={1224} height={1285} unoptimized />
          <div>
            <p className="eyebrow">Ritratti iconici e fan art</p>
            <h2 id="commission-fanart-title">I nomi degli artisti restano visibili.</h2>
            <p>Le opere dedicate a musicisti e universi riconoscibili sono presentate con il loro vero soggetto perché documentano richieste realmente ricevute.</p>
            <p className="commission-legal-note">Fan art non ufficiali realizzate su commissione. Nomi, personaggi e marchi appartengono ai rispettivi titolari. Le immagini sono esposte soltanto come esempi del lavoro svolto e non sono disponibili per vendita, licenza o download.</p>
          </div>
        </div>
      </section>

      <section className="section commission-request" id="richiesta" aria-labelledby="commission-request-title">
        <div className="shell commission-layout">
          <div>
            <p className="eyebrow">Richiedi un’opera simile</p>
            <h2 id="commission-request-title">Partiamo dalla tua idea.</h2>
            <p>Il preventivo dipenderà da numero di soggetti, complessità, sfondo, urgenza, revisioni e utilizzo finale.</p>
            <ul className="check-list"><li>Ritratto personale o di coppia</li><li>Ritratto di bambino con consenso del tutore</li><li>Ritratto del tuo animale</li><li>Trasformazione fantasy o horror</li><li>Fan art destinata all’uso personale</li></ul>
            <aside className="commission-request-policy"><Image src="/brand/icons/commissioni-concept-v1.webp" alt="" width={1224} height={1285} unoptimized /><div><strong>Prima di inviare</strong><ul>{commissionContentRules.map((rule) => <li key={rule}>{rule}</li>)}</ul><Link href="/commissioni/condizioni">Condizioni complete</Link></div></aside>
          </div>
          {user?.email ? <CommissionRequestForm
            categories={commissionCategories}
            packages={pricingPackages}
            initialPackage={initialPackage}
            initialReference={initialReference}
            account={{
              email: user.email,
              name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
            }}
          /> : <aside className="commission-account-required">
            <p className="eyebrow">LoreWise ID richiesto</p>
            <h3>Il preventivo deve riconoscere il tuo account.</h3>
            <p>Accedi prima di inviare la richiesta: il piano Supporter o Collector verrà verificato automaticamente e lo sconto corretto sarà applicato al totale.</p>
            <Link className="button button-primary" href="/account">Accedi o crea il LoreWise ID</Link>
          </aside>}
        </div>
      </section>

      <section className="commission-faq shell" aria-labelledby="commission-faq-title">
        <header className="commission-section-heading">
          <div><p className="eyebrow">Prima di inviare</p><h2 id="commission-faq-title">Domande frequenti.</h2></div>
          <p>Le risposte principali su preventivo, revisioni, riferimenti e tutela delle immagini.</p>
        </header>
        <div>
          <details><summary>La richiesta mi obbliga ad acquistare?</summary><p>No. GiWise Studio valuta il progetto e prepara un preventivo. Il lavoro inizia soltanto dopo l’accettazione e l’acconto concordato.</p></details>
          <details><summary>Quali immagini posso allegare?</summary><p>Fino a tre fotografie o riferimenti JPG, PNG o WebP, massimo 8 MB ciascuno. Devono essere immagini che hai il diritto di condividere per questa finalità.</p></details>
          <details><summary>Quante revisioni sono incluse?</summary><p>Una nel Ritratto Essenziale, due nel Ritratto Completo e tre nell’Opera Narrativa. Le modifiche strutturali successive alla bozza approvata vengono valutate separatamente.</p></details>
          <details><summary>Posso richiedere una fan art?</summary><p>Sì, per uso personale e nel rispetto dei soggetti originali. Non vengono riprodotte o vendute copie dei lavori già realizzati per altri clienti.</p></details>
          <details><summary>Il mio ritratto verrà pubblicato?</summary><p>Solo se concedi l’autorizzazione facoltativa. Senza consenso, immagini e opera non entreranno nel portfolio pubblico.</p></details>
          <details><summary>Come vengono trattate le immagini di minori?</summary><p>La richiesta deve provenire da un genitore o tutore autorizzato. Le immagini non vengono pubblicate automaticamente e richiedono un consenso separato per il portfolio.</p></details>
        </div>
      </section>
      <UniverseGuide current="Commissioni" items={[
        { href: "/arte", label: "Arte in vetrina", description: "Confronta stili, atmosfere e opere protette." },
        { href: "/commissioni/condizioni", label: "Condizioni", description: "Tempi, revisioni, diritti e consegna spiegati prima della richiesta." },
        { href: "/contatti", label: "Parliamone", description: "Scegli il canale ufficiale adatto alla tua domanda." },
      ]} />
    </main>
  );
}
