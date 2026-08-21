# Collaudo Stripe test su staging

Questa procedura è il gate obbligatorio prima di qualsiasi pagamento reale. Usa soltanto chiavi `sk_test_`, carte di prova Stripe, un LoreWise ID controllato e binding Cloudflare D1/R2 di staging. Non copiare segreti nei sorgenti, negli screenshot o nella chat.

## Preparazione

Prima delle prove manuali eseguire il preflight pubblico, che non crea ordini e non usa segreti locali:

```powershell
npm.cmd run stripe:staging-check -- --url https://DOMINIO-STAGING
```

Il comando richiede HTTPS, modalità test, checkout e webhook test configurati e `robots.txt` con indicizzazione bloccata. Salva una ricevuta non segreta in `output/stripe-staging-checks/`. Un risultato verde non sostituisce checkout, webhook, rimborso e download E2E elencati sotto.

1. Applicare in ordine tutte le migrazioni `drizzle/`; `npm.cmd run audit:database` deve risultare verde.
2. Configurare `STRIPE_SECRET_KEY` test e `STRIPE_WEBHOOK_SECRET` nei secret dello staging.
3. Collegare Stripe al solo endpoint `https://DOMINIO-STAGING/api/stripe/webhook`.
4. Abilitare almeno questi eventi:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.expired`
   - `refund.updated`
   - `charge.refunded`
   - `charge.dispute.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Verificare che una chiave `sk_live_` venga rifiutata e che nessun file acquistabile abbia un URL R2 pubblico.

## Opera digitale

1. Caricare e approvare un pacchetto artistico non sensibile nell’archivio privato.
2. Acquistarlo con carta Stripe test e account membro.
3. Verificare ordine `paid`, una sola entitlement attiva, importo/valuta corretti e pacchetto visibile soltanto al proprietario.
4. Scaricare fino al limite previsto e verificare il rifiuto del tentativo successivo.
5. Aprire una richiesta di rimborso, approvarla come amministratore ed eseguire il rimborso test.
6. Verificare ordine `refunded`, entitlement `revoked`, download negato e certificato storico ancora riconducibile all’ordine.

## Universe Pass

1. Attivare Supporter e poi, con un secondo account o dopo pulizia controllata, Collector.
2. Verificare importi mensili di 7,90 € e 13,90 €, piano corretto e assenza di abbonamenti duplicati.
3. Simulare `invoice.payment_succeeded`: la fattura deve apparire nell’Area personale con periodo e importo.
4. Simulare `invoice.payment_failed`: lo stato deve diventare `past_due` senza creare diritti aggiuntivi.
5. Disattivare e riattivare il rinnovo dall’Area personale.
6. Rimborsare anche un pagamento di rinnovo: ordine e abbonamento devono essere revocati tramite il registro fatture.

## Commissione

1. Creare una richiesta con lo stesso indirizzo del LoreWise ID controllato.
2. Impostare preventivo e acconto; accettare condizioni e preventivo dal percorso cliente.
3. Pagare l’acconto test: pagamento `paid` e pratica `in_progress`.
4. Portare la pratica a `awaiting_balance`; pagare il saldo test e verificare `balance_paid`.
5. Confermare manualmente `completed` soltanto dopo la consegna reale.
6. Verificare che rimborso o contestazione portino la pratica a `payment_issue`, senza proseguire automaticamente.

## Gioco Windows

1. Approvare in R2 esclusivamente l’installer con SHA-256 registrato nella checklist Windows.
2. Completare checkout test da 5,99 €.
3. Verificare ordine, licenza personale, limite download, nome file, dimensione e hash dopo lo scaricamento.
4. Eseguire installazione, avvio e disinstallazione del file effettivamente scaricato.
5. Rimborsare l’ordine e verificare la revoca immediata dei download.

## Evidenze da conservare

- riferimenti ordine LoreWise e ID eventi Stripe, mai segreti;
- stati prima/dopo di ordine, entitlement, abbonamento, fattura e commissione;
- hash del file consegnato;
- data, account di collaudo e risultato;
- anomalie risolte e ripetizione completa del caso interessato.

Solo dopo tutti i risultati verdi la roadmap può segnare il commercio come completato in staging. L’attivazione live richiede comunque una decisione separata e l’approvazione esplicita di Luigi.
