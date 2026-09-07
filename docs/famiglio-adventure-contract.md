# Contratto Famigli: crescita, spedizioni e combattimento

## Ambito

- Il sistema copre tutti i 53 Famigli del catalogo Medusa, inclusi i 12 dinosauri.
- Ogni Famiglio conserva progressione, esperienza, vittorie e spedizioni separatamente.
- Le regole e l'interfaccia sono originali del Nexus: il riferimento ai giochi di creature a turni riguarda solo la chiarezza del ritmo, non nomi, creature, mosse o regole protette di terzi.

## Crescita

- Cucciolo: stadio iniziale.
- Giovane: almeno 120 XP legame e 3 giorni di cura.
- Adulto: almeno 320 XP legame e 10 giorni di cura.
- L'esperienza da sola non sostituisce i giorni di cura.
- Ogni stadio possiede asset Casa e combattimento propri; il passaggio di stadio non modifica l'identità, i colori o l'anatomia riconoscibile del Famiglio.

## Spedizioni

- Bosco del Crepuscolo: 5 minuti, accessibile da Cucciolo.
- Giardini Astrali: 10 minuti, accessibile da Giovane.
- Cripta delle Memorie: 15 minuti, accessibile da Giovane.
- Valle Fossile: 20 minuti, accessibile da Adulto.
- Il timer è persistente e continua quando si lascia la schermata.
- Il combattimento non parte automaticamente: al termine del timer il giocatore sceglie quando affrontare il guardiano.
- Finché il Famiglio è fuori Casa, i bisogni sono sospesi e le azioni domestiche non sono utilizzabili.

## Combattimento

- Il sistema è a turni, mostra sempre la prossima intenzione del guardiano e non contiene casualità nascosta nelle ricompense.
- Cucciolo: Istinto e Guardia.
- Giovane: aggiunge la tecnica personale del Famiglio.
- Adulto: aggiunge Legame del Nexus.
- Ciascuno dei 53 Famigli ha una tecnica personale con nome distinto.
- La sconfitta non elimina il Famiglio e non sottrae oggetti: richiede soltanto un nuovo tentativo.
- Le ricompense sono riscosse una sola volta e aggiornano portafoglio, esperienza e diario.

## Regole visive permanenti

- Nessun corpo, arto, testa, coda o ala può essere tagliato dai frame o dalla scena.
- Gli sprite devono avere trasparenza netta, senza fondi o aloni bianchi.
- Tutte le pose di uno stesso Famiglio mantengono identità e stile coerenti.
- Le proporzioni naturali della specie determinano la presenza scenica: animali piccoli restano più piccoli dei cani grandi e dei dinosauri.
- Il Famiglio e i guardiani restano ancorati alla linea del terreno.
- Le animazioni usano quattro frame leggibili e velocità calme; la camminata compare soltanto durante lo spostamento.
- Desktop, schermi compatti e mobile devono mostrare scena, comandi, testo e barre senza sovrapposizioni, ritagli o scorrimento interno nascosto.

## Modalità di prova locale

- `test=all` rende disponibili valuta e accessi di collaudo soltanto su `localhost` e `127.0.0.1`.
- `growth=cucciolo|giovane|adulto` seleziona lo stadio da verificare senza essere sovrascritto dalla modalità di prova.
- `preview=adventure` apre i Sentieri; `preview=battle` apre direttamente un incontro di collaudo.
