import Link from "next/link";

export default function NotFound() {
  return <main className="system-state-page system-state-not-found">
    <p className="eyebrow">Archivio 404</p>
    <h1>Questa storia non è ancora stata scritta.</h1>
    <p>Il collegamento potrebbe essere cambiato oppure il contenuto non è ancora pubblico.</p>
    <div><Link href="/cerca">Cerca nell’universo</Link><Link href="/">Torna alla home</Link></div>
  </main>;
}
