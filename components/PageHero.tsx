export function PageHero({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: string }) {
  return <section className="page-hero"><div className="shell page-hero-grid"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{aside ? <p className="page-hero-aside">{aside}</p> : null}</div></section>;
}
