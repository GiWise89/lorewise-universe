export type StudioArea = {
  code: string;
  title: string;
  description: string;
  destination: string;
};

export type DevelopmentStage = {
  number: string;
  title: string;
  description: string;
  publicMaterial: string;
};

export type AccessModel = {
  label: string;
  title: string;
  description: string;
  note: string;
};

export const studioAreas: StudioArea[] = [
  {
    code: "01",
    title: "Giochi in sviluppo",
    description: "Schede complete per seguire concept, sistemi di gioco, avanzamento dei lavori e prossimi obiettivi.",
    destination: "Catalogo progetti",
  },
  {
    code: "02",
    title: "Esperienze giocabili",
    description: "Demo online, versioni gratuite e giochi acquistabili, con piattaforme e requisiti dichiarati con chiarezza.",
    destination: "Area gioca e scarica",
  },
  {
    code: "03",
    title: "App GiWise Studio",
    description: "Applicazioni creative e strumenti digitali raccolti nello stesso archivio, senza confonderli con i videogiochi.",
    destination: "Catalogo applicazioni",
  },
  {
    code: "04",
    title: "Diario dello studio",
    description: "Aggiornamenti, anteprime, note di versione e decisioni di progettazione raccontate durante lo sviluppo.",
    destination: "Notizie e versioni",
  },
];

export const developmentStages: DevelopmentStage[] = [
  {
    number: "I",
    title: "Concept e identità",
    description: "L’idea viene definita attraverso genere, atmosfera, pubblico, piattaforme e caratteristiche principali.",
    publicMaterial: "Concept, presentazione e prime immagini approvate",
  },
  {
    number: "II",
    title: "Prototipo e sistemi",
    description: "Le meccaniche vengono costruite e verificate prima di presentare promesse o date non attendibili.",
    publicMaterial: "Video brevi, prove di interfaccia e diario tecnico",
  },
  {
    number: "III",
    title: "Anteprima e test",
    description: "Quando il progetto è sufficientemente stabile può aprirsi a demo, test controllati e raccolta dei riscontri.",
    publicMaterial: "Demo, requisiti, questionario e problemi conosciuti",
  },
  {
    number: "IV",
    title: "Uscita e continuità",
    description: "La pubblicazione non chiude il progetto: versioni, correzioni, assistenza e contenuti restano documentati.",
    publicMaterial: "Download, acquisto, cronologia versioni e supporto",
  },
];

export const accessModels: AccessModel[] = [
  {
    label: "Accesso libero",
    title: "Gratis",
    description: "Esperienze complete o dimostrative disponibili senza acquisto, con condizioni e piattaforme sempre visibili.",
    note: "Il pulsante di accesso apparirà soltanto quando il file o la versione online saranno realmente pronti.",
  },
  {
    label: "Licenza personale",
    title: "Acquistabile",
    description: "Titoli a pagamento con prezzo, contenuto incluso, aggiornamenti e modalità di consegna indicati nella scheda.",
    note: "Nessun acquisto simulato: il collegamento verrà attivato insieme al sistema di pagamento reale.",
  },
  {
    label: "Evoluzione futura",
    title: "Universe Pass",
    description: "I giochi indicati come inclusi saranno accessibili senza costo aggiuntivo finché l’abbonamento LoreWise rimane attivo, senza eliminare l’acquisto permanente.",
    note: "Il LoreWise ID riconoscerà automaticamente il piano attivo; alla scadenza i salvataggi resteranno conservati anche se l’accesso incluso termina.",
  },
];

export const projectDossierFields = [
  "Titolo e identità visiva ufficiale",
  "Genere, piattaforme e pubblico consigliato",
  "Stato reale dello sviluppo e data dell’ultimo aggiornamento",
  "Galleria, video e anteprime approvate",
  "Modalità di accesso: gratis, demo, acquisto o abbonamento",
  "Requisiti, versione, lingua e assistenza",
  "Diario di sviluppo e cronologia degli aggiornamenti",
  "Recensioni e reazioni degli utenti registrati",
];
