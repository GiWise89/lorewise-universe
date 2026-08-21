# Rotazione Supabase senza interruzione del gioco

## Scopo

Sostituire la secret key già esposta senza interrompere `thewoundremembers.com`. Questa procedura è una preparazione operativa: nessuna modifica remota viene eseguita automaticamente dal repository LoreWise Universe.

## Barriera prima di iniziare

- accesso amministratore al progetto Supabase corretto;
- accesso ai segreti dell’hosting che serve il backend del gioco;
- possibilità di ridistribuire e controllare il dominio pubblico;
- finestra in cui sia possibile provare accesso, salvataggio cloud e telemetria;
- vecchia chiave ancora valida fino al completamento della verifica con la nuova.

## Procedura

### 1. Crea la sostituta

Nel pannello Supabase, crea una nuova secret key con un nome che identifichi esclusivamente il backend pubblico. Non inserirla in file `.env` condivisi, installer, client web, desktop o Android.

### 2. Aggiorna l’hosting

Sostituisci il valore del segreto server nel pannello dell’hosting. Il nome della variabile deve corrispondere a quello letto dal backend corrente. Non modificare la publishable key usata dal client.

### 3. Ridistribuisci e verifica

Completa la distribuzione del backend e prova sul dominio pubblico:

- accesso con un account di collaudo;
- caricamento del profilo cloud;
- salvataggio e successiva rilettura di una modifica innocua;
- chiamate server che richiedono privilegi backend;
- assenza di secret key nei bundle scaricati dal browser.

Annota solo esito, data e versione distribuita. Non salvare la chiave nei verbali.

### 4. Revoca la vecchia chiave

Solo quando tutti i controlli precedenti sono superati, revoca esplicitamente la chiave esposta dal pannello Supabase. La creazione della nuova chiave non invalida automaticamente la precedente.

### 5. Verifica dopo la revoca

Ripeti gli stessi controlli sul dominio pubblico. Se qualcosa smette di funzionare, non reinserire la chiave revocata in file locali: individua il servizio che non ha ricevuto la nuova configurazione e aggiorna quel servizio.

## Verbale senza segreti

| Campo | Valore da registrare |
| --- | --- |
| Data e ora | Da compilare |
| Progetto Supabase | Solo nome o identificativo non segreto |
| Hosting aggiornato | Da compilare |
| Deploy verificato | Da compilare |
| Login | Superato / non superato |
| Salvataggio cloud | Superato / non superato |
| Funzioni backend | Superato / non superato |
| Vecchia chiave revocata | Sì / no |
| Verifica dopo revoca | Superata / non superata |

## Fonti ufficiali

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
