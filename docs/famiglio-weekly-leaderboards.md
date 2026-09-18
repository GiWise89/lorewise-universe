# Classifiche settimanali dei minigiochi

Quattro classifiche distinte: luce, nuvole, acchiappa-oggetti e rune. Ogni account ha un solo miglior record per gioco e settimana. Settimane da lunedì alle 00:00 fino al lunedì successivo, fuso Europe/Rome, compresi i cambi di ora legale. Una partita iniziata prima della chiusura conta nella settimana in cui il server ne registra la conclusione.

Ordinamento: punteggio decrescente, istante del raggiungimento crescente, identificativo account come spareggio tecnico deterministico in caso di istanti identici. Nessun premio per zero punti. La pagina mostra i primi 20 e la posizione personale se esterna ai primi 20. Pubblicato solo lo username, con nome generico Custode se assente, mai email o campi privati del profilo.

Il primo di ogni gioco ottiene 100 Monete Nexus; un account può vincere più giochi. Le settimane concluse sono finalizzate alla prima lettura successiva; i premi restano in archivio e vengono accreditati automaticamente alla prossima sincronizzazione iniziale della Casa. Nessuna distruzione dei record storici: il cambio della settimana seleziona una nuova graduatoria vuota. La finalizzazione non richiede un processo in esecuzione continua.

## Verifica delle partite

L'avvio autenticato crea una sessione con seme casuale del server. Il client usa lo stesso motore deterministico e registra avanzamenti e comandi; alla conclusione il server ricalcola il punteggio e controlla durata e completamento. Il client non invia un punteggio da accettare sulla fiducia. Non è una protezione completa contro bot che simulano comandi validi.

Anteprima, utenti non autenticati o servizio non disponibile: allenamento escluso dalle classifiche. Fallimento di invio del risultato: avviso e pulsante per riprovare prima di uscire. Nessun azzeramento delle vite o durata massima aggiunto al gameplay. La registrazione competitiva ha un limite di 90.000 eventi e una sessione valida per un'ora; oltre quei limiti il gioco può continuare come allenamento.

## Persistenza e rilascio

Schema in `drizzle/0034_famiglio_minigame_leaderboards.sql`, anche inizializzato in modo idempotente dal servizio. PostgreSQL tramite il database Netlify già usato dal progetto. Le transazioni condividono un advisory lock per impedire inserimenti tardivi durante la finalizzazione. L'accredito blocca la riga del salvataggio e aggiorna portamonete, revisione e premio nella stessa transazione; un errore annulla entrambe le operazioni. I salvataggi concorrenti continuano a usare il controllo della revisione già presente.

Verifiche locali: ricostruzione dei punteggi, sessioni per account, invio duplicato, spareggi, record inferiori, cambio settimana/ora legale, posizione oltre i primi 20, accredito unico e rollback. I test SQL usano SQLite in memoria, adattando placeholder e primitive di lock; non sostituiscono un collaudo concorrente sul database PostgreSQL di produzione. Interfaccia controllata nell'anteprima; nessun dato reale o premio online è stato creato durante lo sviluppo.

Prima dell'attivazione pubblica, verificare una partita autenticata e un accredito su database di staging. Pubblicazione e modifica del database di produzione restano soggette all'autorizzazione di Luigi.
