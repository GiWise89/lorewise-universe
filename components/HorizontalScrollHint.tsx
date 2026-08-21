export function HorizontalScrollHint({ className = "" }: { className?: string }) {
  return (
    <p className={`horizontal-scroll-hint ${className}`.trim()} role="note">
      <span aria-hidden="true">&larr;</span>
      <strong>Scorri per vedere tutto</strong>
      <span aria-hidden="true">&rarr;</span>
    </p>
  );
}
