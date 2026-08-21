# Email account LoreWise Universe

Questa cartella conserva la copia locale dei modelli inseriti nel progetto Supabase ospitato. Il pannello Supabase resta la configurazione effettivamente usata per l’invio.

## Mittente approvato

- Nome: `LoreWise Universe`
- Indirizzo: `account@auth.lorewisenexus.it`
- Assistenza: `lorewise.archive@gmail.com`

## Modelli prioritari

| Pannello Supabase | Oggetto | File locale |
| --- | --- | --- |
| Confirm signup | Conferma il tuo LoreWise ID | `supabase/email-templates/confirmation.html` |
| Reset password | Reimposta la password del tuo LoreWise ID | `supabase/email-templates/recovery.html` |
| Password changed | La password del tuo LoreWise ID è stata modificata | `supabase/email-templates/password-changed.html` |
| Email address changed | L’indirizzo email del tuo LoreWise ID è stato modificato | `supabase/email-templates/email-changed.html` |

## Stato nel progetto ospitato

Configurazione verificata il 20 agosto 2026 nel progetto Supabase `LoreWise Universe`:

- conferma registrazione personalizzata e salvata;
- recupero password personalizzato, salvato e privo di `ConfirmationURL` nel contenuto;
- notifica di modifica password personalizzata, salvata e attivata;
- notifica di modifica indirizzo email personalizzata, salvata e attivata;
- nessuna email di prova inviata durante l’applicazione dei modelli.

Collaudo end-to-end confermato dal proprietario il 20 agosto 2026: registrazione, conferma dell’indirizzo, accesso e recupero password completati con esito positivo.

L’editor del pannello deve sostituire integralmente il contenuto precedente. Una semplice compilazione del campo può accodare il nuovo HTML al modello predefinito: dopo ogni modifica va quindi controllato che non restino intestazioni o collegamenti inglesi prima del primo `<!doctype html>`.

## Vincoli di sicurezza

- Il recupero password usa `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery` e non `{{ .ConfirmationURL }}`. In questo modo il collegamento apre la conferma protetta LoreWise prima di consumare il codice.
- La conferma registrazione usa il callback già gestito dall’app: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`.
- Il tracciamento dei collegamenti del provider email deve restare disattivato.
- Nessun modello contiene password, codici segreti o dati commerciali.

## Scelta grafica temporanea

I modelli usano HTML email compatibile e stili incorporati. Il logo grafico non viene caricato da un percorso locale o provvisorio: sarà inserito soltanto quando esisterà un URL pubblico stabile e la pubblicazione sarà stata autorizzata. Il marchio è quindi espresso per ora come intestazione testuale, senza icone o sigilli ricreati con CSS.

## Modelli non attivi

Inviti, accesso senza password, cambio email e riautenticazione non fanno parte del flusso pubblico attuale. Prima di abilitarli vanno collegati alle rispettive schermate LoreWise e collaudati localmente.
