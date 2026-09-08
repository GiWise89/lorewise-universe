# Verifica Famigli — 8 settembre 2026

## Completato in locale

1. Quattro minigiochi: approvati dall'utente, grafica PNG generata, musica ed effetti, record separati e premio giornaliero condiviso.
2. Percorso: mappa illustrata, tappe completate/mancanti, collegamenti alle attività e tesoro con contenuto esplicito.
3. Album: stagioni, filtri, sagome mancanti, date relative al lancio e premio reale del set.
4. Recupero ricordi: confermato e implementato dopo l’anno, un ricordo mancante ogni sette nuove presenze consecutive, in ordine di settimana e senza doppioni. Nessun costo, moneta o consumabile extra. Serie interrotta azzerata; set completati sbloccano la cover. Registro, Album e guida aggiornati.
5. Controlli automatici: 417 test Famigli passati dopo le integrazioni, TypeScript senza errori. Inclusi riscatto ripetuto, serie interrotta, confine annuale e recupero di tutti i 52 ricordi. Salvataggio aggiornato per attendere un invio già in corso e ritentare dopo errori di rete/5xx/429. Il controllo sui tentativi di rete è statico: non equivale a una prova di riconnessione autenticata.
7. Guida interna e pagina `/giochi/nexus-pet` aggiornate con i quattro giochi, audio, percorso, album e regole dei premi. Rimossa la promessa inesatta di un tema di mappa diverso ogni settimana.

## Non completato / richiede intervento

6. Prova visiva e audio su dispositivi: l'inventario CUA restituisce zero browser e zero app. Controlli automatici e HTTP non dimostrano assenza di sovrapposizioni sul telefono, qualità percepita dell'audio o corretta sincronizzazione tra due dispositivi autenticati.
8. Pubblicazione: non eseguita; resta richiesta approvazione esplicita.

## Link locali

- Recupero pronto al settimo giorno: `http://192.168.1.7:3016/famiglio?preview=home&recovery=ready` (HTTP 200; simulazione isolata senza salvataggio account)
- Casa e giochi: `http://192.168.1.7:3016/famiglio?preview=home&minigame=1&attendance=0`
- Percorso/Album: `http://192.168.1.7:3016/famiglio?preview=progression&attendance=0`
- Guida: `http://192.168.1.7:3016/giochi/nexus-pet`

Su desktop sostituire l'IP con `localhost`. L'anteprima non prova il salvataggio cloud di un utente autenticato.
