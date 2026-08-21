# GiWiseShop.it · verifica pubblica del ponte LoreWise

Data del controllo: 19 agosto 2026.

## Collegamenti pubblici

La home e le seguenti destinazioni hanno risposto con stato HTTP 200:

- informazioni legali (`/impressum`);
- privacy e cookie (`/privacy`);
- condizioni di vendita (`/conditions`);
- diritto di recesso (`/returns-policy`);
- assistenza (`/contacts`);
- copyright (`/copyright`);
- tracciamento (`/tracking`);
- personalizzazione (`/pages/personalizza-il-tuo-prodotto`).

La pagina Contatti carica il widget Freshdesk di Hoplix; LoreWise deve quindi continuare a presentarlo come canale esterno, senza simulare uno stato dell’ordine o una sincronizzazione inesistente. La pagina di personalizzazione espone correttamente WhatsApp `+39 350 531 2999` e l’indirizzo email pubblico dello Shop.

## Privacy e script

La pagina privacy è la policy Hoplix e dichiara Hoplix come soggetto del trattamento per la piattaforma. Le pagine caricano i moduli `cookiechoices` e `cookieconsent` di Hoplix.

L’HTML pubblico include inoltre dipendenze duplicate o datate, fra cui più caricamenti di jQuery, Bootstrap e Font Awesome. Non è un errore correggibile dal codice LoreWise: va rimosso o consolidato nel template amministrativo Hoplix soltanto dopo una prova visiva del negozio, perché una modifica diretta potrebbe rompere menu, varianti, zoom o checkout.

## Decisione operativa

- I collegamenti LoreWise verso assistenza, condizioni e recesso sono corretti e funzionanti.
- Ordine, pagamento, produzione, spedizione e tracking restano responsabilità del flusso esterno Hoplix.
- Prima del lancio finale resta una verifica amministrativa del banner consenso e dell’eventuale script personalizzato, con prova di rifiuto/accettazione cookie nel browser.
