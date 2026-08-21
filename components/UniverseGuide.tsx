import Link from "next/link";

export type UniverseGuideItem = {
  href: string;
  label: string;
  description: string;
};

export function UniverseGuide({
  current,
  title = "Continua il tuo percorso.",
  items,
}: {
  current: string;
  title?: string;
  items: UniverseGuideItem[];
}) {
  const guideId = `universe-guide-${current.toLocaleLowerCase("it").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return (
    <aside className="universe-guide" aria-labelledby={guideId}>
      <div className="shell universe-guide-inner">
        <header>
          <p className="eyebrow">Sei in · {current}</p>
          <h2 id={guideId}>{title}</h2>
        </header>
        <nav aria-label={`Percorsi collegati a ${current}`}>
          {items.map((item, index) => (
            <Link href={item.href} key={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
              <i aria-hidden="true">→</i>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
