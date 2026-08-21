# Dati richiesti per completare LoreWise Universe

Questo registro raccoglie soltanto informazioni pubbliche o decisioni del proprietario. Password, chiavi Stripe, token Cloudflare, credenziali SMTP e codici di recupero non devono essere scritti qui né inviati in chat.

## 1. Dominio e ambiente di prova

- [x] Dominio pubblico definitivo: `https://lorewisenexus.it/`.
- [x] Pubblicazione e nuovo staging non autorizzati fino al completamento e a un successivo consenso esplicito di Luigi.
- [x] Account Cloudflare attualmente non presente; nessuna apertura o attivazione autorizzata in questa fase.

## 2. Identità legale e privacy

- [x] Titolare pubblico: `Luigi Marzo`.
- [x] Nessuna sede o attività aziendale attualmente disponibile.
- [x] Nessuna Partita IVA dichiarata.
- [ ] Inquadramento fiscale e amministrativo verificato con un professionista prima di attivare vendite dirette, abbonamenti o commissioni a pagamento.
- [x] Contatto pubblico definitivo per privacy: `lorewise.archive@gmail.com`.
- [x] Account inattivi cancellabili dopo 24 mesi, con avviso email 30 giorni prima. Ordini e dati soggetti a obblighi amministrativi seguono i termini di legge; politica da validare professionalmente prima del lancio.
- [x] Età minima per creare LoreWise ID: 16 anni. I contenuti 18+ mantengono un controllo separato e non sono autorizzati per utenti di 16–17 anni.

## 3. Assistenza

- [x] Account e assistenza LoreWise: `lorewise.archive@gmail.com`.
- [x] GiWiseShop: `Giwiseshop@outlook.it`.
- [x] Commissioni e Shop: WhatsApp `+39 350 531 2999`.
- [x] Prima risposta dell'assistenza entro 2 giorni lavorativi; il termine indica la presa in carico, non la risoluzione completa.
- [ ] Regola pubblica per richieste, rimborsi e problemi di download.

## 4. Email account

- [x] Nome visibile del mittente delle email automatiche: `LoreWise Universe`.
- [x] Indirizzo mittente scelto: `account@auth.lorewisenexus.it`; risposta a `lorewise.archive@gmail.com`. Il dominio `auth.lorewisenexus.it` è verificato su Resend.
- [x] Provider scelto: `Resend Free`, inizialmente senza costi e con limite di 100 email al giorno.
- [x] Account Resend attivo, chiave limitata al solo invio e SMTP configurato nel pannello Supabase.
- [x] Email reale di recupero password consegnata da Resend e ricevuta dal proprietario il 20 agosto 2026.
- [x] Collaudo reale di registrazione, conferma email, accesso e recupero password superato il 20 agosto 2026.
- [ ] URL pubblico e `/auth/callback` autorizzati in Supabase.
- [ ] Scelta facoltativa sull'accesso Google; email e password sono già sufficienti.

## 5. Pagamenti e consegne

- [x] Stripe locale limitato alla modalità test e chiavi live rifiutate.
- [x] Preflight Stripe locale superato.
- [ ] Configurazione Stripe test nello staging, eseguita senza condividere segreti.
- [ ] Checkout test completo per opera, abbonamento, commissione e gioco.
- [ ] Webhook, rimborso, revoca del diritto e limite download verificati.
- [x] Installer Windows 1.0.2 verificato localmente e dry-run R2 superato.
- [ ] Installer trasferito nel deposito privato R2 e approvato in quarantena.
- [ ] 34 pacchetti Arte trasferiti e approvati nel deposito privato.

Finché `LOREWISE_COMMERCIAL_LEGAL_APPROVED` resta `false`, tutte le funzioni commerciali reali devono rimanere disattivate. Le simulazioni e Stripe test possono essere collaudati senza incassare denaro.

## 6. Servizi esterni e contenuti sospesi

- [ ] Verifica amministrativa finale di cookie e template Hoplix.
- [ ] Approvazione definitiva delle immagini pubbliche di Fuori Trama.
- [ ] Fuori Trama resta non commercializzabile finché i riferimenti esterni non sono rimossi o autorizzati.

## Sequenza operativa

1. Dominio, staging e Cloudflare.
2. Deposito R2 e installer.
3. Stripe test end-to-end.
4. SMTP e redirect Supabase.
5. Dati legali, privacy e assistenza.
6. Hoplix e revisione visiva dello staging.
7. Approvazione esplicita di Luigi prima della pubblicazione; `LOREWISE_PUBLICATION_APPROVED` deve restare `false` fino a quel momento.
