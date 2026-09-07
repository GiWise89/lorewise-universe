import Image from "next/image";
import { notFound } from "next/navigation";
import { FAMILIAR_COLLECTION } from "@/lib/famiglioMarketExpansion";
import { familiarCombatMotionProfile } from "@/lib/famiglioCombatMotion";
import styles from "./page.module.css";

export const metadata = { title: "Laboratorio Famigli - locale" };

export default function FamiglioLaboratorioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main className={styles.lab}>
    <header>
      <small>Strumento interno locale</small>
      <h1>Laboratorio sprite dei Famigli</h1>
      <p>Controllo rapido di identita, scala, trasparenza e famiglia di movimento. Questa pagina non viene resa disponibile in produzione.</p>
    </header>
    <section className={styles.summary} aria-label="Riepilogo">
      <strong>{FAMILIAR_COLLECTION.length} Famigli</strong>
      <span>3 eta</span>
      <span>23 sequenze per eta</span>
      <span>20 NPC campagna</span>
    </section>
    <section className={styles.grid} aria-label="Catalogo tecnico dei Famigli">
      {FAMILIAR_COLLECTION.map((familiar) => {
        const profile = familiarCombatMotionProfile(familiar.id);
        return <article key={familiar.id}>
          <div className={styles.preview}>
            <Image
              src={`/famiglio/rebuild/collection/${familiar.id}/growth/cucciolo/battle-v2/idle.png`}
              alt={`Sequenza idle di ${familiar.name}`}
              width={640}
              height={128}
              unoptimized
            />
          </div>
          <h2>{familiar.name}</h2>
          <dl>
            <div><dt>ID</dt><dd>{familiar.id}</dd></div>
            <div><dt>Movimento</dt><dd>{profile.archetype}</dd></div>
            <div><dt>Idle</dt><dd>{profile.idleFrameMs} ms</dd></div>
            <div><dt>Azione</dt><dd>{profile.actionFrameMs} ms</dd></div>
          </dl>
        </article>;
      })}
    </section>
  </main>;
}

