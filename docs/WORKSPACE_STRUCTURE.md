# Struttura del workspace LoreWise

Questo repository contiene il portale web ufficiale LoreWise Universe. Le altre applicazioni presenti nella cartella di lavoro sono progetti collegati, ma non devono confondersi con il deploy del sito.

## Sorgente ufficiale del portale

- `app/`: pagine, layout e API Next.js.
- `components/`: interfacce condivise e componenti interattivi.
- `lib/`, `data/`, `db/`, `drizzle/`: dominio, cataloghi e persistenza.
- `public/`: esclusivamente risorse pubblicabili, ottimizzate o protette.
- `scripts/`, `tests/`, `docs/`: automazione, verifiche e documentazione operativa.

## Progetti collegati

- `famiglio-nexus-android/`: applicazione nativa canonica del Famiglio.
- `famiglio-nexus-webview-android/`: compatibilita WebView conservata come progetto separato, non canonico.
- `lorewise-universe-android-fresh/`: involucro Android del portale LoreWise, con proprio ciclo di build.
- `android/` e `android-shell/`: output Capacitor o shell storiche; non sono sorgente del portale web.

Ogni progetto Android mantiene build, cache Gradle, SDK locali, `node_modules`, log e APK fuori dal repository principale. Gli APK distribuibili vivono soltanto nelle cartelle `artifacts` approvate del rispettivo progetto.

## Materiali privati e di lavorazione

`assets/`, `source-assets/`, `social-assets/`, `discord-assets/`, `campaign/`, `Vetrina Disegni/`, `tamagochi asset/` e le altre cartelle di bozze contengono originali o materiale di produzione. Non sono fonti servite dal sito e non devono essere aggiunte a Git o copiate nel pacchetto pubblico.

## Output rigenerabili

`.next/`, `.vinext/`, `.netlify/`, `dist/`, `.gradle-rebuild/`, `.tmp/`, `tmp/`, `output/` e `outputs/` possono essere ricreati dagli script. Non sono fonte autorevole.

## Regola di consegna

Prima di una preview eseguire `npm.cmd run verify`. Pubblicazione, invio di campagne e attivazione commerciale restano operazioni separate e richiedono l'autorizzazione esplicita del proprietario.
