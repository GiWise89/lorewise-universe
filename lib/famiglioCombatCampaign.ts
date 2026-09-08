import type { FamiliarCombatDifficulty, FamiliarCombatProgress } from "./famiglioCombat.ts";

export type FamiliarCampaignRank = "reietto" | "predone" | "custode" | "araldo" | "boss";
export type FamiliarCampaignObjective = "duello" | "resistenza" | "rapidita" | "status" | "boss-fasi";

export type FamiliarCampaignLevel = {
  id: `campaign-${string}`;
  number: number;
  chapter: number;
  title: string;
  arenaSrc: string;
  circuitId: "prime-orme" | "bosco-risonanze" | "grotte-celesti" | "rovine-arcane" | "valle-titani" | "soglia-leggendaria";
  difficulty: FamiliarCombatDifficulty;
  opponentLevel: number;
  opponentIds: readonly [string, string];
  corruptionIntensity: number;
  objective: FamiliarCampaignObjective;
  objectiveLabel: string;
  turnLimit: number | null;
  bossPhases: number;
  npc: {
    name: string;
    title: string;
    rank: FamiliarCampaignRank;
    spriteSrc: string;
    costumeHue: number;
  };
  introLine: string;
  victoryLine: string;
  defeatLine: string;
};

const arenas = [
  "/famiglio/rebuild/combat/campaign/arenas/01-cortile-reietti-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/02-passaggio-velo-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/03-sala-custodi-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/04-forgia-araldi-v1.webp",
  "/famiglio/rebuild/combat/campaign/arenas/05-trono-nulla-v1.webp",
] as const;

const definitions = [
  ["Il primo guinzaglio", "Grin", "Raccoglitore del Vuoto", "reietto", ["fiddle-dog", "guardian-rabbit"], 2, "prime-orme", "Il Nexus ci ha lasciati ai margini. Ora prenderemo il tuo Legame."],
  ["Orme nella cenere", "Murka", "Battitrice di sentieri", "reietto", ["fox", "wolf"], 4, "prime-orme", "Il tuo compagno segue ancora la tua voce. Vediamo per quanto."],
  ["Il collare spezzato", "Skarn", "Custode rinnegato", "reietto", ["kappa", "slime"], 6, "prime-orme", "Ogni promessa si spezza. La vostra comincerà qui."],
  ["Capobranco dei reietti", "Vorga", "Capobranco reietto", "reietto", ["demon-rabbit", "nexus-bat"], 9, "prime-orme", "I miei reietti hanno fame. Il vostro coraggio basterà per tutti?"],
  ["Il ponte del velo", "Kaien", "Predone silente", "predone", ["griffin", "owlbear"], 11, "bosco-risonanze", "Un solo passo falso e il Velo vi terrà per sempre."],
  ["Lama senza alba", "Rei", "Duellante del crepuscolo", "predone", ["faerie-dragon", "blue-wyrmling"], 13, "bosco-risonanze", "Non temo la forza. Temo soltanto chi sa aspettare."],
  ["Maschere sul sentiero", "Jinra", "Predone delle cento maschere", "predone", ["frost-salamander", "displacer-beast"], 15, "bosco-risonanze", "Quale volto avrà il tuo Famiglio quando perderà?"],
  ["Signore del passaggio", "Shirok", "Maestro del Velo", "predone", ["beholder", "hellhound"], 18, "bosco-risonanze", "Ho chiuso ogni via d'uscita. Resta soltanto il duello."],
  ["La formula infranta", "Elyra", "Custode senza sigillo", "custode", ["young-green-dragon", "ice-golem"], 20, "grotte-celesti", "Il Legame è un'equazione. Io ne cancellerò il risultato."],
  ["Archivio proibito", "Maled", "Bibliotecario del Nulla", "custode", ["bulette", "purple-worm"], 22, "grotte-celesti", "Ho letto la fine di questa storia. Tu non eri nell'ultima pagina."],
  ["Lezione di corruzione", "Sivra", "Maestra delle catene", "custode", ["velociraptor", "dilophosaurus"], 24, "rovine-arcane", "La volontà si addestra. Anche quella che crede di essere libera."],
  ["Il custode spezzato", "Orun", "Decano decaduto", "custode", ["spinosaurus", "carnotaurus"], 27, "rovine-arcane", "Un tempo difendevo il Nexus. Ora conosco tutte le sue debolezze."],
  ["Ferro e brace", "Draeven", "Araldo della forgia", "araldo", ["adult-red-dragon", "ancient-black-dragon"], 29, "valle-titani", "Nella mia forgia, perfino i ricordi diventano armi."],
  ["Marcia delle armature", "Khar", "Comandante delle ceneri", "araldo", ["tyrannosaurus", "ankylosaurus"], 32, "valle-titani", "Non affronti un guerriero. Affronti tutti quelli caduti prima di te."],
  ["La fiamma corrotta", "Vael", "Araldo cremisi", "araldo", ["hellhound", "displacer-beast"], 35, "valle-titani", "La corruzione non distrugge la forza. La rende obbediente."],
  ["Generale del Nulla", "Mordrek", "Primo Araldo", "araldo", ["ancient-black-dragon", "beholder"], 38, "soglia-leggendaria", "Inginocchiati e il tuo Famiglio conserverà almeno il proprio nome."],
  ["Sussurri dal trono", "Nhal", "Araldo dell'ultima soglia", "boss", ["purple-worm", "bulette"], 41, "soglia-leggendaria", "Ogni vittoria vi ha condotti esattamente dove volevo."],
  ["Il coro dei perduti", "Sevrath", "Lich delle voci", "boss", ["adult-red-dragon", "ice-golem"], 44, "soglia-leggendaria", "Ascolta: sono i Custodi che hanno creduto di potermi fermare."],
  ["Erede della notte", "Azrakar", "Principe della corruzione", "boss", ["ancient-black-dragon", "hellhound"], 47, "soglia-leggendaria", "Il Nexus avrà un nuovo erede. Il tuo Legame sarà la mia corona."],
  ["Il cuore del Nulla", "Morvane", "Sovrano del Legame Corrotto", "boss", ["beholder", "ancient-black-dragon"], 50, "soglia-leggendaria", "Non sono il termine del vostro viaggio. Sono ciò che vi aspettava dall'inizio."],
] as const;

const rankTitle: Record<FamiliarCampaignRank, string> = {
  reietto: "Reietto",
  predone: "Predone del Velo",
  custode: "Custode spezzato",
  araldo: "Araldo della Corruzione",
  boss: "Signore del Nulla",
};

export const FAMILIAR_COMBAT_CAMPAIGN: readonly FamiliarCampaignLevel[] = definitions.map((entry, index) => {
  const [title, npcName, npcTitle, rank, opponentIds, opponentLevel, circuitId, introLine] = entry;
  const chapter = Math.floor(index / 4) + 1;
  const difficulty: FamiliarCombatDifficulty = index < 7 ? "normal" : index < 14 ? "expert" : "nexus";
  const bossLevel = (index + 1) % 4 === 0;
  const objective: FamiliarCampaignObjective = bossLevel ? "boss-fasi" : index % 5 === 1 ? "rapidita" : index % 5 === 2 ? "status" : index % 5 === 3 ? "resistenza" : "duello";
  const objectiveLabel = objective === "boss-fasi"
    ? "Spezza tutte le fasi del comandante"
    : objective === "rapidita"
      ? "Vinci prima dello scadere dei turni"
      : objective === "status"
        ? "Controlla il ritmo con effetti di stato"
        : objective === "resistenza"
          ? "Resisti all'assalto e poi contrattacca"
          : "Sconfiggi il Famiglio corrotto";
  return {
    id: `campaign-${String(index + 1).padStart(2, "0")}`,
    number: index + 1,
    chapter,
    title,
    arenaSrc: arenas[chapter - 1],
    circuitId: circuitId as FamiliarCampaignLevel["circuitId"],
    difficulty,
    opponentLevel,
    opponentIds,
    corruptionIntensity: .35 + index / 28,
    objective,
    objectiveLabel,
    turnLimit: objective === "rapidita" ? Math.max(6, 12 - Math.floor(index / 5)) : objective === "resistenza" ? 14 : null,
    bossPhases: bossLevel ? Math.min(3, 2 + Math.floor(index / 12)) : 1,
    npc: {
      name: npcName,
      title: npcTitle || rankTitle[rank],
      rank,
      spriteSrc: `/famiglio/rebuild/combat/campaign/npcs/distinct-v3/${String(index + 1).padStart(2, "0")}-${String(npcName).toLowerCase()}.png`,
      costumeHue: 0,
    },
    introLine,
    victoryLine: index === 19 ? "Il Nulla arretra. Il vostro Legame ha scelto di restare libero." : "Avete superato questa soglia, ma la corruzione vi sta già osservando.",
    defeatLine: "Il vostro Legame resiste. Tornate più forti: io sarò ancora qui.",
  };
});

export function familiarCampaignLevelById(id: string | null | undefined) {
  return FAMILIAR_COMBAT_CAMPAIGN.find((level) => level.id === id) ?? null;
}

export function familiarCampaignOpponent(level: FamiliarCampaignLevel, playerId: string) {
  return level.opponentIds.find((id) => id !== playerId) ?? level.opponentIds[0];
}

export function familiarCampaignIsComplete(progress: FamiliarCombatProgress, level: FamiliarCampaignLevel) {
  return progress.completedEncounters.includes(level.id);
}

export function familiarCampaignIsUnlocked(progress: FamiliarCombatProgress, level: FamiliarCampaignLevel, testMode = false) {
  if (testMode || level.number === 1) return true;
  return progress.completedEncounters.includes(FAMILIAR_COMBAT_CAMPAIGN[level.number - 2]?.id ?? "");
}
