# Prerequisiti per il lancio di LoreWise Universe

Aggiornamento: 20 agosto 2026

Questo documento separa il lavoro tecnico già concluso dalle decisioni e configurazioni esterne che non possono essere inventate o attivate autonomamente. Nessuna voce qui autorizza la pubblicazione o pagamenti reali.

## Dati che deve confermare il proprietario

- Nome completo o denominazione legale del titolare del trattamento e delle vendite.
- Recapito pubblico generale approvato: `lorewise.archive@gmail.com`.
- Recapito GiWise Shop approvato: `Giwiseshop@outlook.it`; WhatsApp commissioni e Shop: `+39 350 531 2999`.
- Eventuale sede o indirizzo da pubblicare quando richiesto dalla normativa applicabile.
- Prima risposta dell'assistenza entro 2 giorni lavorativi; il termine indica la presa in carico, non garantisce la risoluzione completa entro lo stesso periodo.
- Account inattivi cancellabili dopo 24 mesi, con avviso email 30 giorni prima; ordini e dati obbligatori seguono i termini di legge. Regola e procedura di esercizio dei diritti restano da sottoporre a verifica professionale.
- Età minima LoreWise ID confermata a 16 anni; accesso ai contenuti 18+ mantenuto separato e riservato agli adulti. La formulazione definitiva della politica relativa ai minori resta da verificare professionalmente.

## Configurazioni esterne necessarie

- SMTP Resend configurato in Supabase e collaudato con un'email reale di recupero password ricevuta il 20 agosto 2026.
- Provider approvato: `Resend Free`, entro il limite iniziale di 100 email al giorno; nessun piano a pagamento è autorizzato.
- Usare `LoreWise Universe <account@auth.lorewisenexus.it>` come mittente e `lorewise.archive@gmail.com` come Reply-To; `auth.lorewisenexus.it` è verificato e il collegamento SMTP è salvato in Supabase.
- Impostare il dominio pubblico definitivo e tutti gli URL di reindirizzamento autorizzati in Supabase.
- Confermare la revoca e sostituzione di ogni chiave Supabase precedentemente esposta.
- Ripetere sul dominio di staging il collaudo autenticato; il controllo locale ospite su desktop e mobile è già superato.
- Trasferire l'installer Windows 1.0.2 nell'archivio privato R2 con la procedura multipart già predisposta e registrare la ricevuta verificata nell'Archivio giochi Windows.
- Collegare il webhook Stripe di prova all'indirizzo locale o di staging raggiungibile e conservarne il segreto solo nell'ambiente protetto.

## Collaudi obbligatori prima della pubblicazione

La sequenza operativa e le evidenze richieste sono definite in `docs/STRIPE_STAGING_COLLAUDO.md`.

- Registrazione, conferma email, accesso, recupero password e cancellazione account usando gli URL definitivi.
- Pagamento Stripe esclusivamente in modalità test per opera, videogioco e abbonamento.
- Creazione idempotente di ordine, licenza e diritto di download dopo il webhook verificato.
- Rifiuto di importo, valuta, prodotto o sessione alterati.
- Download consentito solo al LoreWise ID titolare, con limite applicato e file corretto.
- Rimborso di prova con revoca coerente del diritto di accesso.
- Ricevuta, storico ordini e assistenza visibili al cliente corretto.
- Verifica mobile, tastiera, contrasto, ingrandimento testo, immagini integrali e tempi di caricamento sulle pagine principali.
- Verifica tecnica dei collegamenti pubblici di GiWiseShop/Hoplix e delle pagine privacy/cookie correnti.

## Verifiche locali già chiuse

- Build di produzione, lint, 66 test e 857 pagine/indirizzi superati.
- Preparati e verificati 34/34 pacchetti commerciali Arte: 204,00 MiB complessivi, originale ricevuto byte-per-byte, PNG e JPG sRGB, fondali desktop/mobile integrali, licenza, istruzioni e manifest SHA-256. Gli originali risultano invariati.
- Aggiunta l'area amministrativa privata `Prontezza al lancio`, che separa controlli locali, caricamenti R2, configurazioni Stripe/Supabase, dati legali e verifiche Hoplix senza mostrare segreti.
- Predisposti trasferimento multipart R2 con ricevuta verificata e preflight Stripe staging; nessuno dei due attiva vendite o pubblicazione.
- Dry-run R2 superato sul vero installer Windows 1.0.2 e preflight Stripe superato in locale; restano il trasferimento remoto e il collaudo E2E autenticato sul futuro staging.
- Aggiunta nella stessa area una scheda guidata che prepara i sette dati pubblici mancanti senza inviarli, conservarli o includere credenziali.
- Audit accessibilità, sicurezza dei collegamenti e prestazioni superato su 857 schermate: struttura `main`/`h1`, zoom, testi accessibili, nuove schede protette, nessun autoplay sonoro, HTML massimo 389 KiB e caricamento prioritario entro soglia.
- Mobile verificato a 390 × 844 sulle sezioni principali: nessun overflow orizzontale, immagine visibile rotta o ritaglio delle immagini di contenuto.
- Hero di The Wound Remembers corretta per mostrare integralmente l’immagine anche su mobile.
- Fuori Trama verificato a 390 × 844 e 1440 × 900: intestazione, scheda eroe e comandi leggibili, nessun overflow della pagina e mappa tattica con scorrimento interno; 141/141 test e build superati.
- Pacchetto pubblico ripulito dai PNG sorgente duplicati: 34 file e 70,25 MiB archiviati in `assets/public-source-archive`, senza perdita né cancellazione dei sorgenti.
- Audit di distribuzione superato: nessun EXE, ZIP, PSD o altro archivio privato nell’area pubblica.

## Stato del gioco Windows

- Installer: `The-Wound-Remembers-Setup-1.0.2.exe`.
- Dimensione: 379.498.399 byte.
- SHA-256: `85830385096300EDC17FCD79A8210A212848F081E044160FE6E33CF31240D810`.
- Defender: nessun rilevamento nel controllo del 19 agosto 2026.
- Installazione, avvio desktop e disinstallazione: superati in ambiente locale reversibile.
- Firma: non presente; l'avviso di distribuzione indipendente deve restare visibile.
- Aggiornamenti: manuali per la prima uscita, finché un canale automatico non viene collaudato con due versioni valide.
- Vendita e download: disattivati finché archivio privato e prova commerciale non sono completati.

## Condizione di pubblicazione

La pubblicazione finale richiede contemporaneamente: tutte le verifiche locali superate, dati legali completati, servizi esterni configurati, nessuna credenziale esposta, approvazione visiva di Luigi e autorizzazione esplicita alla messa online.

L'amministratore può controllare lo stato aggregato da `/gestione-lancio`. Le variabili booleane di approvazione devono passare a `true` soltanto dopo una prova realmente conclusa; non sono sostituti del collaudo.
