# GiWise Shop — verifica vetrina e integrazione Hoplix

Verifica eseguita il 19 agosto 2026 sulle pagine pubbliche di `https://giwiseshop.it/`.

## Ruolo delle due piattaforme

- LoreWise Universe presenta collezioni e prodotti con una direzione editoriale coerente con il progetto.
- GiWiseShop/Hoplix rimane responsabile di varianti, carrello, pagamento, produzione, spedizione e tracciamento.
- Ogni prodotto pubblicato su LoreWise conduce alla sua pagina reale sul negozio: non vengono simulati disponibilità, ordini o pagamenti.
- Una futura sincronizzazione degli ordini dovrà essere introdotta soltanto dopo aver verificato API, webhook e identificativi prodotto disponibili nel pannello Hoplix.

## Catalogo collegato

La vetrina locale usa immagini derivate dagli originali presenti in `GiWise Shop Merce`; gli originali non sono stati modificati. Il controllo ha censito 104 prodotti pubblici e 128 file locali.

- 103 prodotti pubblici dispongono di un'immagine locale verificata e sono presenti nel catalogo interno;
- 102 file sono corrispondenze esatte con le immagini servite dal negozio;
- 22 file sono varianti reali verificate nelle selezioni delle singole schede prodotto;
- 2 file sono guide alle taglie e non costituiscono prodotti;
- 2 immagini locali non risultano attualmente pubblicate e restano escluse dalla vetrina;
- 1 prodotto pubblico non viene mostrato perché non dispone di una corrispondenza locale verificata.

Nomi, prezzi, indirizzi e associazioni delle immagini sono registrati in `data/shop-live-catalog.json`, `data/shop-asset-audit.json` e `data/shop-storefront-catalog.json`. Il rapporto leggibile completo è disponibile in `docs/giwise-shop-catalog-audit.md`.

Collezioni collegate:

- Nuovi arrivi
- Abbigliamento
- Oversize
- Setup e gadget
- Collezioni Art
- Personalizza il tuo prodotto

## Problemi rilevati sul negozio pubblico

1. La pagina Personalizza genera un errore JavaScript: uno script tenta di applicare `addEventListener` a un elemento assente.
2. Alcuni collegamenti alla privacy del banner cookie vengono costruiti a partire dall’indirizzo corrente e possono diventare percorsi errati, per esempio `/conditionsprivacy`.
3. Nella pagina Social sono presenti caratteri codificati in modo errato (mojibake).
4. Diverse pagine hanno grandi vuoti verticali e gerarchie dei titoli poco coerenti, soprattutto su schermi piccoli.
5. Filtri, testi secondari e controlli del catalogo risultano minuti; le liste mobili diventano eccessivamente lunghe.

## Correzioni da applicare nel pannello Hoplix

- Rendere condizionale lo script della pagina Personalizza oppure collegarlo all’elemento realmente presente.
- Sostituire i collegamenti relativi della privacy con URL assoluti o percorsi che iniziano con `/`.
- Salvare i testi Social in UTF-8 e sostituire i caratteri già corrotti.
- Ridurre spaziature e blocchi vuoti nei template, conservando una dimensione minima leggibile per testi e filtri.
- Controllare titoli `h1`–`h3`, descrizioni, alt delle immagini e ordine di tabulazione.

Questi interventi riguardano la piattaforma esterna: prima di salvare modifiche nel pannello è necessario accedere all’account amministrativo e confermare i cambiamenti nella schermata finale.

## Evoluzione commerciale consigliata

1. Prima fase completata in locale: vetrina LoreWise con collegamenti diretti alle pagine prodotto Hoplix.
2. Seconda fase completata in locale: identificativo stabile per ogni prodotto, registro delle corrispondenze e controllo di nome, prezzo e URL.
3. Terza fase: se Hoplix espone API o webhook adeguati, adapter server-side per ordini e stato spedizione collegati al LoreWise ID.
4. I pagamenti non devono essere dichiarati integrati in LoreWise finché checkout, ricevute, rimborsi e autorizzazioni non sono stati collaudati end-to-end.
