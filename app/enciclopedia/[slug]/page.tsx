import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CodexChapterTabs } from "@/components/CodexChapterTabs";
import { codexCanonicalSlug, codexEntries, codexEntryBySlug, type CodexFact, type CodexVerification, type SourcedValue } from "@/lib/codex";

const statusLabels: Record<CodexVerification, string> = {
  verified: "Verificato",
  partial: "Parziale",
  "to-document": "Da documentare",
  editorial: "Lettura editoriale",
};

const statusAssets: Record<CodexVerification, string> = {
  verified: "/codex/seals/status-verified-v1.webp",
  partial: "/codex/seals/status-partial-v1.webp",
  "to-document": "/codex/seals/status-to-document-v1.webp",
  editorial: "/codex/seals/status-editorial-v1.webp",
};

const dossierChapters = [["identita", "Identità"], ["appartenenza", "Appartenenza"], ["biografia", "Biografia"], ["personalita", "Personalità"], ["capacita", "Aspetto e capacità"], ["relazioni", "Relazioni"], ["produzione", "Apparizioni"], ["fonti", "Fonti"]].map(([id, title]) => ({ id, title }));

function displayImageSrc(source: string) {
  return source
    .replace(/^\/codex\/characters\//, "/codex/display/")
    .replace(/\.[^.]+$/, ".webp");
}

function conciseText(value: string, maximum = 520) {
  if (value.length <= maximum) return value;
  const candidate = value.slice(0, maximum + 1);
  const sentenceEnd = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "));
  const cut = sentenceEnd >= Math.floor(maximum * .55) ? sentenceEnd + 1 : candidate.lastIndexOf(" ");
  return `${candidate.slice(0, Math.max(cut, Math.floor(maximum * .7))).trim()}…`;
}

function SourceLocation({ location }: { location: string }) {
  if (/^https?:\/\//i.test(location)) return <a href={location} target="_blank" rel="noopener noreferrer">Apri la fonte ufficiale o editoriale ↗</a>;
  return <>{location}</>;
}

function SourceMarks({ sourceIds = [] }: { sourceIds?: string[] }) {
  if (!sourceIds.length) return null;
  return <span className="codex-source-marks" aria-label={`Fonti: ${sourceIds.join(", ")}`}>{sourceIds.map((sourceId, index) => <a href={`#source-${sourceId}`} key={sourceId}>[{index + 1}]</a>)}</span>;
}

function StatusSeal({ status }: { status: CodexVerification }) {
  return <span className={`codex-status-seal is-${status}`} title={statusLabels[status]}>
    <Image src={statusAssets[status]} alt="" width={240} height={160} sizes="160px" unoptimized />
    <span className="codex-visually-hidden">{statusLabels[status]}</span>
  </span>;
}

function ChapterHeader({ number, eyebrow, title }: { number: string; eyebrow: string; title: string }) {
  return <header className="codex-chapter-heading">
    <span><small>Capitolo</small>{number}</span>
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
    <Image className="codex-chapter-divider" src="/codex/ornaments/chapter-divider-v1.webp" alt="" width={2172} height={724} sizes="(max-width: 720px) 92vw, 760px" unoptimized />
  </header>;
}

function FactList({ facts }: { facts: CodexFact[] }) {
  const visibleFacts = facts.filter((fact) => fact.label !== "Pronuncia");
  return <dl className="codex-facts">{visibleFacts.map((fact) => <div className={`is-${fact.status}`} key={fact.label}>
    <dt>{fact.label}</dt><dd>{fact.value}<SourceMarks sourceIds={fact.sourceIds} /></dd>
  </div>)}</dl>;
}

function normalizedFactValue(value: string) {
  return value.toLocaleLowerCase("it").replace(/[\s.,;:·—–-]+/g, " ").trim();
}

function withoutRepeatedFacts(facts: CodexFact[], valuesAlreadyShown: Set<string> = new Set()) {
  const seen = new Set(valuesAlreadyShown);
  return facts.filter((fact) => {
    if (fact.label === "Pronuncia") return false;
    const value = normalizedFactValue(fact.value);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function FactGroup({ title, description, facts }: { title: string; description: string; facts: CodexFact[] }) {
  if (!facts.length) return null;
  return <section className="codex-fact-group"><header><h3>{title}</h3><p>{description}</p></header><FactList facts={facts} /></section>;
}

function VerifiedText({ data }: { data: SourcedValue }) {
  return <p>{data.value}<SourceMarks sourceIds={data.sourceIds} /></p>;
}

export function generateStaticParams() {
  return codexEntries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = codexEntryBySlug(slug);
  return { title: entry ? `${entry.displayTitle} · LoreWise Codex` : "Personaggio · LoreWise Codex" };
}

export default async function CharacterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const canonicalSlug = codexCanonicalSlug(slug);
  if (canonicalSlug !== slug) redirect(`/enciclopedia/${canonicalSlug}`);
  const entry = codexEntryBySlug(slug);
  if (!entry) notFound();
  const dossierCode = `LW-CX-${String(codexEntries.findIndex((item) => item.slug === entry.slug) + 1).padStart(4, "0")}`;
  const siblingEntries = codexEntries
    .filter((item) => item.catalog.origin === entry.catalog.origin)
    .sort((first, second) => first.displayTitle.localeCompare(second.displayTitle, "it", { sensitivity: "base" }));
  const siblingIndex = siblingEntries.findIndex((item) => item.slug === entry.slug);
  const previousEntry = siblingIndex > 0 ? siblingEntries[siblingIndex - 1] : null;
  const nextEntry = siblingIndex < siblingEntries.length - 1 ? siblingEntries[siblingIndex + 1] : null;
  const linkedRelations = entry.relationships.filter((relation, index, relations) => relation.linkedSlug
    && codexEntryBySlug(relation.linkedSlug)
    && relations.findIndex((candidate) => candidate.linkedSlug === relation.linkedSlug) === index);
  const identityOperationalLabels = /occupazione|ruolo|profilo registrato/i;
  const identityCore = withoutRepeatedFacts(entry.identity.filter((fact) => !identityOperationalLabels.test(fact.label)));
  const identityValues = new Set(identityCore.map((fact) => normalizedFactValue(fact.value)));
  const identityOperational = withoutRepeatedFacts(entry.identity.filter((fact) => identityOperationalLabels.test(fact.label)), identityValues);
  const allIdentityValues = new Set([...identityValues, ...identityOperational.map((fact) => normalizedFactValue(fact.value))]);
  const narrativeContextLabels = /universo|opera d.origine|categoria|formato|continuità|creatore|studio/i;
  const narrativeWithoutEquivalentUniverse = entry.narrative.filter((fact) => {
    if (!/^universo$/i.test(fact.label)) return true;
    const work = entry.narrative.find((candidate) => /opera d.origine/i.test(candidate.label));
    return !work || normalizedFactValue(work.value) !== normalizedFactValue(fact.value);
  });
  const narrativeContext = withoutRepeatedFacts(narrativeWithoutEquivalentUniverse.filter((fact) => narrativeContextLabels.test(fact.label)), new Set(allIdentityValues));
  const narrativeShownValues = new Set([...allIdentityValues, ...narrativeContext.map((fact) => normalizedFactValue(fact.value))]);
  const narrativeFunction = withoutRepeatedFacts(narrativeWithoutEquivalentUniverse.filter((fact) => !narrativeContextLabels.test(fact.label)), narrativeShownValues);

  return <main className="codex-character-page">
    <header className="codex-character-masthead"><div className="shell"><Link className="back-link" href="/enciclopedia">← Torna al LoreWise Codex</Link></div></header>

    <div className="shell codex-character-shell">
      <aside className="codex-character-visual">
        <div className="codex-character-image">
          <div className="codex-character-art-mat">
            <Image className="codex-character-portrait" src={displayImageSrc(entry.image.src)} alt={entry.image.alt} width={entry.image.width} height={entry.image.height} priority sizes="(max-width: 720px) 92vw, (max-width: 980px) 300px, 40vw" unoptimized />
          </div>
        </div>
        <p>{entry.image.credit}</p>
        {entry.catalog.origin === "giwise-original" && <div className="codex-character-seal" aria-label="Sigillo GiWise Original · dossier autenticato">
          <Image src="/codex/seals/giwise-original-seal-v1.webp" alt="Sigillo premium GiWise Original con il simbolo triangolare GiWise Studio" width={360} height={360} />
          <small>Dossier originale · autenticità GiWise Studio</small>
        </div>}
      </aside>

      <article className="codex-character-manuscript">
        <header className="codex-character-title">
          <p className="eyebrow">LoreWise Codex · {dossierCode}</p>
          <h1>{entry.displayTitle}</h1>
          <p>{entry.narrative[1]?.value} · {entry.narrative[4]?.value}</p>
          <div className="codex-document-state"><strong>{entry.catalog.origin === "giwise-original" ? "Originale GiWise" : "Universo documentato"}</strong><span>Aggiornato il {entry.editorial.lastReviewed}</span><StatusSeal status="verified" /></div>
          <blockquote>{conciseText(entry.summary.value)}<SourceMarks sourceIds={entry.summary.sourceIds} /></blockquote>
        </header>
      </article>
      <div className="codex-character-dossier">
        <CodexChapterTabs chapters={dossierChapters}>
        <section id="identita" className="codex-chapter"><ChapterHeader number="01" eyebrow="Identità" title={`Conosci ${entry.name}.`} /><div className="codex-chapter-reading codex-opening-chapter"><FactGroup title="Dati distintivi" description="Nomi, natura e provenienza per orientarti subito nel dossier." facts={identityCore} /><FactGroup title="Ruolo nella storia" description="La funzione del personaggio, le sue capacità e ciò che lo rende riconoscibile." facts={identityOperational} /></div></section>
        <section id="appartenenza" className="codex-chapter"><ChapterHeader number="02" eyebrow="Canone e contesto" title="Dove agisce e perché conta." /><div className="codex-chapter-reading codex-opening-chapter"><FactGroup title="Cornice dell’opera" description="Opera, formato, continuità e responsabilità creativa della versione descritta nel dossier." facts={narrativeContext} /><FactGroup title="Funzione nella storia e nel gioco" description="Informazioni specifiche sul contributo narrativo o ludico, senza duplicare identità e affiliazioni già indicate." facts={narrativeFunction} /></div></section>

        <section id="biografia" className="codex-chapter"><ChapterHeader number="03" eyebrow="Presentazione e biografia" title="Origine, viaggio e trasformazioni." />
          <div className="codex-chapter-reading"><div className="codex-spoiler-free"><strong>Sintesi senza spoiler</strong><VerifiedText data={{ ...entry.biography.spoilerFree, value: conciseText(entry.biography.spoilerFree.value, 650) }} /></div>
            <div className="codex-biography-copy">{entry.biography.paragraphs.map((paragraph) => <section key={paragraph.heading}><h3>{paragraph.heading}</h3><VerifiedText data={paragraph} /></section>)}</div>
            <details className="codex-chronology"><summary>Mostra la cronologia con spoiler</summary><ol>{entry.biography.chronology.map((event) => <li key={event.title}><span>{event.spoiler === "major" ? "Spoiler importante" : "Spoiler moderato"}</span><strong>{event.title}</strong><p>{event.description}<SourceMarks sourceIds={event.sourceIds} /></p></li>)}</ol></details>
          </div>
        </section>

        <section id="personalita" className="codex-chapter"><ChapterHeader number="04" eyebrow="Personalità" title="Carattere, valori e conflitti." /><div className="codex-chapter-reading"><VerifiedText data={entry.personality.profile} /><FactList facts={entry.personality.facts} /></div></section>

        <section id="capacita" className="codex-chapter"><ChapterHeader number="05" eyebrow="Aspetto e capacità" title="Presenza, poteri e limiti." />
          <div className="codex-chapter-reading"><VerifiedText data={entry.appearanceAndAbilities.description} /><FactList facts={entry.appearanceAndAbilities.facts} /><div className="codex-ability-columns"><div><h3>Poteri documentati</h3>{entry.appearanceAndAbilities.powers.map((power) => <article key={power.name}><strong>{power.name}</strong><VerifiedText data={power} /></article>)}</div><div><h3>Limiti e debolezze</h3>{entry.appearanceAndAbilities.limitations.map((limit) => <article key={limit.name}><strong>{limit.name}</strong><VerifiedText data={limit} /></article>)}</div></div></div>
        </section>

        <section id="relazioni" className="codex-chapter"><ChapterHeader number="06" eyebrow="Relazioni" title="Legami, eredità e antagonisti." /><div className="codex-chapter-reading">
          {linkedRelations.length > 0 && <nav className="codex-related-paths" aria-label={`Dossier collegati a ${entry.name}`}><p><small>Percorsi collegati</small><strong>Continua nell’archivio.</strong></p><div>{linkedRelations.map((relation) => <Link href={`/enciclopedia/${relation.linkedSlug}`} key={relation.linkedSlug}><span>{relation.type}</span><strong>{relation.name} →</strong></Link>)}</div></nav>}
          <div className="codex-relations">{entry.relationships.map((relation) => <article key={relation.name}><small>{relation.type}</small>{relation.linkedSlug ? <Link href={`/enciclopedia/${relation.linkedSlug}`}><strong>{relation.name} →</strong></Link> : <strong>{relation.name}</strong>}<p>{relation.description}<SourceMarks sourceIds={relation.sourceIds} /></p></article>)}</div></div></section>

        <section id="produzione" className="codex-chapter"><ChapterHeader number="07" eyebrow="Apparizioni e produzione" title={entry.catalog.origin === "giwise-original" ? "Presenza nei progetti GiWise." : "Edizioni, adattamenti e integrazione GiWise."} />
          <div className="codex-chapter-reading"><div className="codex-appearances">{entry.production.appearances.map((appearance) => <article key={appearance.title}><small>{appearance.format} · {appearance.year}</small><strong>{appearance.title}</strong><p>{appearance.role}<SourceMarks sourceIds={appearance.sourceIds} /></p></article>)}</div><FactList facts={entry.production.facts} />
            {entry.gallery && entry.gallery.length > 0 && <section className="codex-visual-record" aria-labelledby="codex-visual-record-title"><p className="eyebrow">Altre incarnazioni</p><h3 id="codex-visual-record-title">Il personaggio attraverso gli adattamenti.</h3><div>{entry.gallery.map((image) => <figure key={image.src}><Image src={displayImageSrc(image.src)} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 720px) 92vw, 420px" unoptimized /><figcaption>{image.caption}</figcaption></figure>)}</div></section>}
            {entry.catalog.origin === "giwise-original" && entry.giwiseModule && <section className="codex-giwise-module"><p className="eyebrow">Modulo GiWise Studio</p><h3>Profilo distinto dal canone narrativo.</h3><div className="codex-canon-status"><strong>Stato nel canone</strong><VerifiedText data={entry.giwiseModule.canonStatus} /></div><VerifiedText data={entry.giwiseModule.concept} /><FactList facts={entry.giwiseModule.gameplayProfile} /></section>}
          </div>
        </section>

        <section id="fonti" className="codex-chapter codex-editorial"><ChapterHeader number="08" eyebrow="Fonti" title="Approfondisci opere e riferimenti." />
          <div className="codex-chapter-reading">{entry.editorial.contentWarnings.length > 0 && <div className="codex-editorial-meta"><p><strong>Avvisi sui contenuti</strong>{entry.editorial.contentWarnings.join(" · ")}</p></div>}
            <ol className="codex-sources">{entry.editorial.sources.map((source, index) => <li id={`source-${source.id}`} key={source.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{source.title}</strong><small>{source.kind} · <SourceLocation location={source.location} /></small><p>{source.note}</p></div></li>)}</ol>
          </div>
        </section>
        </CodexChapterTabs>
        <nav className="codex-dossier-neighbors" aria-label="Dossier vicini in ordine alfabetico">
          {previousEntry ? <Link href={`/enciclopedia/${previousEntry.slug}`}><small>Precedente</small><strong>← {previousEntry.displayTitle}</strong></Link> : <span />}
          {nextEntry ? <Link href={`/enciclopedia/${nextEntry.slug}`}><small>Successivo</small><strong>{nextEntry.displayTitle} →</strong></Link> : <span />}
        </nav>
      </div>
    </div>
  </main>;
}
