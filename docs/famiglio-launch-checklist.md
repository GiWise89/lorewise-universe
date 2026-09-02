# Famigli del Nexus — checklist di attivazione

Questa checklist prepara il rilascio ma non autorizza alcuna pubblicazione.

## Blocco obbligatorio prima del rilascio

- Eseguire il backup del database e conservare il file fuori dalla cartella di distribuzione.
- Applicare in staging le migrazioni `0028`, `0029` e `0030` nell'ordine indicato.
- Eseguire `npm.cmd run test:famiglio`, `npm.cmd run audit:famiglio-release`, `npm.cmd run audit:famiglio-balance`, `npm.cmd run audit:database` e `npm.cmd run build`.
- Verificare adozione, sincronizzazione, conflitto tra due dispositivi e cancellazione con un LoreWise ID di prova.
- Verificare missioni, ledger monete, uscite reali da 5/10/15 minuti e ricompense una sola volta.
- Eseguire un pagamento Stripe test per ogni categoria Famiglio, verificando ordine, ricevuta, diritto, consegna e revoca dopo rimborso.
- Controllare manualmente tutte le specie, palette, azioni, look e cinque fasi dei cinque ambienti su desktop e smartphone reali.
- Verificare tastiera, focus, etichette dei controlli, contrasto e modalità movimento ridotto.
- Ottenere il permesso esplicito del proprietario prima di qualunque deploy o attivazione pubblica.

## Rollback

1. Disattivare i prodotti Famiglio nel catalogo commerciale.
2. Ripristinare il deploy precedente senza cancellare le tabelle.
3. Conservare `nexus_familiars`, missioni, eventi economici e sincronizzazioni per il recupero.
4. Se necessario, ripristinare il database dal backup verificato.
5. Riconciliare gli ordini Stripe test o reali prima di riaprire lo shop.

## Limiti intenzionali

- Le notifiche browser vengono abilitate soltanto dopo consenso esplicito.
- Gli sconti Famiglio non si sommano: viene applicato il vantaggio migliore.
- Abbonamenti, spedizioni e promozioni migliori restano esclusi dagli sconti Famiglio.
- La pubblicazione resta bloccata fino all'approvazione esplicita.
