export type IncomingArtworkEditorial = {
  id: string;
  position: number;
  workingTitle: string;
  subject: string;
  universe: string;
  description: string;
  access: "exhibition-only";
  originalFile: string | null;
};

// Queste schede restano fuori dal catalogo pubblico finché non sono presenti
// i file originali e non sono state generate le rispettive anteprime protette.
export const incomingArtworkEditorial: IncomingArtworkEditorial[] = [
  {
    id: "incoming-jill-valentine",
    position: 1,
    workingTitle: "Jill Valentine · Un attimo prima",
    subject: "Jill Valentine",
    universe: "Resident Evil",
    description: "Non è una posa da eroina invincibile. Jill abbassa lo sguardo e stringe il braccio come chi si concede un solo momento di stanchezza prima di rimettersi in movimento.",
    access: "exhibition-only",
    originalFile: null,
  },
  {
    id: "incoming-batman-horror",
    position: 2,
    workingTitle: "Batman · La notte ha fame",
    subject: "Batman",
    universe: "DC · reinterpretazione horror non ufficiale",
    description: "Il simbolo nato per incutere paura ai criminali finisce per diventare esso stesso una creatura della notte. La scena conserva un gesto protettivo, ma lo rende inquietante e ambiguo.",
    access: "exhibition-only",
    originalFile: null,
  },
  {
    id: "incoming-bg3-companions",
    position: 3,
    workingTitle: "Baldur’s Gate 3 · Tre strade, una compagnia",
    subject: "Lae’zel, Shadowheart e Karlach",
    universe: "Baldur’s Gate 3",
    description: "Tre compagne molto diverse condividono lo stesso ritratto senza perdere la propria identità. Diffidenza, controllo e calore convivono come accade durante un viaggio costruito sulle scelte.",
    access: "exhibition-only",
    originalFile: null,
  },
  {
    id: "incoming-freezer-throne",
    position: 4,
    workingTitle: "Freezer · Il trono non basta",
    subject: "Freezer",
    universe: "Dragon Ball · reinterpretazione non ufficiale",
    description: "Il potere non viene mostrato attraverso il combattimento, ma nella calma di chi è già convinto di aver vinto. Il trono amplifica quella sicurezza fredda e arrogante.",
    access: "exhibition-only",
    originalFile: null,
  },
  {
    id: "incoming-marilyn-monroe",
    position: 5,
    workingTitle: "Marilyn · Dietro l’icona",
    subject: "Marilyn Monroe",
    universe: "Ritratto reinterpretato",
    description: "Il rosso e l’oro richiamano l’immagine pubblica, mentre lo sguardo rimane più quieto e personale. Il ritratto prova a lasciare spazio alla persona dietro il simbolo.",
    access: "exhibition-only",
    originalFile: null,
  },
  {
    id: "incoming-eternal-sunshine",
    position: 6,
    workingTitle: "Se mi lasci ti cancello · Tra gli scaffali",
    subject: "Joel e Clementine",
    universe: "Se mi lasci ti cancello · reinterpretazione non ufficiale",
    description: "Lo stesso luogo contiene vicinanza e distanza. Nel primo momento i due si cercano; nel secondo resta il vuoto lasciato da qualcosa che sembrava impossibile dimenticare.",
    access: "exhibition-only",
    originalFile: null,
  },
];
