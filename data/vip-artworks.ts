export type VipArtworkMode = "commercial" | "exhibition";
export type VipArtworkFormat = "portrait" | "landscape";

type VipArtworkPrivate = {
  id: string;
  code: string;
  mediaId: string;
  sourceFile: string;
  mode: VipArtworkMode;
  format: VipArtworkFormat;
  title: string;
  lore: string;
  priceCents?: number;
};

const commercial = [
  ["broncio creepy1.png", "portrait", 1290],
  ["console1.png", "portrait", 890],
  ["death sad clown1.png", "landscape", 1790],
  ["demonnn1.png", "landscape", 1790],
  ["feto shull1.png", "portrait", 890],
  ["GiWise Devil1.png", "portrait", 1290],
  ["Immagine WhatsApp 2025-03-26 ore 15.18.12_16aed6bb.jpg", "portrait", 1290],
  ["Immagine WhatsApp 2025-03-26 ore 15.18.13_662d2973.jpg", "portrait", 1290],
  ["nun hard2.png", "portrait", 1290],
  ["trucco wilsy1.png", "portrait", 1290],
  ["xmas2.png", "portrait", 1290],
] as const;

const exhibition = [
  ["donald duck1.png", "portrait"],
  ["dragon rap1.png", "portrait"],
  ["Final Fantasy1.png", "portrait"],
  ["Gangsta Anime1.png", "portrait"],
  ["gangsta goku1.png", "portrait"],
  ["gorillaz1.png", "landscape"],
  ["kakashi1.png", "portrait"],
  ["krusty il clown1.png", "portrait"],
  ["Leone cane fifone1.png", "portrait"],
  ["Lisa Simpson1.png", "portrait"],
  ["luffy1.png", "portrait"],
  ["Mario Aura1.png", "portrait"],
  ["Marylin Manson1.png", "portrait"],
  ["mimikyu creepy1.png", "portrait"],
  ["Mr Pickles1.png", "portrait"],
  ["naruto x hinata.png", "portrait"],
  ["painnnn1.png", "portrait"],
  ["Patrik Bou1.png", "portrait"],
  ["Pikascorpion1.png", "portrait"],
  ["pokemon creepy1.png", "landscape"],
  ["Pulp Fiction1.png", "portrait"],
  ["RickWise1.png", "portrait"],
  ["sakura1.png", "portrait"],
  ["Salmo1.png", "landscape"],
  ["Samata1.png", "portrait"],
  ["sasuke1.png", "portrait"],
  ["Scoby Doo Creepy1.png", "portrait"],
  ["Sheldon Cooper1.png", "portrait"],
  ["Shining1.png", "portrait"],
  ["Silent hill1.png", "landscape"],
  ["Snorlax Creepy1.png", "portrait"],
  ["SouthPark1.png", "landscape"],
  ["Super mario zombie1.png", "portrait"],
  ["teletubbies1.png", "landscape"],
  ["The Legen of Scream1.png", "portrait"],
  ["Tom1.png", "portrait"],
  ["tsunade creepy1.png", "portrait"],
] as const;

const editorialBySource: Record<string, { title: string; lore: string }> = {
  "broncio creepy1.png": {
    title: "Il Broncio che Osserva",
    lore: "Non parla e non dimentica. Dal buio raccoglie ogni sguardo, aspettando che qualcuno abbassi gli occhi per primo.",
  },
  "console1.png": {
    title: "Ultima Partita",
    lore: "Una console rimasta accesa oltre la fine del mondo. Sullo schermo continua una partita che nessuno ricorda di aver iniziato.",
  },
  "death sad clown1.png": {
    title: "L'Ultimo Sorriso del Circo",
    lore: "Quando il tendone si svuota, il clown della morte raccoglie le risate perdute e le trasforma nel suo applauso finale.",
  },
  "demonnn1.png": {
    title: "Il Demone della Soglia",
    lore: "Non custodisce una porta: decide chi merita di attraversarla. Ogni passo verso di lui lascia qualcosa indietro.",
  },
  "feto shull1.png": {
    title: "Nato dal Teschio",
    lore: "Una vita impossibile cresce nella memoria dei morti. Il suo primo respiro potrebbe essere anche l'ultimo del mondo.",
  },
  "GiWise Devil1.png": {
    title: "Il Diavolo di GiWise",
    lore: "Un araldo nato dal tratto dell'artista, elegante e feroce. Porta con sé il marchio di un universo che non chiede permesso.",
  },
  "Immagine WhatsApp 2025-03-26 ore 15.18.12_16aed6bb.jpg": {
    title: "Eco dalla Soglia",
    lore: "Una presenza emersa da un archivio privato. Il suo vero nome resta nascosto, ma la sua ombra ha già trovato la strada.",
  },
  "Immagine WhatsApp 2025-03-26 ore 15.18.13_662d2973.jpg": {
    title: "Il Testimone Muto",
    lore: "Ha visto qualcosa che non può essere raccontato. L'opera conserva quel silenzio e lo restituisce a chi osa avvicinarsi.",
  },
  "nun hard2.png": {
    title: "La Monaca del Ferro",
    lore: "La fede è finita, la disciplina no. Avanza tra reliquie spezzate come l'ultima guardiana di un ordine dimenticato.",
  },
  "trucco wilsy1.png": {
    title: "Il Volto Dietro il Trucco",
    lore: "Ogni colore nasconde una crepa e ogni sorriso una confessione. Quando il trucco cade, resta soltanto la verità.",
  },
  "xmas2.png": {
    title: "Natale all'Ultima Fiamma",
    lore: "Le luci sono accese, ma nessuno è tornato a casa. Sotto l'albero attende un dono che non dovrebbe essere aperto.",
  },
  "donald duck1.png": {
    title: "L'Ultimo Qua-Qua",
    lore: "La rabbia diventa armatura e la sfortuna una leggenda. Anche il caos quotidiano può trasformarsi in epica.",
  },
  "dragon rap1.png": {
    title: "Rime di Drago",
    lore: "Il fuoco non esce dalla gola, ma dalle parole. Ogni verso scuote il quartiere come il battito di ali invisibili.",
  },
  "Final Fantasy1.png": {
    title: "L'Eco del Cristallo",
    lore: "Tra rovine e promesse, una luce continua a chiamare gli eroi. Nessuno sa se indichi la salvezza o l'ultima battaglia.",
  },
  "Gangsta Anime1.png": {
    title: "Sotto Neon Nemici",
    lore: "La città li osserva dalle vetrine accese. Non cercano gloria: vogliono soltanto restare in piedi fino all'alba.",
  },
  "gangsta goku1.png": {
    title: "Saiyan di Strada",
    lore: "Potere cosmico e disciplina urbana si incontrano in una posa che trasforma la strada in una nuova arena.",
  },
  "gorillaz1.png": {
    title: "Rumore dall'Altra Frequenza",
    lore: "Una band trasmette da un luogo fuori sintonia. Chi trova la frequenza giusta sente una canzone che non esiste ancora.",
  },
  "kakashi1.png": {
    title: "L'Occhio che Copia il Silenzio",
    lore: "Dietro la maschera vive la memoria di ogni tecnica osservata e di ogni compagno che non può più tornare.",
  },
  "krusty il clown1.png": {
    title: "Risata Fuori Orario",
    lore: "Lo spettacolo è finito da ore, ma la risata registrata continua. Sul palco vuoto qualcuno aspetta ancora il suo segnale.",
  },
  "Leone cane fifone1.png": {
    title: "Coraggio dopo Mezzanotte",
    lore: "La paura non scompare: cammina al suo fianco. È proprio tremando che il più improbabile degli eroi decide di restare.",
  },
  "Lisa Simpson1.png": {
    title: "La Nota Dissidente",
    lore: "Un assolo rompe il rumore della città. È una piccola ribellione suonata abbastanza forte da non poter essere ignorata.",
  },
  "luffy1.png": {
    title: "Il Re senza Corona",
    lore: "Il mare non promette nulla, eppure il sorriso resta. La libertà è il tesoro che precede ogni conquista.",
  },
  "Mario Aura1.png": {
    title: "Idraulico dell'Altrove",
    lore: "Un'energia nuova attraversa il Regno dei Funghi. Questa volta il prossimo livello non conduce in un luogo familiare.",
  },
  "Marylin Manson1.png": {
    title: "Liturgia Elettrica",
    lore: "Il palco diventa altare e il rumore una confessione collettiva. Nel riflesso dei fari, l'identità cambia forma.",
  },
  "mimikyu creepy1.png": {
    title: "Sotto il Drappo",
    lore: "Desidera essere amato, ma teme di essere visto. Il travestimento è insieme rifugio, promessa e minaccia.",
  },
  "Mr Pickles1.png": {
    title: "Il Cane che Sa",
    lore: "Agli occhi del paese è soltanto un animale fedele. Nel buio, invece, conosce tutti i nomi che nessuno osa pronunciare.",
  },
  "naruto x hinata.png": {
    title: "Tra Luna e Volpe",
    lore: "Due destini cresciuti in silenzio trovano finalmente lo stesso orizzonte, lontano dal rumore della battaglia.",
  },
  "painnnn1.png": {
    title: "Il Dolore che Giudica",
    lore: "Chi ha conosciuto la perdita pretende di insegnarla al mondo. La pace imposta porta sempre il suono di una rovina.",
  },
  "Patrik Bou1.png": {
    title: "Stella dal Fondo",
    lore: "Dal fondale arriva una creatura troppo allegra per accorgersi del buio. Forse è ingenuità, forse resistenza.",
  },
  "Pikascorpion1.png": {
    title: "Fulmine dello Shirai Ryu",
    lore: "Elettricità e vendetta si fondono in un guerriero impossibile. La sua catena colpisce prima ancora del tuono.",
  },
  "pokemon creepy1.png": {
    title: "La Regione Perduta",
    lore: "Le creature sono ancora lì, ma qualcosa ha riscritto le regole. Ogni incontro nell'erba alta ora sembra un avvertimento.",
  },
  "Pulp Fiction1.png": {
    title: "Dopo la Danza",
    lore: "La musica è finita e la notte deve ancora presentare il conto. Un istante sospeso prima che tutto torni a esplodere.",
  },
  "RickWise1.png": {
    title: "Portale GiWise",
    lore: "Una deviazione nell'universo sbaglia coordinate e approda nell'archivio. La scienza sostiene che sia un incidente.",
  },
  "sakura1.png": {
    title: "Petali sulla Battaglia",
    lore: "La forza non cancella la delicatezza. Ogni colpo porta con sé anni di disciplina e promesse non dimenticate.",
  },
  "Salmo1.png": {
    title: "Predicatore Urbano",
    lore: "La voce attraversa cemento, palco e coscienza. Non offre risposte: amplifica le domande che la città nasconde.",
  },
  "Samata1.png": {
    title: "Samata, Fuori dal Tempo",
    lore: "Una figura sospesa tra memoria e invenzione. Il suo sguardo sembra ricordare una storia che deve ancora accadere.",
  },
  "sasuke1.png": {
    title: "L'Erede della Folgore",
    lore: "Porta il peso del nome come una lama. Ogni scintilla illumina per un istante la strada scelta nella solitudine.",
  },
  "Scoby Doo Creepy1.png": {
    title: "Mistero Senza Maschera",
    lore: "Questa volta il mostro non è un uomo travestito. Il corridoio finisce, le impronte continuano e nessuno vuole dividersi.",
  },
  "Sheldon Cooper1.png": {
    title: "L'Equazione Impossibile",
    lore: "Ogni fenomeno dovrebbe avere una spiegazione. Sul vetro, però, resta un simbolo che nessuna lavagna riesce a contenere.",
  },
  "Shining1.png": {
    title: "Stanza 237",
    lore: "L'albergo conserva ogni inverno tra le sue pareti. La porta è chiusa, ma dall'altra parte qualcuno ha appena girato la chiave.",
  },
  "Silent hill1.png": {
    title: "La Sirena nella Nebbia",
    lore: "Quando l'allarme risuona, la città cambia pelle. La nebbia non nasconde il pericolo: gli permette di avvicinarsi.",
  },
  "Snorlax Creepy1.png": {
    title: "Il Sonno che Divora",
    lore: "Dormiva da così tanto tempo che il sogno ha iniziato a nutrirsi del mondo sveglio. Ora qualcosa si muove sotto le palpebre.",
  },
  "SouthPark1.png": {
    title: "Nevicata Tossica",
    lore: "La piccola città sopravvive a un altro giorno assurdo. Sotto la neve, però, questa volta cresce qualcosa che non fa ridere.",
  },
  "Super mario zombie1.png": {
    title: "Regno dei Non Morti",
    lore: "I tubi sono ostruiti e i castelli sono vuoti. Rimane una sola vita per attraversare un regno che non riconosce più i suoi eroi.",
  },
  "teletubbies1.png": {
    title: "Il Sole non Sorride Più",
    lore: "La collina è immobile e gli altoparlanti ripetono lo stesso richiamo. Nessuno ricorda quando il cielo abbia smesso di cambiare.",
  },
  "The Legen of Scream1.png": {
    title: "La Maschera di Hyrule",
    lore: "Una leggenda cambia volto e il richiamo dell'avventura diventa una telefonata nella notte. Rispondere costa più di un cuore.",
  },
  "Tom1.png": {
    title: "Nove Vite in Meno",
    lore: "L'inseguimento continua oltre ogni caduta. Questa volta, però, il corridoio conduce in un luogo da cui nessun gatto è tornato.",
  },
  "tsunade creepy1.png": {
    title: "La Quinta Ombra",
    lore: "La guaritrice conosce il prezzo di ogni ferita. Nel suo sguardo, la forza e il lutto hanno imparato a convivere.",
  },
};

export const VIP_ARTWORKS_PRIVATE: VipArtworkPrivate[] = [
  ...commercial.map(([sourceFile, format, priceCents], index) => ({
    id: `vip-art-${String(index + 1).padStart(3, "0")}`,
    code: `LW-VIP-ART-${String(index + 1).padStart(3, "0")}`,
    mediaId: `vip-art-preview-${String(index + 1).padStart(3, "0")}`,
    sourceFile,
    mode: "commercial" as const,
    format,
    ...editorialBySource[sourceFile],
    priceCents,
  })),
  ...exhibition.map(([sourceFile, format], index) => {
    const position = commercial.length + index + 1;
    return {
      id: `vip-art-${String(position).padStart(3, "0")}`,
      code: `LW-VIP-EXH-${String(index + 1).padStart(3, "0")}`,
      mediaId: `vip-art-preview-${String(position).padStart(3, "0")}`,
      sourceFile,
      mode: "exhibition" as const,
      format,
      ...editorialBySource[sourceFile],
    };
  }),
];

export const VIP_ARTWORKS = VIP_ARTWORKS_PRIVATE.map((privateArtwork) => {
  const { sourceFile, ...artwork } = privateArtwork;
  void sourceFile;
  return artwork;
});

export const VIP_ART_DROP = {
  code: "LW-VIP-ART-DROP-01",
  title: "Archivio d'arte riservato",
  subtitle: "Opere originali e selezioni speciali per chi sostiene LoreWise.",
  introduction: "Una raccolta distinta dall'area pubblica: anteprime protette, condizioni riservate sugli originali commerciabili e una sala espositiva dedicata alle opere non in vendita.",
  commercialCount: commercial.length,
  exhibitionCount: exhibition.length,
  featuredCode: "LW-VIP-ART-003",
  rightsNote: "Le opere in esposizione non sono offerte in vendita. Eventuali riferimenti a personaggi, persone o marchi restano dei rispettivi titolari.",
} as const;
