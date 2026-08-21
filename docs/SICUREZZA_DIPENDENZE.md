# Stato sicurezza delle dipendenze

Verifica del 19 agosto 2026:

- dipendenze distribuite nel prodotto: 0 vulnerabilità note da `npm audit --omit=dev`;
- strumenti di sviluppo: 6 segnalazioni residue, 4 moderate e 2 alte;
- le segnalazioni residue arrivano da `drizzle-kit` tramite una vecchia catena `esbuild` e da `vinext` tramite `image-size`;
- npm propone soltanto un downgrade incompatibile di Drizzle Kit oppure il passaggio a una beta principale di Vinext.

Non è stato eseguito `npm audit fix --force`: forzare questi cambiamenti renderebbe il progetto meno affidabile e richiederebbe una migrazione separata. Prima della pubblicazione si deve ripetere l'audit e aggiornare soltanto quando esiste una versione stabile e compatibile.

Aggiornamenti compatibili già applicati e collaudati: React 19.2.8, React DOM 19.2.8, React Server DOM Webpack 19.2.8, Vite 8.2.1, plugin Cloudflare 1.53.0 e Wrangler 4.113.0.
