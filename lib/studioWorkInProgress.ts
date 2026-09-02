export type StudioWorkStage = {
  number: string;
  label: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  width: number;
  height: number;
};

export type StudioWorkInProgress = {
  code: string;
  status: string;
  title: string;
  inspiration: string;
  introduction: string;
  direction: string;
  attribution: string;
  stages: StudioWorkStage[];
};

export const obsessionWorkInProgress: StudioWorkInProgress = {
  code: "GIWISE-WIP-OBSESSION-NIKKI-01",
  status: "Disegno in lavorazione",
  title: "Obsession — il volto di Nikki",
  inspiration: "Fan art non ufficiale ispirata al film horror Obsession di Curry Barker",
  introduction: "Tre passaggi mostrano come il ritratto di Nikki prende forma: prima lo sguardo, poi la figura e infine la presenza che cambia la lettura dell’intera scena.",
  direction: "Il film trasforma un desiderio romantico in qualcosa di oscuro e imprevedibile. Il disegno segue la stessa tensione senza anticipare la storia: un volto riconoscibile rimane al centro mentre ciò che gli sta intorno diventa sempre meno rassicurante.",
  attribution: "Disegno e interpretazione GiWise Studio · personaggio e film appartengono ai rispettivi titolari",
  stages: [
    {
      number: "01",
      label: "Impostazione",
      title: "Lo sguardo arriva per primo",
      description: "La linea iniziale costruisce espressione, capelli e direzione del volto lasciando ancora aperta la parte destra della figura.",
      image: "/novita/obsession/nikki-linea-iniziale.webp",
      imageAlt: "Prima fase del disegno di Nikki da Obsession, con volto e capelli ancora parzialmente tracciati",
      width: 704,
      height: 966,
    },
    {
      number: "02",
      label: "Figura",
      title: "Nikki occupa la scena",
      description: "Il ritratto completo definisce postura, abito, collana e contrasto nero su bianco, mantenendo lo sguardo come punto di tensione.",
      image: "/novita/obsession/nikki-ritratto-completo.webp",
      imageAlt: "Seconda fase del disegno, con il ritratto completo di Nikki in bianco e nero",
      width: 649,
      height: 920,
    },
    {
      number: "03",
      label: "Composizione attuale",
      title: "La presenza emerge alle spalle",
      description: "L’ultima fase disponibile aggiunge una seconda figura e trasforma il ritratto in una scena horror ancora in evoluzione.",
      image: "/novita/obsession/nikki-presenza-emersa.webp",
      imageAlt: "Terza fase del disegno, con Nikki in primo piano e una presenza inquietante alle sue spalle",
      width: 472,
      height: 681,
    },
  ],
};
