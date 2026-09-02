import Image from "next/image";
import Link from "next/link";
import { HolidayNexusCountdown } from "@/components/HolidayNexusCountdown";
import { commissionWorks } from "@/lib/commissionCatalog";
import { holidayNexusPromotion } from "@/lib/commissionPromotion";

export type HolidayNexusCampaignPhase = "upcoming" | "active" | "ended";

function commissionWork(code: string) {
  const work = commissionWorks.find((entry) => entry.code === code);
  if (!work) throw new Error(`Commissione Feste mancante: ${code}`);
  return work;
}

const heroWorks = [commissionWork("LW-COM-001"), commissionWork("LW-COM-011"), commissionWork("LW-COM-015")];
const holidayPaths = [
  {
    number: "01",
    name: "Ritratto Essenziale",
    price: "Da 49 €",
    description: "Un volto o un animale, uno sfondo semplice e una revisione: il regalo più diretto.",
    work: commissionWork("LW-COM-013"),
  },
  {
    number: "02",
    name: "Ritratto Completo",
    price: "Da 79 €",
    description: "Figura intera o coppia semplice, atmosfera curata e due revisioni incluse.",
    work: commissionWork("LW-COM-028"),
  },
  {
    number: "03",
    name: "Opera Narrativa",
    price: "Da 119 €",
    description: "Una trasformazione fantasy o horror dentro una scena costruita come un piccolo mondo.",
    work: commissionWork("LW-COM-014"),
  },
] as const;

export function HolidayNexusCampaignExperience({ phase, preview = false }: { phase: HolidayNexusCampaignPhase; preview?: boolean }) {
  const active = phase === "active";
  const targetAt = phase === "upcoming" ? holidayNexusPromotion.startsAt : holidayNexusPromotion.endsAt;
  const previewSuffix = preview ? "&anteprima=feste" : "";
  const requestHref = `/commissioni?request=preventivo${previewSuffix}#richiesta`;

  return <main className={`holiday-nexus-page is-${phase}`}>
    <div className="holiday-nexus-light-field" aria-hidden="true">
      <span className="is-left" />
      <span className="is-right" />
    </div>
    <section className="holiday-nexus-hero" aria-labelledby="holiday-nexus-title">
      <div className="holiday-nexus-brand">
        <Image src="/brand/lorewise-universe-logo-concept-c.webp" alt="LoreWise Universe" width={1536} height={1024} priority unoptimized />
        <span>GiWise Studio · Commissioni delle Feste</span>
      </div>
      <div className="holiday-nexus-hero-grid">
        <div className="holiday-nexus-hero-copy">
          <p>1 dicembre 2026 — 1 gennaio 2027</p>
          <h1 id="holiday-nexus-title">Regala un mondo.<br />O comincia il tuo.</h1>
          <strong>{phase === "upcoming" ? "Le porte si stanno preparando." : phase === "ended" ? "La campagna è terminata." : "La promozione è attiva."}</strong>
          <p>Ritratti personali, coppie, animali e trasformazioni narrative realizzati da GiWise Studio. La richiesta è gratuita: ricevi il preventivo completo prima di decidere.</p>
          <div className="holiday-nexus-hero-actions">
            {active ? <Link href={requestHref}>Richiedi il preventivo <span aria-hidden="true">→</span></Link> : null}
            <Link href="/commissioni?view=portfolio">Guarda i lavori reali <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="holiday-nexus-gallery" aria-label="Tre commissioni reali GiWise Studio">
          {heroWorks.map((work, index) => <figure className={index === 0 ? "is-primary" : undefined} key={work.code}>
            <Image src={work.image} alt={`${work.title}, ${work.requestType} realizzato da GiWise Studio`} width={1131} height={1600} priority={index === 0} unoptimized />
            <figcaption><small>{work.code}</small><strong>{work.title}</strong></figcaption>
          </figure>)}
        </div>
      </div>
    </section>

    <Image className="holiday-nexus-garland" src="/promotions/holiday/christmas-garland-divider-v1.webp" alt="" width={2172} height={724} unoptimized />

    <section className="holiday-nexus-offer" aria-labelledby="holiday-nexus-offer-title">
      <div className="holiday-nexus-offer-heading">
        <Image src="/brand/lorewise-wax-seal-v1.webp" alt="Sigillo ufficiale LoreWise Universe" width={1536} height={1536} unoptimized />
        <div><p>Una tariffa chiara per ogni LoreWise ID</p><h2 id="holiday-nexus-offer-title">Il vantaggio cresce con il Pass.</h2></div>
      </div>
      <dl className="holiday-nexus-rates">
        <div><dt>Visitatori</dt><dd>−{holidayNexusPromotion.rates.visitor}%</dd></div>
        <div><dt>Supporter</dt><dd>−{holidayNexusPromotion.rates.supporter}%</dd></div>
        <div><dt>Collector</dt><dd>−{holidayNexusPromotion.rates.collector}%</dd></div>
      </dl>
      <div className="holiday-nexus-timer-panel">
        <div><small>{phase === "upcoming" ? "La promozione comincia tra" : "La promozione termina tra"}</small><strong>{phase === "upcoming" ? "1 dicembre 2026" : "1 gennaio 2027"}</strong></div>
        <HolidayNexusCountdown targetAt={targetAt} previewAt={preview ? "2026-12-07T12:00:00+01:00" : undefined} />
      </div>
    </section>

    <section className="holiday-nexus-paths" id="percorsi" aria-labelledby="holiday-nexus-paths-title">
      <header><p>Tre modi di entrare</p><h2 id="holiday-nexus-paths-title">Scegli quanto grande deve diventare il tuo mondo.</h2></header>
      <div>
        {holidayPaths.map((path) => <article key={path.name}>
          <figure><Image src={path.work.image} alt={`${path.work.title}, esempio reale per ${path.name}`} width={1131} height={1600} unoptimized /></figure>
          <div><small>{path.number} · {path.price}</small><h3>{path.name}</h3><p>{path.description}</p>{active ? <Link href={`/commissioni?request=preventivo&package=${encodeURIComponent(path.name)}${previewSuffix}#richiesta`}>Scegli questo percorso <span aria-hidden="true">→</span></Link> : null}</div>
        </article>)}
      </div>
    </section>

    <Image className="holiday-nexus-garland is-reversed" src="/promotions/holiday/christmas-garland-divider-v1.webp" alt="" width={2172} height={724} unoptimized />

    <section className="holiday-nexus-terms" aria-labelledby="holiday-nexus-terms-title">
      <Image src="/brand/icons/commissioni-concept-v1.webp" alt="Emblema delle commissioni GiWise Studio" width={1224} height={1285} unoptimized />
      <div><p>Prima di iniziare</p><h2 id="holiday-nexus-terms-title">La richiesta non ti obbliga all’acquisto.</h2><ul><li>La tariffa si applica al preventivo finale.</li><li>Lo sconto non è cumulabile: viene applicato il vantaggio più conveniente.</li><li>Le richieste complete inviate entro il 1° gennaio conservano la tariffa anche se il lavoro termina dopo.</li><li>Acconto, tempi, revisioni e consegna vengono confermati prima dell’inizio.</li></ul></div>
      {active ? <Link href={requestHref}>Racconta la tua idea <span aria-hidden="true">→</span></Link> : <Link href="/commissioni">Esplora le commissioni <span aria-hidden="true">→</span></Link>}
    </section>
  </main>;
}
