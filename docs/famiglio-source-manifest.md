# Manifest sorgenti Famiglio del Nexus

La funzionalità è composta dai seguenti gruppi, tutti necessari prima di una
eventuale pubblicazione autorizzata:

- `app/famiglio` e `app/api/famiglio`: pagina e API server-authoritative;
- `components/NexusFamiliar*`: interfaccia, tutorial, rituali e diario;
- `lib/nexusFamiliar*`: stato, cataloghi, economia, missioni e sincronizzazione;
- `public/famiglio`: ambienti completi, sprite e look precomposti;
- `tests/nexus-familiar-*` e `scripts/audit-familiar-*`: regressione e controlli;
- `drizzle/0028..0031` e migrazioni Netlify corrispondenti: persistenza cloud;
- `famiglio-nexus-webview-android`: unico APK canonico per l'anteprima mobile.

La cartella `famiglio-nexus-android` è un prototipo archiviato. Nessun file di
build, cache Gradle, log QA o APK viene incluso nei sorgenti pubblicabili.

Questo documento non autorizza né esegue una pubblicazione.
