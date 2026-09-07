# Roster sprite — Famigli del Nexus

Catalogo tecnico preparato per il futuro habitat Tamagotchi. Le risorse attive sono in `public/famiglio/rebuild/starters` e la configurazione verificabile è in `lib/famiglioSpriteRoster.ts`.

| Famiglio | Idle | Camminata | Sonno | Azioni vive | Origine camminata |
| --- | --- | --- | --- | --- | --- |
| Gatto | 7 frame | 7 frame | 3 frame | 7 azioni dedicate, 4 colori | Pacchetto acquistato |
| Golden Retriever | 10 frame | 6 frame | 8 frame | 7 azioni dedicate | Pacchetto acquistato |
| Coniglio | 12 frame | 8 frame | 6 frame | 7 azioni dedicate, 3 colori | Pacchetto acquistato |
| Volpe | 4 frame | 8 frame | 6 frame | 7 righe dedicate | Pacchetto acquistato |
| Tartaruga | 8 frame | 8 frame | 12 frame | 7 azioni dedicate | Pacchetto acquistato |
| Pappagallo | 6 frame | 6 frame | 8 frame | 7 azioni dedicate, 5 colori | Pacchetto acquistato |
| Panda | 4 frame | 8 frame | 4 frame | 7 azioni dedicate | Camminata originale generata |
| Cavallo | 8 frame | 8 frame | 6 frame | 7 azioni coerenti | Camminata originale generata |

## Regole già codificate

- La camminata verrà riprodotta soltanto mentre il Famiglio cambia posizione.
- Il sonno sarà esplicito e manterrà la posa finale a occhi chiusi.
- Le sequenze non locomotorie non causano scivolamento e mantengono il Famiglio fermo sul proprio bersaglio.
- `sit`, `groom`, `sleep` e `sleep-calm` terminano mantenendo l'ultima posa valida.
- Ogni file è una striscia orizzontale composta da celle quadrate dichiarate nel catalogo.
- Le varianti di Coniglio e Pappagallo provengono dalle corrispondenti cartelle acquistate e restano attive in ogni azione.

## Roster completo e Atelier di Medusa

L'Atelier di Medusa contiene 53 specie: 18 reali, 14 magiche, 9 leggendarie e 12 dinosauri. Non esiste una sezione di mercato autonoma chiamata "Famigli". Ogni Famiglio costa `1,99 €`; il bundle completo costa `4,99 €`.

Per ogni specie sono presenti dieci strisce: `idle`, `walk`, `feed`, `play`, `clean`, `care`, `sit`, `groom`, `sleep` e `sleep-calm`. Sono inoltre complete le varianti dichiarate di Gatto (6), Coniglio (3), Pappagallo (5) e Uccellino (8).

- Famigli reali: dal Gatto al Lupo, inclusi tutti i cani, gli orsi, gli uccelli e Gallina/Pulcino concordati.
- Famigli magici: ottenibili anche tramite uova, missioni ed esplorazioni.
- Famigli leggendari: collegati a ricompense narrative rare.
- Dinosauri: dodici specie collegate alle spedizioni preistoriche.

Le risorse sono in `public/famiglio/rebuild/collection`; gli atlanti originali dei dinosauri sono in `public/famiglio/rebuild/dinosaur-atlases`. Classificazione, prezzi e percorsi sono definiti in `lib/famiglioMarketExpansion.ts`.
