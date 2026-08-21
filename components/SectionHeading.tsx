type Props = { eyebrow: string; title: string; description?: string; id?: string; inverse?: boolean };
export function SectionHeading({ eyebrow, title, description, id, inverse }: Props) {
  return <div className={`section-heading${inverse ? " section-heading-inverse" : ""}`}><p className="eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2>{description ? <p>{description}</p> : null}</div>;
}
