export const gameSupportRoutes = [
  {
    number: "01",
    title: "Prima dell’acquisto",
    description: "Requisiti, compatibilità, prezzo totale, licenza e stato della build devono essere leggibili nella scheda del gioco prima di qualsiasi pagamento.",
    action: "Controlla l’edizione Windows",
    href: "/giochi/the-wound-remembers#edizione-windows",
  },
  {
    number: "02",
    title: "Dopo l’ordine",
    description: "Ricevuta, licenza, installer e richieste di assistenza restano riuniti nello stesso LoreWise ID, senza collegamenti pubblici permanenti.",
    action: "Apri il tuo archivio",
    href: "/account",
  },
  {
    number: "03",
    title: "Problema tecnico",
    description: "Nome file, versione, sistema Windows, messaggio visualizzato e passaggi già provati aiutano GiWise Studio a ricostruire il problema senza chiedere dati sensibili.",
    action: "Prepara la segnalazione",
    href: "/assistenza-giochi#segnalazione",
  },
  {
    number: "04",
    title: "Recesso o difetto",
    description: "La richiesta viene registrata sull’ordine e valutata separando il ripensamento dal problema di conformità del contenuto digitale.",
    action: "Leggi le condizioni",
    href: "/condizioni-vendita-giochi",
  },
] as const;

export const gameIssueChecklist = [
  "Codice ordine e LoreWise ID usato per l’acquisto",
  "Versione del gioco e nome completo dell’installer",
  "Edizione e versione di Windows",
  "Testo esatto dell’errore o schermata allegata",
  "Momento in cui si verifica e passaggi per riprodurlo",
] as const;

export const gameSalesClauses = [
  {
    number: "01",
    title: "Informazioni prima del pagamento",
    text: "La pagina di acquisto dovrà mostrare identità del venditore, caratteristiche principali, prezzo totale, requisiti tecnici, compatibilità, modalità di consegna, durata del supporto e condizioni applicabili. Il comando finale indicherà in modo inequivocabile che l’ordine comporta un pagamento.",
  },
  {
    number: "02",
    title: "Consegna digitale protetta",
    text: "Dopo la conferma del pagamento, il diritto al download verrà associato al LoreWise ID dell’acquirente. Il file resterà in un archivio privato e sarà accompagnato da versione, dimensione e impronta SHA-256 verificabile.",
  },
  {
    number: "03",
    title: "Diritto di recesso",
    text: "Per i contratti a distanza il consumatore dispone normalmente di 14 giorni. Per avviare subito il download di un contenuto digitale non fornito su supporto materiale, l’eventuale perdita del diritto di recesso richiede consenso espresso, riconoscimento esplicito e conferma contrattuale su supporto durevole. Questa scelta non verrà preselezionata.",
  },
  {
    number: "04",
    title: "Conformità e rimedi",
    text: "La rinuncia al recesso non elimina la garanzia legale. Se il gioco è difettoso, diverso da quanto dichiarato o non funziona secondo i requisiti comunicati, resta disponibile il percorso previsto dalla legge: ripristino della conformità e, nei casi applicabili, riduzione del prezzo o risoluzione del contratto.",
  },
  {
    number: "05",
    title: "Aggiornamenti e assistenza",
    text: "Gli aggiornamenti necessari e la durata del supporto verranno dichiarati nella scheda dell’edizione. Ogni richiesta sarà collegata all’ordine; l’assistenza non chiederà mai di disattivare antivirus, SmartScreen o altre protezioni di Windows.",
  },
  {
    number: "06",
    title: "Rimborsi tracciabili",
    text: "Una richiesta di rimborso apre una valutazione e non restituisce automaticamente denaro. Decisione, comunicazioni, eventuale revoca del diritto di download e rimborso sul metodo di pagamento originario dovranno essere registrati nello stesso ordine.",
  },
] as const;
