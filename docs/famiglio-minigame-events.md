# Situazioni speciali dei minigiochi

Implementazione locale del 13 settembre 2026, approvata da Luigi. Nessuna durata massima: tutti i quattro giochi terminano esaurendo le tre vite. La difficoltà aumenta ogni 10 secondi di gioco attivo; pausa e scheda nascosta fermano l'avanzamento.

- **Lucciola dorata:** prima occasione dopo 12 secondi, poi ogni 12 secondi. Compare solo quando c'è spazio libero e abbastanza tempo per reagire, insieme alla normale. Vale 3 punti una sola volta. Ignorarla non costa vite; la normale mantiene la propria scadenza. Catturare la normale chiude l'occasione dorata. Le trappole rispettano la distanza dalla dorata.
- **Pioggia di stelle:** circa ogni 20 secondi, dopo che gli oggetti precedenti hanno terminato la caduta. Sei stelle seguono un percorso fra corsie adiacenti; ogni stella ha una spina contemporanea su una corsia diversa. I percorsi alternano direzione. La velocità rimane coerente all'interno della serie, poi segue di nuovo il livello corrente.
- **Rune specchio:** dal ritmo 3, ogni terzo turno completato richiede l'ordine inverso. L'annuncio precede la sequenza di 1,6 secondi; la regola resta visibile e non cambia dopo un errore. Non c'è una scadenza per rispondere.
- **Guardiani:** l'intero roster continua a ruotare senza ripetizioni premature. Il comportamento è associato stabilmente al personaggio: sentinella immobile, pattuglia con movimento limitato sulla piattaforma, evocatore con runa a terra. Movimento e pericolo della runa iniziano solo dopo l'avviso di un secondo. La distanza di preavviso cresce con la velocità. Gli impatti mantengono il feedback rosso e l'invulnerabilità temporanea.
- **Cambio di ritmo:** fascia dedicata e breve suono originale, rispettando audio disattivato e pausa. La fascia non copre bersagli o comandi.

Le ricompense giornaliere e il loro limite restano quelli esistenti. Grafica dei giochi e personaggi riutilizzata; la dorata è una variante di presentazione dell'icona della lucciola, la runa dei guardiani è un indicatore dell'area pericolosa.

Verifiche: test di eventi, progressione, vite, roster, collisioni, record e ricompense; TypeScript; lint mirato. I test degli eventi verificano punti singoli, bonus facoltativo, percorso raccoglibile, ordine inverso e preavviso dei pericoli.

## Evocatori: spazio necessario per il salto

Runa a 16 unità dal guardiano e posizione centrata sulla piattaforma. La runa compare ed è pericolosa solo se la piattaforma offre spazio per un salto completo, con margini di decollo e atterraggio e considerando anche un prossimo aumento di velocità. Se manca spazio resta il solo guardiano. Test con la fisica reale verificano decollo, superamento di entrambe le collisioni e atterraggio senza perdere vite, variando piattaforma, velocità e momento del salto.
