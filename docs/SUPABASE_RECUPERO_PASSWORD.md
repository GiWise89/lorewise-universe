# Recupero password LoreWise senza link consumati in anticipo

La pagina `/auth/confirm` non verifica automaticamente il codice ricevuto. Il codice viene consumato soltanto dopo il clic esplicito dell’utente sul pulsante LoreWise.

Il flusso locale usa il modello predefinito Supabase in modalità implicit, così l’email può essere aperta anche in un browser diverso da quello che ha richiesto il recupero. I token temporanei arrivano nel frammento dell’URL, vengono utilizzati soltanto dopo il clic esplicito e sono rimossi dall’indirizzo appena la sessione viene creata. Il flusso continua a riconoscere i precedenti codici PKCE nello stesso browser. Per entrambi sono indispensabili il `Site URL` e i `Redirect URLs` corretti. Il modello personalizzato con `TokenHash` descritto sotto resta la soluzione consigliata prima della pubblicazione.

Nel pannello Supabase, in **Authentication → Email Templates → Reset password**, il collegamento del pulsante deve usare:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Conferma il recupero password</a>
```

L’applicazione invia come `RedirectTo` un indirizzo nel formato:

```text
http://localhost:3000/auth/confirm?next=%2Faccount%2Fpassword
```

Per il sito pubblico, l’origine cambia automaticamente con il dominio in uso. L’URL pubblico deve essere presente tra i Redirect URLs autorizzati in Supabase.

Non usare `{{ .ConfirmationURL }}` per il pulsante di recupero LoreWise: quel collegamento verifica il token durante la prima apertura e può essere consumato dal controllo automatico del provider email.
