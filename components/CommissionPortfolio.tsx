"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  commissionCategories,
  type CommissionCategory,
  type CommissionWork,
} from "@/lib/commissionCatalog";

type CategoryFilter = "Tutte" | CommissionCategory;
const initialVisible = 4;
const loadMoreCount = 4;

export function CommissionPortfolio({ works }: { works: CommissionWork[] }) {
  const [category, setCategory] = useState<CategoryFilter>("Tutte");
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const filteredWorks = useMemo(
    () => category === "Tutte" ? works : works.filter((work) => work.category === category),
    [category, works],
  );
  const visibleWorks = filteredWorks.slice(0, visibleCount);

  return (
    <section className="commission-archive shell" id="portfolio" aria-labelledby="commission-archive-title">
      <header className="commission-section-heading">
        <div>
          <p className="eyebrow">Archivio delle commissioni</p>
          <h2 id="commission-archive-title">Trentasette richieste, sei percorsi creativi.</h2>
        </div>
        <p><strong>{visibleWorks.length}</strong> di {filteredWorks.length} {filteredWorks.length === 1 ? "lavoro" : "lavori"}</p>
      </header>

      <nav className="commission-filters" aria-label="Filtra i lavori su commissione">
        {(["Tutte", ...commissionCategories] as CategoryFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={category === filter}
            onClick={() => { setCategory(filter); setVisibleCount(initialVisible); }}
          >
            {filter}
          </button>
        ))}
      </nav>

      <div className="commission-gallery">
        {visibleWorks.map((work, index) => (
          <article className={index % 7 === 0 ? "commission-card commission-card-feature" : "commission-card"} key={work.code}>
            <Link className="commission-card-image" href={`/commissioni/${work.slug}`} aria-label={`Apri la scheda di ${work.title}`}>
              <Image src={work.image} alt={`Anteprima protetta di ${work.title}`} width={1131} height={1600} sizes="(max-width: 680px) 92vw, (max-width: 1050px) 44vw, 30vw" loading="lazy" decoding="async" unoptimized />
              <span>Commissione realizzata</span>
            </Link>
            <div className="commission-card-copy">
              <small>{work.code} · {work.requestType}</small>
              <h3><Link href={`/commissioni/${work.slug}`}>{work.title}</Link></h3>
              <p>{work.category}</p>
              <Link className="commission-card-link" href={`/commissioni/${work.slug}`}>Scopri il progetto <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ))}
      </div>
      {visibleWorks.length < filteredWorks.length ? (
        <div className="commission-load-more">
          <p>Hai visto {visibleWorks.length} lavori su {filteredWorks.length}.</p>
          <button className="button button-primary" type="button" onClick={() => setVisibleCount((count) => count + loadMoreCount)}>Mostra altri lavori</button>
        </div>
      ) : null}
    </section>
  );
}
