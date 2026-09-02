"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { HorizontalScrollHint } from "@/components/HorizontalScrollHint";
import type { CreativeGameJournalEntry } from "@/lib/creativeJournal";

export function GameJournalShowcase({ games }: { games: CreativeGameJournalEntry[] }) {
  const [activeId, setActiveId] = useState(games[0]?.id ?? "");
  const instanceId = useId().replaceAll(":", "");
  const game = games.find((item) => item.id === activeId) ?? games[0];
  if (!game) return null;

  return (
    <div className="diary-game-showcase">
      <div className="diary-game-switch" role="tablist" aria-label="Scegli il gioco da approfondire">
        {games.map((item, index) => (
          <button
            key={item.id}
            id={`game-tab-${instanceId}-${item.id}`}
            type="button"
            role="tab"
            aria-selected={item.id === game.id}
            aria-controls={`game-panel-${instanceId}-${item.id}`}
            tabIndex={item.id === game.id ? 0 : -1}
            onClick={() => setActiveId(item.id)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
              const currentIndex = tabs.indexOf(event.currentTarget);
              const nextIndex = event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
              tabs[nextIndex]?.focus();
              if (games[nextIndex]) setActiveId(games[nextIndex].id);
            }}
          >
            <span>0{index + 1}</span><strong>{item.title}</strong><small>{item.status}</small>
          </button>
        ))}
      </div>

      <article id={`game-panel-${instanceId}-${game.id}`} role="tabpanel" aria-labelledby={`game-tab-${instanceId}-${game.id}`} className={`diary-game-dossier diary-game-dossier-${game.id}`} key={game.id}>
        <header>
          <div><p className="diary-hand">{game.label}</p><h3>{game.title}</h3><p>{game.summary}</p></div>
          <aside><span>Dietro questa schermata</span><strong>Mesi di progettazione, disegno, codice e prove.</strong></aside>
        </header>

        <div className="diary-game-gallery-inline">
          {game.gallery.slice(0, 4).map((image, index) => (
            <figure key={image.src} className={index === 0 ? "diary-game-shot-main" : ""}>
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={index === 0 ? "(max-width: 900px) 96vw, 60vw" : "(max-width: 900px) 47vw, 20vw"} unoptimized />
              <figcaption>{image.alt}</figcaption>
            </figure>
          ))}
        </div>

        <div className="diary-game-work-grid">
          <section><span className="diary-game-block-number">01</span><h4>Personaggi e stile</h4><p>Un personaggio non è soltanto un’immagine: deve avere un ruolo, essere riconoscibile durante il gioco e restare coerente con interfaccia, ambientazione ed effetti.</p><ul>{game.creativeFocus.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><span className="diary-game-block-number">02</span><h4>Programmazione e prove</h4><p>Ogni scelta visiva deve poi funzionare nel codice. Regole, ricompense, statistiche e animazioni vengono provate e corrette molte volte.</p><ul>{game.currentWork.map((item) => <li key={item}>{item}</li>)}</ul></section>
        </div>

        <figure className="diary-code-photo">
          <figcaption><span><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /></span><strong>{game.code.title}</strong><small>{game.code.file}</small></figcaption>
          <HorizontalScrollHint className="code-scroll-hint" />
          <pre><code>{game.code.snippet}</code></pre>
          <p>Una piccola parte del codice reale scritto per {game.title}.</p>
        </figure>

        <footer>
          <Link href={`/dove-nascono-i-mondi/giochi/${game.id}`}>Apri tutte le schermate e il codice <span aria-hidden="true">→</span></Link>
          <Link href={game.href}>Vai alla scheda del gioco <span aria-hidden="true">→</span></Link>
        </footer>
      </article>
    </div>
  );
}
