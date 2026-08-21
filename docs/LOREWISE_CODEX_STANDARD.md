# Standard editoriale del LoreWise Codex

Ultima revisione: 19 agosto 2026

Questo documento definisce il modello obbligatorio per ogni dossier del LoreWise Codex. La struttura deve restare editoriale, leggibile e ampliabile: il CSS gestisce impaginazione e responsive, mentre cornici, sigilli, pulsanti ornamentali ed emblemi importanti usano risorse grafiche dedicate.

## Gerarchia dell'archivio

Ogni personaggio appartiene sempre alla catena:

**Categoria → Universo → Opera → Continuità → Personaggio**

I cinque livelli devono essere campi strutturati e non testo ricavato dalla posizione di altre informazioni nella pagina.

## Dati obbligatori

Ogni dossier pubblicabile deve contenere:

1. identificatore, slug, nome e titolo pubblico;
2. categoria, universo, opera, continuità, origine e stato del dossier;
3. immagine autorizzata con percorso, testo alternativo, credito, larghezza e altezza reali;
4. sintesi breve ricercabile;
5. gli otto capitoli: Identità, Appartenenza, Biografia, Personalità, Aspetto e capacità, Relazioni, Apparizioni, Fonti;
6. termini di ricerca controllati;
7. data di revisione, responsabile editoriale, avvisi sui contenuti e campi eventualmente mancanti;
8. fonti collegate ai singoli fatti.

Un dossier è `complete` soltanto se non ha campi mancanti e tutti gli otto capitoli hanno contenuti reali. In caso contrario rimane `in-review` e non entra nell'indice pubblico definitivo.

## Stato e provenienza delle informazioni

- `verified`: informazione sostenuta da una fonte primaria o da un documento di progetto.
- `partial`: informazione presente ma non ancora completamente verificata.
- `to-document`: dato mancante che richiede una decisione o una fonte.
- `editorial`: lore originale aggiunta con autorizzazione del creatore.

Per i personaggi originali GiWise Studio è consentito sviluppare nuova lore coerente con il materiale primario. Ogni aggiunta deve essere marcata come editoriale e collegata alla fonte autoriale del dossier. Non deve contraddire nomi, ruoli, eventi, fazioni o regole già documentati.

Per personaggi o ambientazioni di terzi non si inventano dati per riempire i vuoti. Prima dell'importazione servono verifica dei diritti, distinzione della continuità e fonti pubblicabili.

## Ricerca obbligatoria per personaggi di terzi

La ricerca non si ferma all'opera d'origine o ai dati già presenti nei progetti GiWise. Prima di dichiarare completa una scheda bisogna:

1. controllare le fonti ufficiali dell'autore, dell'editore, dello studio e del distributore;
2. censire romanzi, racconti, film, miniserie, serie televisive, videogiochi e apparizioni ufficiali pertinenti, comprese le produzioni recenti;
3. separare esplicitamente canone originale, adattamenti, remake, reboot, prequel, sequel e crossover;
4. verificare anni, interpreti, formato, ruolo e relazione con la continuità prima di inserirli;
5. registrare una fonte per ogni apparizione, evitando di usare come unica prova aggregatori, wiki o i soli dati locali di Fuori Trama;
6. ripetere la verifica quando una saga riceve nuove opere o quando il dossier viene aggiornato.

I materiali di Fuori Trama documentano l'integrazione GiWise e indicano quali immagini usare, ma non sostituiscono la ricerca sulle opere originali. In caso di divergenza tra continuità, la scheda principale dichiara quale versione descrive e presenta le altre in sezioni distinte.

## Regole visive

- Le immagini non vengono ritagliate per obbligarle a una sagoma unica.
- Quando un personaggio è già presente in Fuori Trama, il Codex usa esclusivamente le immagini collegate alla sua scheda personaggio nel registro `characters.json`. Scene, mappe, fondali, standee, cornici e immagini generate separatamente non possono sostituire il ritratto della scheda.
- Il contenitore si adatta alle proporzioni dichiarate e usa `object-fit: contain`.
- Le immagini trasparenti conservano la trasparenza.
- La cornice adattiva e i pulsanti dei capitoli usano asset raster illustrati, non decorazioni geometriche simulate con CSS.
- Il ritratto può restare in evidenza durante la lettura, ma deve avere distanza dalla navigazione superiore e non restarle attaccato.
- Testi e comandi devono restare leggibili anche a schermo intero e su dispositivi mobili.

## Spoiler e relazioni

Ogni evento cronologico indica il livello `none`, `moderate` o `major`. Le relazioni rimandano a un altro dossier soltanto quando quello slug esiste realmente. Le future preferenze spoiler dell'account dovranno agire su questi dati strutturati.

## Flusso d'importazione

1. verificare proprietà, autorizzazione e continuità;
2. individuare fonti primarie e immagine ufficiale;
3. copiare una risorsa pubblicabile senza alterare l'originale sorgente;
4. separare fatti verificati e sviluppo autoriale;
5. compilare tutti i campi obbligatori;
6. collegare relazioni soltanto a dossier esistenti;
7. eseguire lint, build, test HTML e controllo visivo locale;
8. richiedere l'approvazione di Luigi prima di qualsiasi pubblicazione.

## Revisione dei dossier pilota

### Nhevara, Madreferita

Il ruolo di leader del Sangue Cavo, il viaggio attraverso le Porte, i rapporti principali e l'identità ludica derivano dai file primari di The Wound Remembers. Pronuncia, dati anagrafici, formazione, motivazioni, limiti e raccordi biografici sono espansioni autoriali dichiarate. La revisione del 19 agosto 2026 non ha rilevato contraddizioni con il materiale primario esaminato.

### Kharvoss, Re Sepolto

Titolo, fazione, funzione narrativa, viaggio con Nhevara e identità ludica derivano dai file primari di The Wound Remembers. Vhar-Mor, cronologia personale, rituali funerari, motivazioni e limiti sono espansioni autoriali dichiarate e coerenti con il tema documentato della memoria dei caduti.
