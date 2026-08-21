# Gestione sicura delle chiavi Supabase

## Stato rilevato

Una chiave Supabase con privilegi elevati era presente in un file ambiente locale del progetto del gioco. Una chiave `sb_secret_...` può bypassare le regole Row Level Security e deve essere considerata compromessa quando compare in output, cronologia o file condivisi.

## Azioni obbligatorie

1. Terminare prima qualsiasi build in corso, per non produrre un pacchetto incompleto.
2. Eliminare la chiave dal file locale e verificare che non compaia nei sorgenti o negli artefatti generati.
3. Nel pannello Supabase aprire **Project Settings → API Keys**.
4. Creare una nuova secret key dedicata al solo backend che ne ha bisogno.
5. Configurarla esclusivamente nei secret del servizio server o della piattaforma di hosting.
6. Revocare esplicitamente la vecchia chiave: crearne una nuova non invalida automaticamente quella precedente.
7. Ripetere ricerca e build, quindi controllare nuovamente gli artefatti.

## Ordine sicuro della sostituzione

La vecchia chiave non va revocata come prima operazione: se il backend pubblico la sta ancora usando, il gioco online perderebbe accesso ai servizi server. La sequenza corretta è:

1. creare in Supabase una nuova secret key dedicata al backend;
2. salvarla direttamente nel gestore dei segreti dell’hosting, senza copiarla nei sorgenti o nella chat;
3. ridistribuire il backend mantenendo temporaneamente valida anche la vecchia chiave;
4. verificare sul dominio pubblico autenticazione, salvataggio cloud e funzioni server che usano Supabase;
5. revocare la vecchia chiave dal pannello Supabase;
6. ripetere immediatamente le stesse verifiche pubbliche;
7. registrare data, operatore e risultato, senza annotare il valore della chiave.

Se uno dei controlli al punto 4 non riesce, non si procede alla revoca: si ripristina la configurazione del servizio e si individua il backend ancora collegato alla vecchia credenziale.

Le applicazioni web, desktop e Android devono usare soltanto la publishable key con le corrette policy RLS. Nessuna secret key deve essere inclusa nel client.

Nel progetto LoreWise Universe è disponibile anche `npm.cmd run audit:secrets`: il controllo esamina i file testuali del repository, ignora dipendenze e output e segnala soltanto percorso, riga e tipo di possibile credenziale. Non stampa mai il valore rilevato.

Riferimenti ufficiali:

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
