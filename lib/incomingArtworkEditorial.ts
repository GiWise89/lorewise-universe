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
    id: "incoming-freezer-throne",
    position: 1,
    workingTitle: "Freezer · Il trono non basta",
    subject: "Freezer",
    universe: "Dragon Ball · reinterpretazione non ufficiale",
    description: "Il potere non viene mostrato attraverso il combattimento, ma nella calma di chi è già convinto di aver vinto. Il trono amplifica quella sicurezza fredda e arrogante.",
    access: "exhibition-only",
    originalFile: null,
  },
];
