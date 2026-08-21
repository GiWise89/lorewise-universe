# Controllo dell’edizione Windows

Questa procedura non abilita acquisti o download. Serve a impedire che una build errata entri nell’archivio LoreWise.

## 1. Rapporto statico e Defender

```powershell
npm.cmd run audit:windows-installer -- "C:\percorso\The-Wound-Remembers-Setup-x.y.z.exe" --version x.y.z --defender
```

Il rapporto viene salvato in `outputs/windows-installer-audit/` e registra nome, dimensione, intestazione PE, versione, SHA-256, stato della firma e risultato Defender. Non contiene il file EXE.

## 2. Prova reale obbligatoria

- installare nel percorso Windows standard;
- verificare che si apra l’edizione desktop corretta e non una pagina, beta o progetto differente;
- controllare accesso LoreWise, schermata iniziale e caricamento delle risorse;
- chiudere e riaprire il gioco;
- provare l’aggiornamento verso una build successiva senza perdita dell’account;
- disinstallare e verificare la rimozione dell’applicazione;
- conservare versione, SHA-256 e risultato di ogni passaggio nel registro amministrativo.

## 3. Firma e avvisi Windows

Una build senza certificato commerciale deve essere dichiarata come distribuzione indipendente. Non si deve mai suggerire al cliente di disattivare SmartScreen, Defender o altri strumenti di protezione.

## 4. Consegna privata

Il modulo amministrativo accetta direttamente file fino a 150 MB. Se l’installer è più grande, il caricamento viene bloccato prima dell’invio e deve seguire la procedura multipart privata descritta in `docs/R2_PRIVATE_GAME_DELIVERY.md`. La ricevuta viene verificata dall'area amministrativa prima della quarantena. Nessun collegamento pubblico permanente è ammesso.

## 5. Attivazione commerciale

Ordine, pagamento, diritto al download e aggiornamenti restano disattivati finché tutte le voci risultano superate e viene completato un ordine di prova con un LoreWise ID autorizzato.
