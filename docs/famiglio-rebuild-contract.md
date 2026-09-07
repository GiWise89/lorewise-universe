# Nuovo Famiglio del Nexus — contratto di ricostruzione

## Destinazione

- Il Famiglio è una nuova esperienza web responsive integrata nella route `/famiglio` del sito LoreWise.
- La ricostruzione non riutilizza componenti, layout o architettura del precedente Famiglio.
- Desktop e mobile condividono la stessa applicazione web adattiva.
- L'APK verrà derivato dalla versione web soltanto dopo completamento e approvazione locale.

## Regola inderogabile sulle animazioni

- Le animazioni CSS sono vietate.
- Il nuovo Famiglio non usa `animation`, `@keyframes` o `transition` per animare creature, uova, ambienti, effetti o interfaccia.
- Il CSS gestisce esclusivamente layout responsive e presentazione statica.
- Le animazioni di gioco vengono renderizzate su Canvas 2D e aggiornate da JavaScript tramite `requestAnimationFrame`.
- Il motore usa un passo temporale controllato: ogni fotogramma della sequenza ha una durata esplicita e non viene duplicato quando il browser salta un aggiornamento.
- La posizione della creatura e il fotogramma corrente appartengono allo stesso stato di simulazione, per impedire scivolamento e pattinamento.
- La sequenza di camminata viene eseguita soltanto durante uno spostamento; all'arrivo passa immediatamente a una posa ferma valida.

## Primo verticale

1. Scelta consapevole tra otto uova identificabili.
2. Conferma reversibile dell'uovo con anteprima animata del vero Famiglio contenuto, così la scelta non è mai al buio.
3. Schiusa automatica in tre fasi da 40 secondi, per una durata totale di 120 secondi e senza clic ripetitivi.
4. Durante l'attesa si possono preparare nome, sesso e, solo quando esistono sprite reali, variante di colore.
5. Temperamento e caratteristiche del futuro Famiglio sono visibili durante la preparazione.
6. Durante la schiusa torna protagonista il guscio; il Famiglio completo viene accolto al termine del rito.
7. Verifica locale su desktop e mobile prima di qualsiasi pubblicazione.

## Navigazione del dispositivo

- Il comando sinistro e quello destro scorrono le uova nella selezione e, nella futura casa, i Famigli già sbloccati.
- Il comando centrale apre l'uovo evidenziato o avvia il rituale dalla conferma.
- Le schermate successive alla selezione espongono sempre un comando Indietro.
- Tornare indietro durante la schiusa richiede conferma, azzera soltanto il tempo del rito e conserva nome, sesso e colore preparati.
- Le varianti mostrano campioni cromatici reali prima della scelta; non vengono simulate varianti prive di sprite.

## Roster sprite minimo

- Ognuno degli otto Famigli iniziali possiede quattro sequenze normalizzate: `idle`, `walk`, `sleep` e `care`.
- Gli sprite presenti nei pacchetti acquistati restano la fonte primaria.
- Le sole camminate generate sono Panda e Cavallo, perché mancavano nei pacchetti; gli originali non sono stati sovrascritti.
- `walk` e `idle` possono ciclare; `sleep` e `care` terminano mantenendo l'ultima posa valida.
