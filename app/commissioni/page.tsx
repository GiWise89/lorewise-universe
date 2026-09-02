import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommissionPortfolio } from "@/components/CommissionPortfolio";
import { CommissionRequestForm } from "@/components/CommissionRequestForm";
import { CommissionAvailability } from "@/components/CommissionAvailability";
import { HashTargetFocus } from "@/components/HashTargetFocus";
import { HalloweenCountdown } from "@/components/HalloweenCountdown";
import { UniverseGuide } from "@/components/UniverseGuide";
import { commissionContentRules } from "@/lib/commissionTerms";
import { CORRUPTED_PORTRAIT_PACKAGE, corruptedPortraitPromotion, getActiveCommissionPromotion, holidayNexusPromotion, type CommissionPromotion } from "@/lib/commissionPromotion";
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
  description: "Scopri 38 lavori realizzati su commissione da GiWise Studio: ritratti, coppie, animali, trasformazioni fantasy e fan art protette.",
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

const corruptedPortraitPackage = {
  name: CORRUPTED_PORTRAIT_PACKAGE,
  price: "Sconto 15–25%",
  image: commissionWorks[5].image,
  alt: "Esempio protetto di ritratto personale reinterpretato in versione horror",
  description: "Il tuo volto resta riconoscibile e viene trasformato in una presenza horror costruita su atmosfera, palette e dettagli concordati.",
  timing: "Tempi definiti nel preventivo",
  idealFor: "Un ritratto personale horror per uso personale.",
  includes: ["Stesse regole delle commissioni", "Riferimenti fotografici protetti", "Revisioni definite nel preventivo", "JPG e PNG finali"],
} as const;

const corruptedPortraitExamples = [6, 7, 12, 23, 25]
  .map((number) => commissionWorks[number - 1])
  .filter((work): work is NonNullable<typeof work> => Boolean(work));

function CorruptedPortraitGallery() {
  return <section className="corrupted-portrait-gallery" aria-labelledby="corrupted-portrait-gallery-title">
    <header>
      <div><p className="eyebrow">Esempi di trasformazione</p><h2 id="corrupted-portrait-gallery-title">Cinque volti. Cinque modi di corrompersi.</h2></div>
      <div className="corrupted-gallery-side">
        <div aria-hidden="true"><HalloweenSticker className="is-bat-gallery-high" src="/decorations/halloween/bat-amber-high-optimized-v1.webp" width={1536} height={1024} /><HalloweenSticker className="is-bat-gallery-low" src="/decorations/halloween/bat-burgundy-middle-optimized-v1.webp" width={1536} height={1024} /></div>
        <p>Questi lavori mostrano linguaggi horror già realizzati. Ogni nuova commissione viene costruita sul volto e sulle indicazioni del cliente, senza copiare una trasformazione esistente.</p>
      </div>
    </header>
    <div className="corrupted-portrait-collage">
      {corruptedPortraitExamples.map((work, index) => <figure className={index === 0 ? "is-featured" : ""} key={work.code}>
        <Image src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized />
        <figcaption><small>{work.code}{work.fanArt ? " · Fan art" : ""}</small><strong>{work.title}</strong><span>{work.requestType}</span></figcaption>
      </figure>)}
    </div>
  </section>;
}

function HalloweenSticker({ className, src, width, height }: { className: string; src: string; width: number; height: number }) {
  return <span className={`corrupted-halloween-sticker ${className}`}>
    <Image src={src} alt="" width={width} height={height} unoptimized />
  </span>;
}

function CorruptedPromoRails({ promotion }: { promotion: CommissionPromotion }) {
  const primary = ["10 posti soltanto", `Visitatori -${promotion.rates.visitor}%`, `Supporter -${promotion.rates.supporter}%`, `Collector -${promotion.rates.collector}%`, "26 ottobre - 1 novembre"];
  const secondary = ["Il tuo volto", "La tua atmosfera", "Il tuo lato oscuro", "Preventivo prima del pagamento", "JPG e PNG finali"];
  return <aside className="corrupted-promo-rails" aria-label={`${promotion.label}: fino al ${promotion.rates.collector}% di sconto`}>
    <div className="corrupted-promo-rail"><div aria-hidden="true">{[...primary, ...primary].map((entry, index) => <span key={`${entry}-${index}`}>{entry}<i>✦</i></span>)}</div></div>
    <div className="corrupted-promo-rail is-reverse"><div aria-hidden="true">{[...secondary, ...secondary].map((entry, index) => <span key={`${entry}-${index}`}>{entry}<i>◆</i></span>)}</div></div>
  </aside>;
}

function CorruptedAtmosphere() {
  return <div className="corrupted-atmosphere" aria-hidden="true">
    <HalloweenSticker className="is-vines-canopy" src="/decorations/halloween/pumpkin-vines-top-optimized-v1.webp" width={1536} height={1024} />
    <HalloweenSticker className="is-web-canopy" src="/decorations/halloween/web-gold-top-optimized-v1.webp" width={1240} height={1269} />
    <HalloweenSticker className="is-moon-floating" src="/decorations/halloween/moon-amber-mist-optimized-v1.webp" width={1219} height={1290} />
    <HalloweenSticker className="is-pumpkin-floating" src="/decorations/halloween/pumpkin-smile-low-optimized-v1.webp" width={1254} height={1254} />
    <HalloweenSticker className="is-bat-floating-high" src="/decorations/halloween/bat-amber-high-optimized-v1.webp" width={1536} height={1024} />
    <HalloweenSticker className="is-bat-floating-low" src="/decorations/halloween/bat-burgundy-middle-optimized-v1.webp" width={1536} height={1024} />
    <span className="corrupted-mist is-one" />
    <span className="corrupted-mist is-two" />
  </div>;
}

function CorruptedJourney() {
  return <section className="corrupted-journey" aria-labelledby="corrupted-journey-title">
    <div className="corrupted-journey-ornament is-left" aria-hidden="true"><HalloweenSticker className="is-candy-journey" src="/decorations/halloween/candy-cane-bow-optimized-v1.webp" width={1024} height={1536} /></div>
    <header><small>Dal riferimento all’incubo</small><h2 id="corrupted-journey-title">La trasformazione ha un rituale.</h2></header>
    <ol>
      <li><span>01</span><strong>Il volto</strong><p>Invii fotografie nitide e indichi i tratti che devono restare riconoscibili.</p></li>
      <li><span>02</span><strong>La corruzione</strong><p>Scegliamo atmosfera, colori e intensità horror senza copiare lavori esistenti.</p></li>
      <li><span>03</span><strong>Il ritratto</strong><p>Ricevi il preventivo completo; il lavoro parte solo dopo la tua conferma.</p></li>
    </ol>
    <div className="corrupted-journey-ornament is-right" aria-hidden="true"><HalloweenSticker className="is-candy-journey-low" src="/decorations/halloween/wrapped-candy-low-optimized-v1.webp" width={1536} height={1024} /></div>
  </section>;
}

function CorruptedPromotionDetails({ promotion, requestHref }: { promotion: CommissionPromotion; requestHref: string }) {
  return <section className="corrupted-promotion-details" id={promotion.focusId} tabIndex={-1} aria-labelledby="corrupted-promotion-details-title">
    <div className="corrupted-details-ornaments" aria-hidden="true">
      <HalloweenSticker className="is-moon-details" src="/decorations/halloween/moon-amber-mist-optimized-v1.webp" width={1219} height={1290} />
      <span>Halloween portrait week · GiWise Studio</span>
      <HalloweenSticker className="is-pumpkin-details" src="/decorations/halloween/pumpkin-smile-low-optimized-v1.webp" width={1254} height={1254} />
      <HalloweenSticker className="is-web-details" src="/decorations/halloween/web-gold-low-optimized-v1.webp" width={1240} height={1269} />
    </div>
    <div className="corrupted-promotion-heading">
      <small>Settimana di Halloween · {promotion.period}</small>
      <h2 id="corrupted-promotion-details-title">La tua faccia.<br />Il tuo incubo.</h2>
      <p>Invia i riferimenti del volto e racconta quale lato oscuro vuoi vedere. Riceverai un preventivo completo prima dell’inizio: nessun pagamento parte con il semplice invio della richiesta.</p>
    </div>
    <dl className="corrupted-promotion-rates" aria-label="Sconti La mia versione corrotta">
      <div><dt>Visitatori</dt><dd>−{promotion.rates.visitor}%</dd></div>
      <div><dt>Supporter</dt><dd>−{promotion.rates.supporter}%</dd></div>
      <div><dt>Collector</dt><dd>−{promotion.rates.collector}%</dd></div>
    </dl>
    <div className="corrupted-promotion-terms">
      <section><h3>Cosa include</h3><ul><li>Ritratto horror personalizzato sul tuo volto</li><li>Atmosfera, palette e trasformazione concordate</li><li>Revisioni indicate nel preventivo</li><li>File finali JPG e PNG</li></ul></section>
      <section><h3>Regole essenziali</h3><ul><li>Stesse condizioni delle commissioni GiWise Studio</li><li>Sconto non cumulabile applicato al preventivo finale</li><li>Acconto del 50% soltanto dopo l’accettazione</li><li>Horror, gore e splatter moderati e non espliciti</li></ul></section>
    </div>
    <footer><div><small>Scadenza</small><strong>1° novembre 2026 · ore 23:59</strong></div><Link href={requestHref}>Crea la mia versione corrotta <span aria-hidden="true">→</span></Link></footer>
  </section>;
}

function CommissionPricingCards({ promotion, packages = pricingPackages, previewQuery = "" }: { promotion: CommissionPromotion | null; packages?: readonly (typeof pricingPackages[number] | typeof corruptedPortraitPackage)[]; previewQuery?: string }) {
  return <div className="commission-price-grid">
    {packages.map((item) => (
      <article key={item.name}>
        <Image src={item.image} alt={item.alt} width={1131} height={1600} unoptimized />
        <div>
          {promotion ? <span className="commission-card-promo">Fino al {promotion.rates.collector}% di sconto sul preventivo</span> : null}
          <small>A partire da</small>
          <strong>{item.price}</strong>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <em>{item.idealFor}</em>
          <ul>{item.includes.map((entry) => <li key={entry}>{entry}</li>)}</ul>
          <span>{item.timing}</span>
          <Link href={`/commissioni?request=preventivo&package=${encodeURIComponent(item.name)}${previewQuery ? `&anteprima=${encodeURIComponent(previewQuery)}` : ""}#richiesta`}>Scegli questo percorso →</Link>
        </div>
      </article>
    ))}
  </div>;
}

function CommissionPromotionBanner({ promotion }: { promotion: CommissionPromotion }) {
  return <aside className="commission-promotion-banner" id={promotion.focusId} data-anchor-focus="true" tabIndex={-1} aria-label={`${promotion.label} attiva`}>
    <div>
      <small>{promotion.shortLabel}</small>
      <strong>{promotion.title}</strong>
      <p>{promotion.deadlineLabel}. {promotion.description}</p>
    </div>
    <dl>
      <div><dt>Visitatori</dt><dd>−{promotion.rates.visitor}%</dd></div>
      <div><dt>Supporter</dt><dd>−{promotion.rates.supporter}%</dd></div>
      <div><dt>Collector</dt><dd>−{promotion.rates.collector}%</dd></div>
    </dl>
  </aside>;
}

function CommissionPromotionFocus({ promotion, previewQuery = "" }: { promotion: CommissionPromotion; previewQuery?: string }) {
  const promotionPackages = promotion.eligiblePackage ? [corruptedPortraitPackage] : pricingPackages;
  const previewSuffix = previewQuery ? `&anteprima=${encodeURIComponent(previewQuery)}` : "";
  const requestHref = promotion.eligiblePackage
    ? `/commissioni?request=preventivo&package=${encodeURIComponent(promotion.eligiblePackage)}${previewSuffix}#richiesta`
    : `/commissioni?request=preventivo${previewSuffix}#richiesta`;
  const isCorruptedPortrait = Boolean(promotion.eligiblePackage);
  return <main className={`commission-page commission-promotion-focus-page${isCorruptedPortrait ? " is-corrupted-portrait" : ""}`}>
    {isCorruptedPortrait ? <CorruptedPromoRails promotion={promotion} /> : null}
    <section className="commission-pricing" aria-labelledby="commission-promotion-focus-title">
      {isCorruptedPortrait ? <CorruptedAtmosphere /> : null}
      <div className="shell">
        <Link className="commission-promotion-focus-back" href="/">← Torna a LoreWise Universe</Link>
        {isCorruptedPortrait ? <div className="corrupted-focus-hero">
          <header className="commission-section-heading commission-promotion-focus-heading">
            <div><p className="eyebrow">Promozione commissioni · {promotion.period}</p><h1 id="commission-promotion-focus-title">{promotion.label}.</h1></div>
            <p>{promotion.description}</p>
            <div className="corrupted-hero-offer">
              <span>Edizione Halloween 2026</span>
              <strong>Fino al {promotion.rates.collector}% di sconto</strong>
              <small>Solo 10 ritratti disponibili</small>
              <Link href={requestHref}>Prenota il tuo incubo <i aria-hidden="true">→</i></Link>
            </div>
          </header>
          <HalloweenCountdown />
        </div> : <header className="commission-section-heading commission-promotion-focus-heading">
          <div><p className="eyebrow">Promozione commissioni · {promotion.period}</p><h1 id="commission-promotion-focus-title">{promotion.label}.</h1></div>
          <p>{promotion.description}</p>
        </header>}
        <div className={isCorruptedPortrait ? "corrupted-availability-stage" : undefined}><CommissionAvailability /></div>
        {isCorruptedPortrait ? <>
          <CorruptedJourney />
          <CorruptedPortraitGallery />
          <CorruptedPromotionDetails promotion={promotion} requestHref={requestHref} />
        </> : <>
          <CommissionPromotionBanner promotion={promotion} />
          <CommissionPricingCards promotion={promotion} packages={promotionPackages} previewQuery={previewQuery} />
        </>}
        <nav className="commission-promotion-focus-actions" aria-label="Continua nelle Commissioni">
          <Link href={requestHref}>Richiedi il ritratto <span aria-hidden="true">→</span></Link>
          <Link href="/commissioni">Apri il portfolio completo <span aria-hidden="true">→</span></Link>
        </nav>
      </div>
    </section>
  </main>;
}

type CommissionUser = Awaited<ReturnType<typeof getLoreWiseUser>>;

type CommissionChapter = "panoramica" | "prezzi" | "portfolio" | "metodo";

const commissionChapters = [
  {
    id: "panoramica",
    number: "01",
    eyebrow: "Ingresso allo studio",
    title: "In primo piano",
    description: "Una selezione di linguaggi, soggetti e atmosfere gi\u00e0 realizzati.",
  },
  {
    id: "prezzi",
    number: "02",
    eyebrow: "Percorsi e disponibilit\u00e0",
    title: "Scegli il formato",
    description: "Tre punti di partenza, supplementi e condizioni prima della bozza.",
  },
  {
    id: "portfolio",
    number: "03",
    eyebrow: "Archivio protetto",
    title: "Esplora i 38 lavori",
    description: "Filtri, serie e dossier individuali senza trasformare la pagina in un catalogo infinito.",
  },
  {
    id: "metodo",
    number: "04",
    eyebrow: "Dietro la commissione",
    title: "Metodo e tutela",
    description: "Passaggi, revisioni, riferimenti, fan art e risposte alle domande principali.",
  },
] as const satisfies readonly {
  id: CommissionChapter;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}[];

const commissionChapterIcons: Record<CommissionChapter, string> = {
  panoramica: "/brand/icons/commissioni-panoramica-v2.webp",
  prezzi: "/brand/icons/commissioni-prezzi-v2.webp",
  portfolio: "/brand/icons/commissioni-portfolio-v2.webp",
  metodo: "/brand/icons/commissioni-metodo-v2.webp",
};

function CommissionChapterIcon({ chapter }: { chapter: CommissionChapter }) {
  return <Image className="commission-chapter-icon" src={commissionChapterIcons[chapter]} alt="" width={512} height={512} unoptimized />;
}

function CommissionChapterNavigation({ active }: { active: CommissionChapter }) {
  return <section className="commission-chapter-navigation" id="commission-chapters" aria-labelledby="commission-chapters-title">
    <div className="shell">
      <header>
        <div><p className="eyebrow">Quattro ambienti, una sola esperienza</p><h2 id="commission-chapters-title">Entra dove nasce la tua commissione.</h2></div>
        <p>{"Ogni ambiente conserva il linguaggio visivo dello studio e mostra soltanto ci\u00f2 che serve in quel momento."}</p>
      </header>
      <nav aria-label="Esplora la sezione Commissioni">
        {commissionChapters.map((chapter) => {
          const href = chapter.id === "panoramica" ? "/commissioni#commission-chapters" : `/commissioni?view=${chapter.id}#commission-chapters`;
          return <Link href={href} scroll={false} data-chapter={chapter.id} aria-current={active === chapter.id ? "page" : undefined} key={chapter.id}>
            <CommissionChapterIcon chapter={chapter.id} />
            <span className="commission-chapter-number">{chapter.number}</span>
            <span className="commission-chapter-copy"><small>{chapter.eyebrow}</small><strong>{chapter.title}</strong><em>{chapter.description}</em></span>
            <span className="commission-chapter-state">{active === chapter.id ? "Stai visitando" : "Entra nella sala"}</span>
            <b aria-hidden="true">{"\u2192"}</b>
          </Link>;
        })}
      </nav>
      <footer>
        <Link className="button button-primary" href="/commissioni?request=preventivo#richiesta">Raccontami la tua idea</Link>
        <Link href="/commissioni/stato">{"Hai gi\u00e0 inviato una richiesta? Seguila qui \u2192"}</Link>
      </footer>
    </div>
  </section>;
}

function CommissionChapterMasthead({ chapter }: { chapter: Exclude<CommissionChapter, "panoramica"> }) {
  const selected = commissionChapters.find((item) => item.id === chapter)!;
  return <section className={`commission-chapter-masthead is-${chapter}`} aria-labelledby="commission-chapter-title">
    <div className="shell">
      <div>
        <Link href="/commissioni">{"\u2190 Torna alla panoramica"}</Link>
        <p className="eyebrow">{"Commissioni \u00b7 Capitolo "}{selected.number}</p>
        <h1 id="commission-chapter-title">{selected.title}.</h1>
        <p>{selected.description}</p>
      </div>
      <div className="commission-chapter-masthead-emblem"><CommissionChapterIcon chapter={chapter} /></div>
    </div>
  </section>;
}

function CommissionRequestSection({ user, promotion, initialPackage, initialReference }: { user: CommissionUser; promotion: CommissionPromotion | null; initialPackage: string; initialReference: string }) {
  return <section className="section commission-request" id="richiesta" tabIndex={-1} aria-labelledby="commission-request-title">
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
        packages={promotion?.eligiblePackage ? [...pricingPackages, corruptedPortraitPackage] : pricingPackages}
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
  </section>;
}

function CommissionRequestFocus({ user, promotion, initialPackage, initialReference, previewQuery = "" }: { user: CommissionUser; promotion: CommissionPromotion | null; initialPackage: string; initialReference: string; previewQuery?: string }) {
  const isCorruptedPortrait = initialPackage === CORRUPTED_PORTRAIT_PACKAGE;
  const backHref = promotion
    ? `/commissioni?focus=${encodeURIComponent(promotion.focusId)}${previewQuery ? `&anteprima=${encodeURIComponent(previewQuery)}` : ""}`
    : "/commissioni";
  return <main className={`commission-page commission-request-focus-page${isCorruptedPortrait ? " is-corrupted-request" : ""}${promotion ? " has-promotion-summary" : ""}`}>
    <HashTargetFocus targetId="richiesta" active />
    <header className="commission-request-focus-intro">
      <div className="shell">
        <Link href={backHref}>← Torna {isCorruptedPortrait ? "alla promozione" : "alle commissioni"}</Link>
        <p className="eyebrow">Preventivo senza impegno</p>
        <h1>{isCorruptedPortrait ? "Crea la mia versione corrotta." : "Racconta la tua idea."}</h1>
        <p>{isCorruptedPortrait ? "Il percorso horror è già selezionato. Compila i dati, descrivi la trasformazione e allega i riferimenti del volto." : "Compila il modulo per ricevere una valutazione completa prima dell’inizio del lavoro."}</p>
      </div>
    </header>
    {promotion ? <div className="shell commission-request-promotion-summary"><CommissionPromotionBanner promotion={promotion} /></div> : null}
    <CommissionRequestSection user={user} promotion={promotion} initialPackage={initialPackage} initialReference={initialReference} />
  </main>;
}

export default async function CommissionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const initialPackage = typeof query?.package === "string" ? query.package : "";
  const initialReference = typeof query?.reference === "string" ? query.reference : "";
  const requestedChapter = typeof query?.view === "string" ? query.view : "panoramica";
  const activeChapter: CommissionChapter = commissionChapters.some((chapter) => chapter.id === requestedChapter)
    ? requestedChapter as CommissionChapter
    : "panoramica";
  const localHolidayPreview = query?.anteprima === "feste"
    && (process.env.NODE_ENV !== "production" || process.env.LOREWISE_LOCAL_CALENDAR_PREVIEW === "true");
  const promotion = localHolidayPreview
    ? holidayNexusPromotion
    : process.env.LOREWISE_LOCAL_HALLOWEEN_PREVIEW === "true"
      ? corruptedPortraitPromotion
      : getActiveCommissionPromotion();
  const promotionFocusId = promotion?.focusId ?? "";
  const focusPromotion = Boolean(promotion) && query?.focus === promotionFocusId;
  const previewQuery = localHolidayPreview ? "feste" : "";
  if (focusPromotion && promotion) return <CommissionPromotionFocus promotion={promotion} previewQuery={previewQuery} />;
  const user = await getLoreWiseUser();
  const requestFocus = query?.request === "preventivo";
  if (requestFocus) return <CommissionRequestFocus user={user} promotion={promotion} initialPackage={initialPackage} initialReference={initialReference} previewQuery={previewQuery} />;
  return (
    <main className={`commission-page commission-hub-page is-${activeChapter}`}>
      {promotion ? <HashTargetFocus targetId={promotionFocusId} active={focusPromotion} /> : null}
      {activeChapter === "panoramica" ? <section className="commission-hero" aria-labelledby="commission-title">
        <div className="shell commission-hero-grid">
          <div className="commission-hero-copy">
            <p className="eyebrow">GiWise Studio · Ritratti su richiesta</p>
            <h1 id="commission-title">
              <span>La tua storia,</span>
              <span>in un’immagine.</span>
            </h1>
            <p>Ritratti personali, coppie, animali e trasformazioni fantasy costruiti attorno al soggetto. Qui non trovi prodotti da rivendere: trovi lavori realmente eseguiti su commissione.</p>
            <div className="button-row">
              <Link className="button button-primary" href="/commissioni?request=preventivo#richiesta">Raccontami la tua idea</Link>
              <Link className="button button-ghost" href="/commissioni?view=portfolio#commission-chapters">Esplora i 38 lavori</Link>
              <Link className="button button-ghost" href="/commissioni/stato">Segui una richiesta</Link>
            </div>
          </div>
          <div className="commission-hero-art" aria-label="Selezione di ritratti protetti realizzati su commissione">
            {featuredCommissionWorks.slice(0, 3).map((work) => (
              <Image key={work.code} src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} unoptimized priority />
            ))}
          </div>
        </div>
      </section> : <CommissionChapterMasthead chapter={activeChapter} />}

      <CommissionChapterNavigation active={activeChapter} />

      {activeChapter === "panoramica" ? <section className="commission-featured shell" aria-labelledby="commission-featured-title">
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
      </section> : null}

      {activeChapter === "prezzi" ? <section className="commission-pricing" id="listino" aria-labelledby="commission-pricing-title">
        <div className="shell">
          <header className="commission-section-heading">
            <div><p className="eyebrow">Tariffe di lancio 2026</p><h2 id="commission-pricing-title">Un prezzo speciale per iniziare insieme.</h2></div>
            <p>I prezzi sono di partenza: il preventivo definitivo viene confermato prima di iniziare e dipende dalla complessità reale della richiesta.</p>
          </header>
          <CommissionAvailability />
          {promotion ? <CommissionPromotionBanner promotion={promotion} /> : null}
          <CommissionPricingCards promotion={promotion} />

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
      </section> : null}

      {activeChapter === "portfolio" ? <CommissionPortfolio works={commissionWorks} /> : null}

      {activeChapter === "portfolio" ? <section className="commission-case-studies" aria-labelledby="case-studies-title">
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
      </section> : null}

      {activeChapter === "metodo" ? <section className="commission-process shell" aria-labelledby="commission-process-title">
        <header className="commission-section-heading"><div><p className="eyebrow">Metodo di lavoro</p><h2 id="commission-process-title">Un percorso chiaro, prima di disegnare.</h2></div></header>
        <div className="process-grid">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</div>
      </section> : null}

      {activeChapter === "metodo" ? <section className="commission-fanart-note" aria-labelledby="commission-fanart-title">
        <div className="shell commission-fanart-grid">
          <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema illustrato delle commissioni GiWise Studio" width={1224} height={1285} unoptimized />
          <div>
            <p className="eyebrow">Ritratti iconici e fan art</p>
            <h2 id="commission-fanart-title">I nomi degli artisti restano visibili.</h2>
            <p>Le opere dedicate a musicisti e universi riconoscibili sono presentate con il loro vero soggetto perché documentano richieste realmente ricevute.</p>
            <p className="commission-legal-note">Fan art non ufficiali realizzate su commissione. Nomi, personaggi e marchi appartengono ai rispettivi titolari. Le immagini sono esposte soltanto come esempi del lavoro svolto e non sono disponibili per vendita, licenza o download.</p>
          </div>
        </div>
      </section> : null}

      {activeChapter === "metodo" ? <section className="commission-faq shell" aria-labelledby="commission-faq-title">
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
      </section> : null}
      <UniverseGuide current="Commissioni" items={[
        { href: "/arte", label: "Arte in vetrina", description: "Confronta stili, atmosfere e opere protette." },
        { href: "/commissioni/condizioni", label: "Condizioni", description: "Tempi, revisioni, diritti e consegna spiegati prima della richiesta." },
        { href: "/contatti", label: "Parliamone", description: "Scegli il canale ufficiale adatto alla tua domanda." },
      ]} />
    </main>
  );
}
