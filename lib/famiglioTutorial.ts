export type FamiliarGuideSection = "onboarding" | "care" | "diary" | "missions" | "market" | "adventure" | "combat" | "progression";

export type FamiliarGuidePage = {
  title: string;
  summary: string;
  points: readonly string[];
};

export type FamiliarSectionGuide = {
  id: FamiliarGuideSection;
  label: string;
  eyebrow: string;
  iconSrc: string;
  pages: readonly FamiliarGuidePage[];
};

export const FAMILIAR_GUIDES: Readonly<Record<FamiliarGuideSection, FamiliarSectionGuide>> = {
  onboarding: {
    id: "onboarding",
    label: "Primo legame",
    eyebrow: "Benvenuto nel Nexus Pet",
    iconSrc: "/famiglio/rebuild/inventory/bond-lantern.png",
    pages: [
      { title: "Scegli senza casualità", summary: "Ogni uovo mostra il Famiglio che custodisce: la scelta iniziale dipende sempre da te.", points: ["Apri un uovo per vedere specie e carattere", "Puoi tornare indietro prima della schiusa", "Nome, sesso e colore restano modificabili durante il rituale"] },
      { title: "La schiusa crea il legame", summary: "Il rituale procede automaticamente e registra il primo ricordo del vostro percorso.", points: ["Attendi le tre fasi del rituale", "Entra nella Casa quando il Famiglio è nato", "Le attività successive aumentano bisogni, legame e ricompense"] },
    ],
  },
  care: {
    id: "care",
    label: "Casa",
    eyebrow: "Cura quotidiana",
    iconSrc: "/famiglio/rebuild/inventory/bond-lantern.png",
    pages: [
      { title: "Leggi i bisogni", summary: "Fame, energia, gioia, igiene e affetto descrivono lo stato reale del Famiglio.", points: ["Le barre scendono nel tempo", "Ogni azione migliora bisogni precisi", "Le attività fuori casa sospendono il consumo dei bisogni"] },
      { title: "Azioni e Zaino", summary: "Puoi avviare una nuova cura solo quando quella in corso è terminata.", points: ["Nutri e Pulisci consumano le scorte corrispondenti", "Gioca e Pulisci richiedono Energia", "Il riposo può durare 1, 15 oppure 30 minuti"] },
      { title: "Igiene e salute", summary: "Una scia verde segnala che l’igiene è troppo bassa; se i bisogni restano critici il Famiglio può ammalarsi.", points: ["Il comando Cura compare soltanto durante la malattia", "Nora vende medicina singola e scorte da cinque", "La medicina non viene consumata se il Famiglio è già sano"] },
      { title: "Desiderio e routine", summary: "Il desiderio quotidiano indica l'azione preferita, mentre la routine premia una giornata completa.", points: ["Il desiderio assegna Monete Nexus", "La routine richiede azioni diverse", "Solo la stessa azione ripetuta due volte riposa per 2 minuti; le altre restano disponibili"] },
      { title: "Esperienza quotidiana", summary: "Le cure continuano sempre a migliorare i bisogni, mentre l'XP ottenibile dalle azioni della Casa ha un limite giornaliero.", points: ["Il limite riguarda soltanto l'XP", "Le barre possono continuare a essere curate", "Lotte, spedizioni e missioni hanno progressioni separate"] },
    ],
  },
  diary: {
    id: "diary",
    label: "Diario",
    eyebrow: "Memorie del legame",
    iconSrc: "/famiglio/rebuild/nav-diary-v1.png",
    pages: [
      { title: "I momenti importanti", summary: "Il Diario conserva desideri, evoluzioni, ricompense e giornate significative.", points: ["Le memorie più recenti compaiono per prime", "Le frecce cambiano pagina", "Le azioni ordinarie non riempiono il Diario inutilmente"] },
      { title: "Riepilogo del percorso", summary: "La testata riunisce valuta, giorni di cura, crescita e premio della routine.", points: ["Le Monete Nexus servono nel Mercato", "I giorni di cura descrivono la costanza", "Le tappe rare si sbloccano con il Legame"] },
    ],
  },
  missions: {
    id: "missions",
    label: "Missioni",
    eyebrow: "Risonanze quotidiane",
    iconSrc: "/famiglio/rebuild/nav-missions-v1.png",
    pages: [
      { title: "Tre obiettivi reali", summary: "Ogni giorno trovi un incarico facile, uno normale e uno difficile collegati alle attività effettivamente completate nel Nexus.", points: ["Comprendono LoreWise, Casa, lotte e spedizioni", "Il progresso aumenta solo dopo azioni valide", "Le difficoltà maggiori assegnano ricompense più ricche"] },
      { title: "Ricompense e aggiornamento", summary: "Oggetti e valute entrano nello Zaino dopo la riscossione.", points: ["Le missioni cambiano ogni giorno", "Puoi aggiornarle una sola volta al giorno", "Dal livello 10 si aggiunge una missione quotidiana"] },
    ],
  },
  market: {
    id: "market",
    label: "Mercato",
    eyebrow: "Corte dei mercanti",
    iconSrc: "/famiglio/rebuild/nav-market-v1.png",
    pages: [
      { title: "Tre botteghe, funzioni diverse", summary: "Nora vende provviste, Mirra oggetti arcani e Iris colori permanenti per la scocca.", points: ["Le Monete Nexus non sono denaro reale", "Informazioni spiega effetto e destinazione", "Prova non consuma valuta"] },
      { title: "Medusa e il Mercato notturno", summary: "L'Atelier presenta acquisti premium esatti; il Mercato notturno usa Sigilli e Frammenti.", points: ["Le cover premium mostrano il motivo reale", "Nessuna estrazione casuale", "Il Mercato notturno apre dalle 21:00 alle 06:00"] },
      { title: "Cover sempre utilizzabili", summary: "Cambiare cover modifica soltanto la scocca esterna del Nexus Pet.", points: ["Statistiche e progressione non cambiano", "I comandi rimangono su superfici opache e leggibili", "Una cover acquistata può essere riapplicata"] },
    ],
  },
  adventure: {
    id: "adventure",
    label: "Spedizioni",
    eyebrow: "Fuori dalla Casa",
    iconSrc: "/famiglio/rebuild/adventure/nav-sentieri-v1.png",
    pages: [
      { title: "Scegli una destinazione", summary: "Ogni spedizione indica durata, requisito e ricompense prima della partenza.", points: ["Le mete avanzate richiedono crescita", "Il Famiglio non può combattere durante il viaggio", "Tornare alla Casa non interrompe il timer"] },
      { title: "Imprevisti del viaggio", summary: "Ogni destinazione alterna tre scene narrative e sei scelte possibili con effetti diversi.", points: ["Leggi entrambe le conseguenze", "La scelta viene salvata", "Le ricompense arrivano al rientro"] },
    ],
  },
  combat: {
    id: "combat",
    label: "Lotta",
    eyebrow: "Arena dei Famigli",
    iconSrc: "/famiglio/rebuild/combat/ui/step-battaglia.png",
    pages: [
      { title: "Prepara l'incontro", summary: "Scegli Famiglio, arena, rivale, difficoltà e quattro mosse prima di entrare.", points: ["Ogni mossa mostra livello e requisito", "La mossa base non consuma energia", "Le altre tecniche richiedono energia e possono avere usi limitati"] },
      { title: "Iniziativa e turni", summary: "All'inizio entrambi lanciano due dadi: il totale più alto agisce per primo e un doppio attiva il critico d'iniziativa.", points: ["Il tiro avviene una sola volta per battaglia", "Un attacco può mancare: MISS significa zero danni", "HP a zero conclude immediatamente lo scontro"] },
      { title: "Stati e Torre", summary: "Bruciatura, rallentamento e altri stati compaiono sopra il Famiglio senza coprirlo. La Torre propone dieci piani casuali ordinati per potenza.", points: ["Piani 4 e 8: mini-boss", "Piano 10: Boss della Torre", "Cronaca e stati si aprono in schede a schermo"] },
    ],
  },
  progression: {
    id: "progression",
    label: "Percorso",
    eyebrow: "Crescita e maestria",
    iconSrc: "/famiglio/rebuild/inventory/bond-lantern.png",
    pages: [
      { title: "Tre cammini collegati", summary: "Crescita, mosse e ricompense mostrano ciò che hai ottenuto e il prossimo requisito.", points: ["Legame: XP, evoluzioni e costanza", "Esplorazione: viaggi e ricompense", "Combattimento: tecniche; ogni nuovo livello annuncia i vantaggi ottenuti"] },
      { title: "Sconti e premio finale", summary: "I bonus commerciali crescono lentamente e non si sommano a vantaggi più convenienti.", points: ["1% dal livello 10", "2% dal livello 30 e 3% al livello 50", "Al livello 50: buono unico da 15 € su una commissione"] },
    ],
  },
};

export function familiarGuide(section: FamiliarGuideSection) {
  return FAMILIAR_GUIDES[section];
}
