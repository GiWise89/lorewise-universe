import type { FamiliarCareCommand } from "./nexusFamiliarActions.ts";
import type { FamiliarBehaviorName } from "./nexusFamiliarCatalog.ts";

export type FamiliarSpeciesProfile = {
  family: string;
  preferredCare: FamiliarCareCommand;
  autonomousBehaviors: FamiliarBehaviorName[];
  careMessages: Record<FamiliarCareCommand, string>;
  departure: string;
  returnHome: string;
  preference: string;
};

const COMMON = {
  food: "Accoglie la razione con calma.",
  soap: "Si lascia lavare e torna ordinato.",
  toy: "Segue il gioco con attenzione.",
  medicine: "Accetta la cura e si rimette in forze.",
  rest: "Cerca il suo angolo tranquillo e chiude gli occhi.",
} satisfies Record<FamiliarCareCommand, string>;

const PROFILES: Record<string, FamiliarSpeciesProfile> = {
  Gatto: {
    family: "Gatto", preferredCare: "rest", autonomousBehaviors: ["sit", "groom", "rest"],
    careMessages: { ...COMMON, food: "Annusa la ciotola, poi mangia con piccoli bocconi.", toy: "Insegue il gioco e si ferma quando decide lui.", rest: "Si acciambella nel punto più quieto della tana." },
    departure: "Controlla la soglia due volte, poi esce con passo silenzioso.", returnHome: "Rientra senza rumore e deposita la scoperta vicino a te.", preference: "Ama la quiete, l'igiene e i giochi brevi.",
  },
  Cane: {
    family: "Cane", preferredCare: "toy", autonomousBehaviors: ["walk", "sit", "idle"],
    careMessages: { ...COMMON, food: "Si avvicina alla ciotola scodinzolando e mangia con entusiasmo.", toy: "Porta il gioco, aspetta il lancio e torna da te.", medicine: "Resta fermo e si fida della tua cura." },
    departure: "Parte con energia e si volta per salutarti.", returnHome: "Rientra felice, pronto a mostrarti tutto ciò che ha trovato.", preference: "Preferisce giocare, esplorare e condividere ogni ritorno.",
  },
  Lupo: {
    family: "Lupo", preferredCare: "food", autonomousBehaviors: ["walk", "sit", "idle"],
    careMessages: { ...COMMON, food: "Mangia con calma, restando attento ai suoni della tana.", rest: "Si sdraia mantenendo il muso verso l'ingresso.", toy: "Studia il gioco prima di muoversi con precisione." },
    departure: "Attraversa la soglia con passo misurato e segue una traccia lontana.", returnHome: "Torna dalla stessa direzione, con una nuova traccia del Nexus.", preference: "Ama uscite lunghe, pasti regolari e spazi tranquilli.",
  },
  Coniglio: {
    family: "Coniglio", preferredCare: "food", autonomousBehaviors: ["idle", "sit", "groom"],
    careMessages: { ...COMMON, food: "Si avvicina alla ciotola a piccoli balzi e rosicchia tranquillo.", soap: "Sistema il pelo con movimenti rapidi e delicati.", toy: "Fa un giro curioso intorno al gioco prima di toccarlo." },
    departure: "Esce con due piccoli balzi e si nasconde tra le luci del sentiero.", returnHome: "Ricompare dalla soglia con una scoperta stretta vicino al petto.", preference: "Predilige merende, pulizia e avventure brevi.",
  },
  Volpe: {
    family: "Volpe", preferredCare: "toy", autonomousBehaviors: ["walk", "groom", "sit"],
    careMessages: { ...COMMON, food: "Abbassa il muso sulla ciotola e mangia senza perdere di vista la stanza.", soap: "Pulisce il pelo e sistema la coda con cura.", toy: "Finge di ignorare il gioco, poi lo sorprende con uno scatto." },
    departure: "Scivola oltre la soglia seguendo una luce che solo lei sembra vedere.", returnHome: "Rientra con aria soddisfatta e lascia un ricordo ai piedi della tana.", preference: "Cerca giochi d'astuzia, uscite e momenti per prendersi cura della coda.",
  },
};

const FALLBACK: FamiliarSpeciesProfile = {
  family: "Famiglio", preferredCare: "toy", autonomousBehaviors: ["idle", "sit", "groom"], careMessages: COMMON,
  departure: "Attraversa la soglia e parte verso il Nexus.", returnHome: "Rientra nella tana con una piccola scoperta.", preference: "Alterna cura, riposo, gioco e scoperta secondo il proprio ritmo.",
};

export function familiarSpeciesProfile(family: string): FamiliarSpeciesProfile {
  return PROFILES[family] ?? { ...FALLBACK, family };
}
