# Standard di qualita - Famigli del Nexus

Questo documento rende verificabili i dieci interventi di consolidamento. Non introduce collegamenti pubblici e non riguarda il progetto APK sospeso.

## 1. Standard sprite dei 53 Famigli

- Ogni specie deve conservare silhouette, palette, accessori e variante colore tra Casa, Spedizioni e Lotte.
- Ogni foglio deve avere frame quadrati, sfondo trasparente e nessun elemento estraneo alla posa.
- Casa: `idle`, `walk`, `feed`, `play`, `clean`, `care`, `sit`, `groom`, `sleep`, `sleep-calm`.
- Lotta: `idle`, `entrance`, `run`, `physical`, `magic`, `technique`, `guard`, `hit`, `exhausted`, `victory`, con alias compatibili `attack`, `win`, `lose`.
- Lo script `npm run audit:famiglio-quality` verifica 53 specie, tre eta, sequenze richieste e 20 NPC.
- Tavola visuale generata di riferimento: `famigli-del-nexus/source-assets/generated-combat/motion-standard-v1.png`.

## 2. Famiglie di movimento

Le temporizzazioni non sono uguali per tutti: quadrupedi leggeri, quadrupedi pesanti, volatili, creature volanti, rettili, rettili pesanti, bipedi e creature magiche usano accelerazioni e cadenze diverse definite in `lib/famiglioCombatMotion.ts`.

## 3. Un solo ecosistema di gioco

Fame, energia, igiene, azione in corso e bagno regolano l'accesso a Spedizioni e Lotte. Uno stato inquieto applica una lieve penalita; uno stato splendido concede un piccolo vantaggio. Non esistono morte o perdita permanente del Famiglio.

## 4. Campagna

I 20 livelli alternano duello, rapidita, resistenza, uso tattico degli stati e scontri a fasi. Ogni quarto livello e una soglia di comando. Gli NPC mantengono pose idle, esultanza, rabbia, vittoria e sconfitta.

## 5. Interfaccia scena-prima

La Casa, l'arena e la spedizione restano il punto focale. I dati numerici sono secondari, i pulsanti non coprono le scene e i testi non escono mai dai fumetti.

## 6. Ciclo Tamagotchi

Il Famiglio saluta al ritorno, vive un momento quotidiano coerente con la specie, manifesta bisogni, usa il bagno e richiede pulizia. Le conseguenze sono temporanee e recuperabili.

## 7. Stato autorevole

Il salvataggio cloud conserva tre Case con revisione, convalida dimensione e migrazione dei salvataggi locali. Ogni nuova proprieta deve avere un valore di ripristino sicuro.

## 8. Bilanciamento

`npm run simulate:famiglio-economy` simula 60 giorni per profilo casuale, regolare e intenso e impedisce crescita istantanea o inflazione evidente.

## 9. Controllo tecnico

I report vengono scritti in `artifacts/famiglio-quality-report.json` e `artifacts/famiglio-economy-60-days.json`. Sono strumenti interni, mai mostrati ai visitatori.

## 10. Struttura e prestazioni

La logica condivisa vive in moduli puri (`famiglioWellbeing`, `famiglioDailyMoments`, movimento, campagna, cloud). Il componente principale resta orchestratore; le aree pesanti devono essere caricate solo quando vengono aperte.
