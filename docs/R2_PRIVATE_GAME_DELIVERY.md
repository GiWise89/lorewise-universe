# Consegna privata del gioco Windows tramite R2

## Perché il trasferimento è separato dal browser

L'installer verificato `The-Wound-Remembers-Setup-1.0.2.exe` pesa `379498399` byte. Il modulo web LoreWise accetta direttamente al massimo 150 MB e Wrangler arriva a 315 MB per singolo caricamento: questo installer deve quindi usare un trasferimento multipart S3 compatibile verso il bucket R2 privato.

Riferimenti ufficiali:

- https://developers.cloudflare.com/r2/objects/upload-objects/
- https://developers.cloudflare.com/r2/reference/wrangler-commands/

Il file non deve avere un URL pubblico permanente. Download e diritti restano collegati al LoreWise ID.

## Credenziali locali necessarie

Creare in Cloudflare una chiave R2 S3 con accesso limitato al solo bucket privato usato da `COMMISSION_UPLOADS`, quindi impostare nella sessione PowerShell locale:

```powershell
$env:R2_ACCOUNT_ID="..."
$env:R2_BUCKET_NAME="..."
$env:R2_ACCESS_KEY_ID="..."
$env:R2_SECRET_ACCESS_KEY="..."
```

Non inserire questi valori nel repository, nell'interfaccia web o in un messaggio. Revocare una chiave monouso dopo il trasferimento.

## Verifica senza caricamento

```powershell
npm.cmd run r2:upload-game -- --file "C:\percorso\The-Wound-Remembers-Setup-1.0.2.exe"
```

Il comando calcola nome, dimensione e SHA-256 e si ferma. Se uno solo non coincide con il manifesto verificato, il file viene rifiutato.

## Trasferimento multipart privato

```powershell
npm.cmd run r2:upload-game -- --file "C:\percorso\The-Wound-Remembers-Setup-1.0.2.exe" --execute
```

Il comando usa parti da 16 MiB, controlla dimensione e metadata SHA-256 sull'oggetto remoto e salva una ricevuta non segreta in `output/r2-upload-receipts/`.

## Registrazione e approvazione

1. Aprire l'area amministrativa `Archivio giochi Windows`.
2. Incollare la ricevuta JSON nel riquadro dedicato ai file oltre 150 MB.
3. Registrare il file: il server controlla chiave privata, dimensione e impronta prima di inserirlo in quarantena.
4. Confermare firma dichiarata, scansione, prova di installazione e piano aggiornamenti.
5. Approvare la build soltanto dopo queste prove.
6. Eseguire il checkout Stripe di prova e verificare il download con un account test prima di rendere disponibile il prodotto.

Il trasferimento o la registrazione non attivano da soli vendita e pagamento.
