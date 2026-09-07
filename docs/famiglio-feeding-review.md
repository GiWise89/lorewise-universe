# Revisione Nutri — 5 settembre 2026

## Cinque step

Ambito: azione Nutri per i 53 famigli del catalogo, in locale. Non è una certificazione dell'intero progetto.

1. Controllate le pose precedenti, i ripieghi su pose sedute e i difetti anatomici.
2. Generati 53 nuovi fogli a quattro pose (muso verso il cibo, boccone, masticazione, deglutizione), conservando l'identità visiva e senza ciotole incorporate.
3. Integrate 159 sequenze nei tre stadi, con scala uniforme per sequenza, trasparenza e appoggio al pavimento. Riparati anche idle/walk del Cane musicista, che presentavano un difetto del muso.
4. Un alimento adatto alla specie, postazione fissa al 24% della stanza, consumo soltanto dopo l'arrivo: tre decrementi in quattro secondi, recipiente stabile, 800 ms di assestamento e ritorno idle. Il caricamento precede il movimento.
5. Provato il ciclo completo nella casa per ogni specie, stadio e viewport desktop/mobile.

## Asset

- Generatore immagini integrato; prompt: `docs/famiglio-feeding-v3-prompts.json`.
- Sorgenti: `famigli-del-nexus/source-assets/generated-actions/feeding-v3/<id>.png`.
- File della casa: `public/famiglio/rebuild/collection/<id>/growth/<stadio>/house/feed-v3.png`.
- Preparazione: `scripts/prepare-famiglio-feeding-v3.mjs`.
- Provini visivi: `artifacts/famiglio-meal-review/v3/<id>.png`.
- Geometria: `artifacts/famiglio-meal-review/v3/geometry.json`.
- Backup motion Cane musicista: `artifacts/famiglio-meal-review/before-motion/`.

La rimozione del fondale lavora sulle aree chiare neutre collegate al bordo, non elimina globalmente il bianco del pelo. I tre stadi riutilizzano il nuovo ciclo con i fattori di crescita del progetto: non sono tre design anatomici distinti. Nutri non usa più il vecchio ripiego su pose sedute; gli asset precedenti restano conservati.

## Evidenze e limiti

- `artifacts/famiglio-rebuild-qa/meal-contract-all-318.json`: 318 cicli browser (53 specie × 3 stadi × desktop/mobile). Controlli di percorso, orientamento, unicità e posizione del cibo, quattro pose, consumo dopo arrivo, ritorno idle e visibilità canvas.
- `artifacts/famiglio-rebuild-qa/market-layout-audit-meal-contract.json`: ripetizione finale su Gatto, Panda, Brachiosauro, Cane musicista, Uccellino e Anchilosauro nei due viewport, dopo gli ultimi aggiustamenti di ciotola e distanza.
- 86 test mirati superati: feeding-v3, house-integrity e rebuild.
- Test PNG: quattro frame distinti, margini, alpha, baseline, nessun componente isolato inferiore a tre pixel. Questi controlli non sostituiscono la revisione artistica dei provini.
- TypeScript e lint mirato controllati separatamente.

Le prove complete accelerano il tempo soltanto nel browser di collaudo. Mobile indica viewport browser, non telefono fisico. Screenshot nella cartella del report. Nessuna pubblicazione online; il server richiesto resta sulla porta 3016.

Anteprima: http://localhost:3016/famiglio?preview=home&growth=adulto&test=all
