# Fuori Trama · verifica locale per una futura distribuzione

Data del controllo: 19 agosto 2026.

## Esito tecnico

- Typecheck TypeScript: superato.
- Test automatici: 141/141 superati in 46 file.
- Build Vite di produzione: superata.
- Le segnalazioni Vite sugli URL `/fuori-trama-next/media/...` riguardano risorse pubbliche risolte a runtime; un campione dei file indicati è presente nella cartella `public/media`.

Questo prova la coerenza tecnica della build locale, non equivale a un collaudo visuale completo su browser e dispositivi reali.

## Esito contenuti e diritti

Il comando del progetto `audit:provenance` registra 667 voci e le classifica tutte come riferimenti esterni, distribuite fra numerosi franchise di terzi. Il report dichiara `blocking: false` perché si definisce un inventario per un progetto non commerciale; quel valore non è un’autorizzazione legale e non può essere usato come via libera alla pubblicazione.

Per LoreWise Universe il risultato è quindi vincolante:

- nessuna vendita, download o accesso pubblico di Fuori Trama nello stato corrente;
- nessuna promessa commerciale basata su personaggi, nomi, immagini, ambienti o campagne di terzi;
- prima di una distribuzione occorre scegliere fra sostituzione con contenuti originali GiWise, rimozione dei contenuti esterni oppure autorizzazioni/licenze documentate;
- dopo la bonifica occorre rigenerare l’inventario e ottenere zero riferimenti non autorizzati nel pacchetto distribuibile.

## Stato corretto su LoreWise Universe

Fuori Trama resta un progetto locale in sviluppo. La pagina pubblica può descrivere soltanto motore, struttura e ambienti originali LoreWise già selezionati, mantenendo acquisto e download disattivati.
