import { FAMILIAR_COLLECTION, type FamiliarCollectionEntry } from "./famiglioMarketExpansion.ts";

export const COMBAT_LEVEL_CAP = 50;
export const FAMILIAR_MOVE_SLOTS = 4;

export type CombatRarity = "comune" | "raro" | "epico" | "leggendario";
export type CombatAffinity = "natura" | "marea" | "ardore" | "vento" | "arcano" | "antico";
export type CombatRole = "assaltatore" | "guardiano" | "mistico" | "agile" | "sostegno" | "colosso";
export type CombatDamageClass = "physical" | "magic" | "status" | "restore";
export type CombatAnimation = "charge" | "projectile" | "spell" | "guard" | "restore";
export type CombatStatus = "burn" | "freeze" | "poison" | "paralysis" | "sleep" | "slow" | "weaken" | "guard" | "regen" | "focus";

export type CombatStats = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type CombatGrowth = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type CombatMove = {
  id: string;
  name: string;
  source: "species" | "affinity" | "role" | "ultimate";
  affinity: CombatAffinity;
  damageClass: CombatDamageClass;
  animation: CombatAnimation;
  power: number;
  accuracy: number;
  priority: number;
  status?: CombatStatus;
  statusChance?: number;
  healingRatio?: number;
  description: string;
  vfx: string;
  audio: string;
};

export type FamiliarMoveUnlock = {
  moveId: string;
  level: number;
  band: readonly [number, number];
};

export type FamiliarCombatEntry = {
  id: string;
  name: string;
  category: FamiliarCollectionEntry["category"];
  type: "animale" | "magico" | "leggendario" | "dinosauro";
  rarity: CombatRarity;
  affinity: CombatAffinity;
  role: CombatRole;
  baseStats: CombatStats;
  growth: CombatGrowth;
  moves: readonly CombatMove[];
  initialMoveIds: readonly [string, string];
  initialEquippedMoveIds: readonly [string, string];
  ultimateMoveId: string;
};

type SpeciesSeed = {
  id: string;
  rarity: CombatRarity;
  affinity: CombatAffinity;
  role: CombatRole;
  baseStats: CombatStats;
  growth: CombatGrowth;
  techniques: readonly [string, string, string, string, string];
};

const SPECIES: readonly SpeciesSeed[] = [
  { id: "cat", rarity: "comune", affinity: "vento", role: "agile", baseStats: { hp: 82, attack: 24, defense: 18, speed: 31 }, growth: { hp: 4.3, attack: 1.24, defense: 0.92, speed: 1.48 }, techniques: ["Balzo felino", "Artiglio di velluto", "Coda imprevedibile", "Nove slanci", "Regno del tetto"] },
  { id: "golden", rarity: "comune", affinity: "natura", role: "sostegno", baseStats: { hp: 96, attack: 20, defense: 23, speed: 22 }, growth: { hp: 5.2, attack: 1.01, defense: 1.18, speed: 1.05 }, techniques: ["Corsa gioiosa", "Zampa leale", "Riporto luminoso", "Abbraccio dorato", "Patto del branco"] },
  { id: "akita", rarity: "comune", affinity: "vento", role: "assaltatore", baseStats: { hp: 91, attack: 27, defense: 22, speed: 25 }, growth: { hp: 4.8, attack: 1.38, defense: 1.08, speed: 1.21 }, techniques: ["Passo dell'Akita", "Morso vigile", "Scatto cremisi", "Fedeltà incrollabile", "Giuramento del monte"] },
  { id: "great-dane", rarity: "raro", affinity: "antico", role: "guardiano", baseStats: { hp: 112, attack: 27, defense: 32, speed: 18 }, growth: { hp: 5.9, attack: 1.22, defense: 1.5, speed: 0.83 }, techniques: ["Passo imponente", "Spallata gentile", "Guardia dell'Alano", "Ruggito profondo", "Baluardo regale"] },
  { id: "schnauzer", rarity: "comune", affinity: "natura", role: "agile", baseStats: { hp: 84, attack: 23, defense: 22, speed: 29 }, growth: { hp: 4.4, attack: 1.16, defense: 1.08, speed: 1.39 }, techniques: ["Baffo saettante", "Zampata precisa", "Fiuto del sentiero", "Scatto barbuto", "Sentinella d'argento"] },
  { id: "saint-bernard", rarity: "raro", affinity: "marea", role: "sostegno", baseStats: { hp: 116, attack: 23, defense: 33, speed: 17 }, growth: { hp: 6.2, attack: 1.02, defense: 1.54, speed: 0.78 }, techniques: ["Soccorso alpino", "Zampa protettrice", "Botte del ristoro", "Abbraccio di neve", "Salvezza del San Bernardo"] },
  { id: "husky", rarity: "comune", affinity: "marea", role: "agile", baseStats: { hp: 90, attack: 25, defense: 21, speed: 29 }, growth: { hp: 4.7, attack: 1.25, defense: 1.04, speed: 1.4 }, techniques: ["Corsa sulla neve", "Morso boreale", "Ululato polare", "Slitta impetuosa", "Branco dell'aurora"] },
  { id: "rabbit", rarity: "comune", affinity: "natura", role: "agile", baseStats: { hp: 78, attack: 21, defense: 19, speed: 33 }, growth: { hp: 4.0, attack: 1.08, defense: 0.96, speed: 1.56 }, techniques: ["Balzo del prato", "Calcio rapido", "Orecchie vigili", "Zigzag di trifoglio", "Primavera senza fine"] },
  { id: "fox", rarity: "comune", affinity: "ardore", role: "agile", baseStats: { hp: 83, attack: 26, defense: 18, speed: 32 }, growth: { hp: 4.2, attack: 1.31, defense: 0.91, speed: 1.5 }, techniques: ["Scatto fulvo", "Coda di brace", "Finta della volpe", "Morso crepuscolare", "Danza delle nove scintille"] },
  { id: "turtle", rarity: "comune", affinity: "marea", role: "guardiano", baseStats: { hp: 101, attack: 19, defense: 31, speed: 14 }, growth: { hp: 5.5, attack: 0.94, defense: 1.55, speed: 0.71 }, techniques: ["Urto del guscio", "Ritirata sicura", "Rotazione marina", "Passo millenario", "Fortezza delle maree"] },
  { id: "panda", rarity: "raro", affinity: "natura", role: "guardiano", baseStats: { hp: 108, attack: 25, defense: 31, speed: 18 }, growth: { hp: 5.7, attack: 1.16, defense: 1.46, speed: 0.86 }, techniques: ["Rotolo di bambù", "Palmo tranquillo", "Merenda tenace", "Abbraccio possente", "Santuario del bambù"] },
  { id: "horse", rarity: "raro", affinity: "vento", role: "assaltatore", baseStats: { hp: 106, attack: 30, defense: 24, speed: 30 }, growth: { hp: 5.4, attack: 1.42, defense: 1.12, speed: 1.37 }, techniques: ["Galoppo libero", "Zoccolo tonante", "Criniera al vento", "Carica del destriero", "Corsa oltre l'orizzonte"] },
  { id: "polar-bear", rarity: "raro", affinity: "marea", role: "colosso", baseStats: { hp: 121, attack: 32, defense: 31, speed: 16 }, growth: { hp: 6.4, attack: 1.44, defense: 1.39, speed: 0.74 }, techniques: ["Zampa glaciale", "Ruggito artico", "Morsa della banchisa", "Valanga bianca", "Re del polo"] },
  { id: "brown-bear", rarity: "raro", affinity: "natura", role: "colosso", baseStats: { hp: 120, attack: 33, defense: 29, speed: 17 }, growth: { hp: 6.3, attack: 1.47, defense: 1.34, speed: 0.79 }, techniques: ["Zampa del bosco", "Morso del miele", "Abbraccio selvatico", "Furia del letargo", "Cuore della foresta"] },
  { id: "parrot", rarity: "comune", affinity: "vento", role: "mistico", baseStats: { hp: 80, attack: 23, defense: 17, speed: 30 }, growth: { hp: 4.1, attack: 1.19, defense: 0.88, speed: 1.45 }, techniques: ["Becco variopinto", "Eco perfetta", "Piume abbaglianti", "Volo tropicale", "Coro dei cinque cieli"] },
  { id: "bird", rarity: "comune", affinity: "vento", role: "agile", baseStats: { hp: 75, attack: 20, defense: 16, speed: 35 }, growth: { hp: 3.9, attack: 1.03, defense: 0.82, speed: 1.62 }, techniques: ["Beccata rapida", "Ala leggera", "Canto del mattino", "Picchiata colorata", "Stormo dell'arcobaleno"] },
  { id: "chicken", rarity: "comune", affinity: "natura", role: "sostegno", baseStats: { hp: 86, attack: 20, defense: 21, speed: 23 }, growth: { hp: 4.6, attack: 0.98, defense: 1.07, speed: 1.1 }, techniques: ["Beccata campestre", "Ala protettiva", "Richiamo del pulcino", "Corsa nel pollaio", "Alba della covata"] },
  { id: "wolf", rarity: "raro", affinity: "arcano", role: "assaltatore", baseStats: { hp: 103, attack: 32, defense: 24, speed: 29 }, growth: { hp: 5.2, attack: 1.49, defense: 1.13, speed: 1.35 }, techniques: ["Morso lunare", "Caccia silenziosa", "Ululato del Nexus", "Balzo del branco", "Luna del capobranco"] },

  { id: "fairy-rabbit", rarity: "raro", affinity: "arcano", role: "sostegno", baseStats: { hp: 88, attack: 27, defense: 22, speed: 32 }, growth: { hp: 4.5, attack: 1.3, defense: 1.06, speed: 1.46 }, techniques: ["Balzo fatato", "Polvere di trifoglio", "Orecchie incantate", "Portale del prato", "Desiderio della radura"] },
  { id: "demon-rabbit", rarity: "raro", affinity: "ardore", role: "assaltatore", baseStats: { hp: 91, attack: 34, defense: 20, speed: 31 }, growth: { hp: 4.6, attack: 1.58, defense: 0.99, speed: 1.41 }, techniques: ["Calcio infernale", "Orecchie di brace", "Balzo maledetto", "Morso cremisi", "Eclissi del coniglio"] },
  { id: "faerie-dragon", rarity: "epico", affinity: "arcano", role: "mistico", baseStats: { hp: 101, attack: 35, defense: 25, speed: 34 }, growth: { hp: 5.0, attack: 1.61, defense: 1.16, speed: 1.5 }, techniques: ["Morso di fata", "Scaglie iridescenti", "Spirale incantata", "Soffio prismico", "Aurora del drago fatato"] },
  { id: "blue-wyrmling", rarity: "epico", affinity: "marea", role: "assaltatore", baseStats: { hp: 108, attack: 37, defense: 28, speed: 27 }, growth: { hp: 5.5, attack: 1.67, defense: 1.29, speed: 1.23 }, techniques: ["Morso azzurro", "Soffio di marea", "Coda del vortice", "Ruggito della risacca", "Tempesta del giovane drago"] },
  { id: "young-green-dragon", rarity: "epico", affinity: "natura", role: "guardiano", baseStats: { hp: 114, attack: 33, defense: 35, speed: 24 }, growth: { hp: 5.8, attack: 1.45, defense: 1.59, speed: 1.08 }, techniques: ["Artiglio verde", "Scaglia di giada", "Soffio di spore", "Coda rampicante", "Dominio della foresta draconica"] },
  { id: "owlbear", rarity: "epico", affinity: "antico", role: "colosso", baseStats: { hp: 125, attack: 38, defense: 34, speed: 19 }, growth: { hp: 6.5, attack: 1.7, defense: 1.5, speed: 0.86 }, techniques: ["Becco dell'orsogufo", "Artiglio selvaggio", "Abbraccio piumato", "Ruggito notturno", "Predatore della luna antica"] },
  { id: "griffin", rarity: "epico", affinity: "vento", role: "assaltatore", baseStats: { hp: 112, attack: 39, defense: 28, speed: 34 }, growth: { hp: 5.6, attack: 1.74, defense: 1.28, speed: 1.48 }, techniques: ["Artiglio del grifone", "Becco regale", "Picchiata solare", "Ala maestosa", "Sovrano dei cieli"] },
  { id: "elder-snail", rarity: "raro", affinity: "antico", role: "guardiano", baseStats: { hp: 107, attack: 24, defense: 36, speed: 10 }, growth: { hp: 5.8, attack: 1.08, defense: 1.65, speed: 0.48 }, techniques: ["Scia ancestrale", "Guscio runico", "Antenne veggenti", "Spirale del tempo", "Era della lumaca"] },
  { id: "fiddle-dog", rarity: "comune", affinity: "arcano", role: "sostegno", baseStats: { hp: 88, attack: 22, defense: 21, speed: 24 }, growth: { hp: 4.7, attack: 1.08, defense: 1.05, speed: 1.14 }, techniques: ["Archetto allegro", "Nota saltellante", "Ritornello fedele", "Cadenza del cucciolo", "Sinfonia del branco"] },
  { id: "guardian-rabbit", rarity: "raro", affinity: "arcano", role: "guardiano", baseStats: { hp: 99, attack: 27, defense: 34, speed: 27 }, growth: { hp: 5.1, attack: 1.22, defense: 1.56, speed: 1.22 }, techniques: ["Scudo del coniglio", "Calcio della soglia", "Sigillo delle orecchie", "Balzo sentinella", "Porta inviolabile"] },
  { id: "slime", rarity: "raro", affinity: "marea", role: "sostegno", baseStats: { hp: 105, attack: 25, defense: 29, speed: 16 }, growth: { hp: 5.7, attack: 1.12, defense: 1.34, speed: 0.8 }, techniques: ["Rimbalzo gelatinoso", "Bolla adesiva", "Divisione elastica", "Abbraccio fluido", "Marea dello slime"] },
  { id: "kappa", rarity: "raro", affinity: "marea", role: "guardiano", baseStats: { hp: 104, attack: 28, defense: 35, speed: 20 }, growth: { hp: 5.5, attack: 1.28, defense: 1.59, speed: 0.93 }, techniques: ["Palmo del kappa", "Piatto colmo", "Tuffo del fiume", "Presa del canneto", "Custode delle acque"] },
  { id: "nexus-bat", rarity: "raro", affinity: "arcano", role: "agile", baseStats: { hp: 86, attack: 30, defense: 19, speed: 37 }, growth: { hp: 4.3, attack: 1.4, defense: 0.94, speed: 1.65 }, techniques: ["Morso del Nexus", "Eco stellare", "Ala d'ombra", "Volo interdimensionale", "Notte tra i mondi"] },
  { id: "frost-salamander", rarity: "raro", affinity: "marea", role: "mistico", baseStats: { hp: 96, attack: 33, defense: 25, speed: 25 }, growth: { hp: 4.9, attack: 1.51, defense: 1.18, speed: 1.16 }, techniques: ["Morso di brina", "Coda gelida", "Passo sul ghiaccio", "Respiro invernale", "Cuore dello zero"] },

  { id: "adult-red-dragon", rarity: "leggendario", affinity: "ardore", role: "colosso", baseStats: { hp: 141, attack: 44, defense: 37, speed: 27 }, growth: { hp: 7.0, attack: 1.88, defense: 1.57, speed: 1.13 }, techniques: ["Artiglio cremisi", "Soffio vulcanico", "Coda della fornace", "Ruggito del magma", "Apocalisse del drago rosso"] },
  { id: "ancient-black-dragon", rarity: "leggendario", affinity: "antico", role: "mistico", baseStats: { hp: 138, attack: 43, defense: 39, speed: 25 }, growth: { hp: 6.8, attack: 1.84, defense: 1.66, speed: 1.08 }, techniques: ["Artiglio d'ossidiana", "Soffio del vuoto", "Scaglia millenaria", "Eclissi corrosiva", "Fine dell'era antica"] },
  { id: "displacer-beast", rarity: "leggendario", affinity: "arcano", role: "agile", baseStats: { hp: 123, attack: 42, defense: 30, speed: 43 }, growth: { hp: 6.0, attack: 1.79, defense: 1.31, speed: 1.82 }, techniques: ["Tentacolo dislocante", "Passo irreale", "Immagine residua", "Balzo tra gli spazi", "Predatore impossibile"] },
  { id: "ice-golem", rarity: "leggendario", affinity: "marea", role: "guardiano", baseStats: { hp: 146, attack: 37, defense: 47, speed: 13 }, growth: { hp: 7.3, attack: 1.54, defense: 1.94, speed: 0.57 }, techniques: ["Pugno di ghiaccio", "Parete glaciale", "Nucleo congelato", "Frana di cristallo", "Fortezza dello zero"] },
  { id: "hellhound", rarity: "leggendario", affinity: "ardore", role: "assaltatore", baseStats: { hp: 128, attack: 45, defense: 32, speed: 36 }, growth: { hp: 6.3, attack: 1.91, defense: 1.38, speed: 1.5 }, techniques: ["Morso infernale", "Corsa sulfurea", "Catena di fiamme", "Ululato dannato", "Caccia dell'ultimo fuoco"] },
  { id: "imp", rarity: "leggendario", affinity: "ardore", role: "agile", baseStats: { hp: 113, attack: 40, defense: 27, speed: 44 }, growth: { hp: 5.5, attack: 1.72, defense: 1.17, speed: 1.86 }, techniques: ["Graffio dell'imp", "Scherzo di brace", "Volo malizioso", "Trappola cremisi", "Caos in miniatura"] },
  { id: "beholder", rarity: "leggendario", affinity: "arcano", role: "mistico", baseStats: { hp: 132, attack: 46, defense: 34, speed: 23 }, growth: { hp: 6.5, attack: 1.95, defense: 1.44, speed: 0.99 }, techniques: ["Morso centrale", "Raggio esitante", "Occhio dominante", "Corona di raggi", "Sguardo che spezza il Nexus"] },
  { id: "bulette", rarity: "leggendario", affinity: "antico", role: "colosso", baseStats: { hp: 149, attack: 43, defense: 44, speed: 20 }, growth: { hp: 7.5, attack: 1.82, defense: 1.84, speed: 0.83 }, techniques: ["Morso della bulette", "Tuffo sotterraneo", "Corazza vivente", "Eruzione del terreno", "Terremoto divoratore"] },
  { id: "purple-worm", rarity: "leggendario", affinity: "antico", role: "colosso", baseStats: { hp: 154, attack: 47, defense: 40, speed: 16 }, growth: { hp: 7.8, attack: 1.98, defense: 1.68, speed: 0.68 }, techniques: ["Morso purpureo", "Coda abissale", "Galleria vorace", "Morsa del sottosuolo", "Divoratore delle profondità"] },

  { id: "tyrannosaurus", rarity: "epico", affinity: "antico", role: "colosso", baseStats: { hp: 132, attack: 42, defense: 34, speed: 21 }, growth: { hp: 6.8, attack: 1.82, defense: 1.48, speed: 0.9 }, techniques: ["Morso tiranno", "Passo sismico", "Coda regale", "Ruggito del Cretaceo", "Re dell'era perduta"] },
  { id: "triceratops", rarity: "epico", affinity: "natura", role: "guardiano", baseStats: { hp: 128, attack: 35, defense: 42, speed: 19 }, growth: { hp: 6.6, attack: 1.51, defense: 1.79, speed: 0.81 }, techniques: ["Corno frontale", "Collare fortificato", "Carica triplice", "Terra difesa", "Bastione del Triceratopo"] },
  { id: "velociraptor", rarity: "raro", affinity: "vento", role: "agile", baseStats: { hp: 92, attack: 34, defense: 21, speed: 39 }, growth: { hp: 4.6, attack: 1.55, defense: 1.0, speed: 1.72 }, techniques: ["Artiglio ricurvo", "Caccia coordinata", "Scatto del raptor", "Finta preistorica", "Assalto del branco perduto"] },
  { id: "stegosaurus", rarity: "epico", affinity: "natura", role: "guardiano", baseStats: { hp: 127, attack: 34, defense: 43, speed: 15 }, growth: { hp: 6.5, attack: 1.46, defense: 1.83, speed: 0.65 }, techniques: ["Coda spinata", "Placche solari", "Passo del giurassico", "Spazzata dorsale", "Fortezza dello Stegosauro"] },
  { id: "brachiosaurus", rarity: "epico", affinity: "natura", role: "sostegno", baseStats: { hp: 139, attack: 30, defense: 38, speed: 13 }, growth: { hp: 7.2, attack: 1.29, defense: 1.62, speed: 0.56 }, techniques: ["Passo del gigante", "Collo svettante", "Richiamo della chioma", "Ombra protettiva", "Cielo del Brachiosauro"] },
  { id: "ankylosaurus", rarity: "epico", affinity: "antico", role: "guardiano", baseStats: { hp: 131, attack: 36, defense: 46, speed: 14 }, growth: { hp: 6.7, attack: 1.54, defense: 1.91, speed: 0.6 }, techniques: ["Mazza caudale", "Piastre ancestrali", "Urto corazzato", "Cerchio difensivo", "Fortezza dell'Anchilosauro"] },
  { id: "spinosaurus", rarity: "epico", affinity: "marea", role: "assaltatore", baseStats: { hp: 126, attack: 41, defense: 32, speed: 27 }, growth: { hp: 6.4, attack: 1.77, defense: 1.39, speed: 1.16 }, techniques: ["Morso dello spinosauro", "Vela della corrente", "Coda palustre", "Caccia anfibia", "Dominio dei due mondi"] },
  { id: "parasaurolophus", rarity: "raro", affinity: "vento", role: "sostegno", baseStats: { hp: 106, attack: 27, defense: 29, speed: 25 }, growth: { hp: 5.4, attack: 1.21, defense: 1.32, speed: 1.16 }, techniques: ["Cresta risonante", "Corsa del branco", "Richiamo fossile", "Eco della valle", "Canto del Parasaurolofo"] },
  { id: "pteranodon", rarity: "epico", affinity: "vento", role: "agile", baseStats: { hp: 102, attack: 37, defense: 23, speed: 42 }, growth: { hp: 5.0, attack: 1.63, defense: 1.05, speed: 1.8 }, techniques: ["Becco del cielo", "Ala fossile", "Picchiata oceanica", "Volo del Cretaceo", "Orizzonte del Pteranodonte"] },
  { id: "dilophosaurus", rarity: "epico", affinity: "ardore", role: "mistico", baseStats: { hp: 105, attack: 39, defense: 25, speed: 35 }, growth: { hp: 5.2, attack: 1.71, defense: 1.13, speed: 1.51 }, techniques: ["Morso crestato", "Velo abbagliante", "Sibilo ardente", "Doppia fiamma", "Corona del Dilofosauro"] },
  { id: "carnotaurus", rarity: "epico", affinity: "ardore", role: "assaltatore", baseStats: { hp: 119, attack: 43, defense: 29, speed: 32 }, growth: { hp: 6.0, attack: 1.85, defense: 1.28, speed: 1.38 }, techniques: ["Corno del Carnotauro", "Morso infuocato", "Carica scarlatta", "Caccia fulminea", "Furia delle corna cremisi"] },
  { id: "pachycephalosaurus", rarity: "raro", affinity: "antico", role: "assaltatore", baseStats: { hp: 110, attack: 35, defense: 34, speed: 22 }, growth: { hp: 5.7, attack: 1.58, defense: 1.52, speed: 1.0 }, techniques: ["Testata fossile", "Cupola resistente", "Rincorsa del Pachicefalo", "Urto delle ere", "Impatto del cranio antico"] },
] as const;

const AFFINITY_MOVES: Record<CombatAffinity, readonly [CombatMove, CombatMove]> = {
  natura: [
    { id: "affinity-natura-germoglio", name: "Germoglio vivace", source: "affinity", affinity: "natura", damageClass: "restore", animation: "restore", power: 0, accuracy: 100, priority: 0, status: "regen", statusChance: 100, healingRatio: 0.2, description: "Recupera energia vitale e lascia una rigenerazione breve.", vfx: "natura-heal", audio: "heal-bloom" },
    { id: "affinity-natura-liane", name: "Liane avvolgenti", source: "affinity", affinity: "natura", damageClass: "magic", animation: "projectile", power: 62, accuracy: 92, priority: 0, status: "slow", statusChance: 35, description: "Le liane raggiungono il bersaglio e possono rallentarlo.", vfx: "natura-vines", audio: "spell-nature" },
  ],
  marea: [
    { id: "affinity-marea-risacca", name: "Colpo di risacca", source: "affinity", affinity: "marea", damageClass: "magic", animation: "projectile", power: 52, accuracy: 97, priority: 0, status: "slow", statusChance: 20, description: "Una corrente compatta travolge il bersaglio.", vfx: "marea-wave", audio: "spell-water" },
    { id: "affinity-marea-brina", name: "Corrente di brina", source: "affinity", affinity: "marea", damageClass: "magic", animation: "projectile", power: 66, accuracy: 90, priority: 0, status: "freeze", statusChance: 25, description: "Una scia gelida può bloccare per un turno.", vfx: "marea-frost", audio: "spell-ice" },
  ],
  ardore: [
    { id: "affinity-ardore-favilla", name: "Favilla ardente", source: "affinity", affinity: "ardore", damageClass: "magic", animation: "projectile", power: 54, accuracy: 96, priority: 0, status: "burn", statusChance: 24, description: "Una scintilla viva lascia talvolta una bruciatura.", vfx: "ardore-spark", audio: "spell-fire" },
    { id: "affinity-ardore-fiammata", name: "Fiammata cremisi", source: "affinity", affinity: "ardore", damageClass: "magic", animation: "spell", power: 70, accuracy: 88, priority: 0, status: "burn", statusChance: 38, description: "Una fiamma intensa investe l'avversario.", vfx: "ardore-flame", audio: "spell-flame" },
  ],
  vento: [
    { id: "affinity-vento-raffica", name: "Raffica affilata", source: "affinity", affinity: "vento", damageClass: "magic", animation: "projectile", power: 50, accuracy: 98, priority: 1, description: "Una lama d'aria rapida anticipa spesso l'avversario.", vfx: "vento-slash", audio: "spell-wind" },
    { id: "affinity-vento-ciclone", name: "Ciclone del Nexus", source: "affinity", affinity: "vento", damageClass: "magic", animation: "spell", power: 65, accuracy: 92, priority: 0, status: "weaken", statusChance: 28, description: "Un vortice scuote il bersaglio e può indebolirne l'attacco.", vfx: "vento-cyclone", audio: "spell-cyclone" },
  ],
  arcano: [
    { id: "affinity-arcano-dardo", name: "Dardo del Nexus", source: "affinity", affinity: "arcano", damageClass: "magic", animation: "projectile", power: 56, accuracy: 96, priority: 0, description: "Energia astrale concentrata vola fino al bersaglio.", vfx: "arcano-bolt", audio: "spell-arcane" },
    { id: "affinity-arcano-sigillo", name: "Sigillo stellare", source: "affinity", affinity: "arcano", damageClass: "status", animation: "spell", power: 0, accuracy: 100, priority: 0, status: "focus", statusChance: 100, description: "Aumenta la precisione e prepara la prossima tecnica.", vfx: "arcano-focus", audio: "spell-focus" },
  ],
  antico: [
    { id: "affinity-antico-urto", name: "Urto primordiale", source: "affinity", affinity: "antico", damageClass: "physical", animation: "charge", power: 58, accuracy: 95, priority: 0, description: "Una carica pesante porta la forza delle ere.", vfx: "antico-impact", audio: "impact-stone" },
    { id: "affinity-antico-runa", name: "Runa delle ere", source: "affinity", affinity: "antico", damageClass: "status", animation: "guard", power: 0, accuracy: 100, priority: 1, status: "guard", statusChance: 100, description: "Una runa antica riduce il prossimo danno subito.", vfx: "antico-rune", audio: "guard-stone" },
  ],
};

const ROLE_MOVES: Record<CombatRole, CombatMove> = {
  assaltatore: { id: "role-assaltatore-varco", name: "Assalto del varco", source: "role", affinity: "arcano", damageClass: "physical", animation: "charge", power: 72, accuracy: 90, priority: 0, description: "Una corsa completa culmina in un impatto ravvicinato.", vfx: "role-charge", audio: "charge-impact" },
  guardiano: { id: "role-guardiano-baluardo", name: "Baluardo vigile", source: "role", affinity: "antico", damageClass: "status", animation: "guard", power: 0, accuracy: 100, priority: 2, status: "guard", statusChance: 100, description: "Assume una posizione difensiva e assorbe parte del colpo.", vfx: "role-guard", audio: "guard-shield" },
  mistico: { id: "role-mistico-risonanza", name: "Risonanza mistica", source: "role", affinity: "arcano", damageClass: "magic", animation: "spell", power: 68, accuracy: 93, priority: 0, status: "weaken", statusChance: 24, description: "Una formula arcana risuona sul bersaglio.", vfx: "role-mystic", audio: "spell-resonance" },
  agile: { id: "role-agile-passo", name: "Passo istantaneo", source: "role", affinity: "vento", damageClass: "physical", animation: "charge", power: 59, accuracy: 98, priority: 2, description: "Uno scatto pulito colpisce prima di tornare alla posizione.", vfx: "role-dash", audio: "dash-impact" },
  sostegno: { id: "role-sostegno-legame", name: "Legame ristoratore", source: "role", affinity: "natura", damageClass: "restore", animation: "restore", power: 0, accuracy: 100, priority: 0, status: "regen", statusChance: 100, healingRatio: 0.28, description: "Il legame recupera salute e sostiene i turni successivi.", vfx: "role-restore", audio: "heal-chime" },
  colosso: { id: "role-colosso-impatto", name: "Impatto titanico", source: "role", affinity: "antico", damageClass: "physical", animation: "charge", power: 78, accuracy: 86, priority: -1, status: "weaken", statusChance: 30, description: "Un colpo lento e imponente scuote il terreno.", vfx: "role-titan", audio: "impact-heavy" },
};

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function speciesControlStatus(seed: SpeciesSeed): CombatStatus {
  if (seed.affinity === "ardore") return "burn";
  if (seed.affinity === "marea") return "freeze";
  if (seed.affinity === "natura") return "poison";
  if (seed.affinity === "vento") return "paralysis";
  if (seed.affinity === "arcano") return "sleep";
  return "weaken";
}

const STATUS_MOVE_COPY: Readonly<Record<CombatStatus, string>> = {
  burn: "Puo lasciare una bruciatura che infligge danni per due turni.",
  freeze: "Puo congelare il bersaglio e impedirgli la prossima azione.",
  poison: "Puo avvelenare il bersaglio con danni persistenti per tre turni.",
  paralysis: "Puo paralizzare il bersaglio, rallentandolo e rendendo incerta la sua azione.",
  sleep: "Puo addormentare il bersaglio e impedirgli di agire finche non si risveglia.",
  slow: "Puo rallentare il bersaglio.",
  weaken: "Puo ridurre temporaneamente la forza del bersaglio.",
  guard: "Protegge temporaneamente chi la usa.",
  regen: "Ripristina salute per piu turni.",
  focus: "Aumenta temporaneamente la precisione.",
};

function speciesMove(seed: SpeciesSeed, name: string, index: number): CombatMove {
  const isUltimate = index === 4;
  const support = seed.role === "sostegno" && index === 2;
  const defensive = seed.role === "guardiano" && index === 1;
  const magical = index === 2;
  const damageClass: CombatDamageClass = support ? "restore" : defensive ? "status" : magical ? "magic" : "physical";
  const animation: CombatAnimation = support ? "restore" : defensive ? "guard" : magical ? (index % 2 ? "projectile" : "spell") : "charge";
  const status = support ? "regen" : defensive ? "guard" : index === 3 ? speciesControlStatus(seed) : undefined;
  return {
    id: `${seed.id}-${isUltimate ? "finale" : `specie-${index + 1}`}-${slug(name)}`,
    name,
    source: isUltimate ? "ultimate" : "species",
    affinity: seed.affinity,
    damageClass,
    animation,
    power: support || defensive ? 0 : isUltimate ? 112 : 48 + index * 9,
    accuracy: isUltimate ? 86 : Math.max(88, 99 - index * 3),
    priority: defensive ? 1 : isUltimate ? -1 : 0,
    status,
    statusChance: support || defensive ? 100 : index === 3 ? 32 : undefined,
    healingRatio: support ? 0.24 : undefined,
    description: isUltimate
      ? "Tecnica finale unica della specie, potente e riconoscibile, appresa solo ai livelli alti."
      : status
        ? `Mossa caratteristica della specie. ${STATUS_MOVE_COPY[status]}`
        : `Mossa caratteristica della specie, eseguita con il ritmo e la postura propri del Famiglio.`,
    vfx: `${seed.affinity}-${isUltimate ? "ultimate" : animation}`,
    audio: isUltimate ? `ultimate-${seed.affinity}` : animation === "charge" ? "charge-impact" : `spell-${seed.affinity}`,
  };
}

const COLLECTION_BY_ID = new Map(FAMILIAR_COLLECTION.map((entry) => [entry.id, entry]));

export const FAMILIAR_COMBAT_CATALOG: readonly FamiliarCombatEntry[] = SPECIES.map((seed) => {
  const collection = COLLECTION_BY_ID.get(seed.id);
  if (!collection) throw new Error(`Famiglio da combattimento sconosciuto: ${seed.id}`);
  const speciesMoves = seed.techniques.map((name, index) => speciesMove(seed, name, index));
  const affinityMoves = AFFINITY_MOVES[seed.affinity];
  const roleMove = ROLE_MOVES[seed.role];
  const moves = [speciesMoves[0], affinityMoves[0], speciesMoves[1], roleMove, speciesMoves[2], affinityMoves[1], speciesMoves[3], speciesMoves[4]];
  return {
    id: seed.id,
    name: collection.name,
    category: collection.category,
    type: collection.category === "real" ? "animale" : collection.category === "magical" ? "magico" : collection.category === "legendary" ? "leggendario" : "dinosauro",
    rarity: seed.rarity,
    affinity: seed.affinity,
    role: seed.role,
    baseStats: seed.baseStats,
    growth: seed.growth,
    moves,
    initialMoveIds: [moves[0].id, moves[1].id],
    initialEquippedMoveIds: [moves[0].id, moves[1].id],
    ultimateMoveId: moves[7].id,
  };
});

export const COMBAT_MOVES_BY_ID: Readonly<Record<string, CombatMove>> = Object.freeze(Object.fromEntries(
  FAMILIAR_COMBAT_CATALOG.flatMap((entry) => entry.moves.map((move) => [move.id, move])),
));

export function combatMoveById(moveId: string) {
  return COMBAT_MOVES_BY_ID[moveId] ?? null;
}

export function familiarCombatEntry(familiarId: string) {
  return FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === familiarId) ?? null;
}

export const MOVE_UNLOCK_BANDS = [
  [3, 6], [7, 12], [13, 19], [20, 28], [29, 38], [39, 48],
] as const;

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededMoveSchedule(familiarId: string, seed = familiarId): readonly FamiliarMoveUnlock[] {
  const entry = familiarCombatEntry(familiarId);
  if (!entry) return [];
  const scheduled = [entry.moves[2], entry.moves[3], entry.moves[4], entry.moves[5], entry.moves[6], entry.moves[7]];
  return scheduled.map((move, index) => {
    const band = MOVE_UNLOCK_BANDS[index];
    const level = band[0] + (stableHash(`${seed}:${familiarId}:${move.id}:${index}`) % (band[1] - band[0] + 1));
    return { moveId: move.id, level, band };
  });
}

export function movesKnownAtLevel(familiarId: string, level: number, seed = familiarId): readonly CombatMove[] {
  const entry = familiarCombatEntry(familiarId);
  if (!entry) return [];
  const knownIds = new Set(entry.initialMoveIds);
  for (const unlock of createSeededMoveSchedule(familiarId, seed)) if (unlock.level <= Math.max(1, Math.min(COMBAT_LEVEL_CAP, Math.trunc(level)))) knownIds.add(unlock.moveId);
  return entry.moves.filter((move) => knownIds.has(move.id));
}

export function defaultEquippedMovesAtLevel(familiarId: string, level: number, seed = familiarId): readonly string[] {
  return movesKnownAtLevel(familiarId, level, seed).slice(-FAMILIAR_MOVE_SLOTS).map((move) => move.id);
}

export function combatStatsAtLevel(familiarId: string, level: number): CombatStats | null {
  const entry = familiarCombatEntry(familiarId);
  if (!entry) return null;
  const safeLevel = Math.max(1, Math.min(COMBAT_LEVEL_CAP, Math.trunc(level)));
  const levels = safeLevel - 1;
  return {
    hp: Math.round(entry.baseStats.hp + entry.growth.hp * levels),
    attack: Math.round(entry.baseStats.attack + entry.growth.attack * levels),
    defense: Math.round(entry.baseStats.defense + entry.growth.defense * levels),
    speed: Math.round(entry.baseStats.speed + entry.growth.speed * levels),
  };
}

export const AFFINITY_RELATIONS: Readonly<Record<CombatAffinity, CombatAffinity>> = {
  natura: "marea",
  marea: "ardore",
  ardore: "natura",
  vento: "arcano",
  arcano: "antico",
  antico: "vento",
};

export function affinityMultiplier(attacker: CombatAffinity, defender: CombatAffinity) {
  if (attacker === defender) return 1;
  if (AFFINITY_RELATIONS[attacker] === defender) return 1.25;
  if (AFFINITY_RELATIONS[defender] === attacker) return 0.8;
  return 1;
}

export type CombatDifficulty = {
  id: "normal" | "expert" | "nexus";
  label: "Normale" | "Esperto" | "Nexus";
  unlockWins: number;
  statMultiplier: number;
  xpMultiplier: number;
  rewardMultiplier: number;
  ai: {
    lookahead: number;
    guardThreshold: number;
    finisherAwareness: boolean;
    statusPreference: number;
  };
};

export const FAMILIAR_COMBAT_DIFFICULTIES: readonly CombatDifficulty[] = [
  { id: "normal", label: "Normale", unlockWins: 0, statMultiplier: 1, xpMultiplier: 1, rewardMultiplier: 1, ai: { lookahead: 0, guardThreshold: 0.22, finisherAwareness: false, statusPreference: 0.08 } },
  { id: "expert", label: "Esperto", unlockWins: 8, statMultiplier: 1.08, xpMultiplier: 1.3, rewardMultiplier: 1.35, ai: { lookahead: 1, guardThreshold: 0.34, finisherAwareness: true, statusPreference: 0.2 } },
  { id: "nexus", label: "Nexus", unlockWins: 24, statMultiplier: 1.16, xpMultiplier: 1.7, rewardMultiplier: 1.8, ai: { lookahead: 2, guardThreshold: 0.46, finisherAwareness: true, statusPreference: 0.34 } },
] as const;

export type FamiliarCombatCircuit = {
  id: "prime-orme" | "bosco-risonanze" | "grotte-celesti" | "rovine-arcane" | "valle-titani" | "soglia-leggendaria";
  name: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  unlockWins: number;
  backgroundSrc: string;
  opponentIds: readonly string[];
  bossId: string;
  rewards: { combatXp: number; coins: number; sigils: number; fragments: number };
};

function opponentIds(predicate: (entry: FamiliarCombatEntry) => boolean) {
  return FAMILIAR_COMBAT_CATALOG.filter(predicate).map((entry) => entry.id);
}

export const FAMILIAR_COMBAT_CIRCUITS: readonly FamiliarCombatCircuit[] = [
  { id: "prime-orme", name: "Cortile delle Prime Orme", description: "Duelli guidati per imparare ritmo, affinità e difesa.", minLevel: 1, maxLevel: 7, unlockWins: 0, backgroundSrc: "/famiglio/rebuild/combat/arenas/cortile-prime-orme-v1.webp", opponentIds: opponentIds((entry) => entry.rarity === "comune"), bossId: "akita", rewards: { combatXp: 42, coins: 8, sigils: 0, fragments: 0 } },
  { id: "bosco-risonanze", name: "Bosco delle Risonanze", description: "Il bosco alterna avversari veloci, difensivi e di sostegno.", minLevel: 6, maxLevel: 14, unlockWins: 4, backgroundSrc: "/famiglio/rebuild/combat/arenas/bosco-risonanze-v1.webp", opponentIds: opponentIds((entry) => entry.rarity !== "leggendario" && ["natura", "vento", "marea", "arcano"].includes(entry.affinity)), bossId: "wolf", rewards: { combatXp: 78, coins: 13, sigils: 1, fragments: 0 } },
  { id: "grotte-celesti", name: "Grotte Celesti", description: "Cunicoli cristallini mettono alla prova controllo e precisione.", minLevel: 13, maxLevel: 22, unlockWins: 10, backgroundSrc: "/famiglio/rebuild/combat/arenas/grotte-celesti-v1.webp", opponentIds: opponentIds((entry) => entry.rarity === "raro" || (entry.rarity === "epico" && ["marea", "vento"].includes(entry.affinity))), bossId: "griffin", rewards: { combatXp: 126, coins: 20, sigils: 2, fragments: 1 } },
  { id: "rovine-arcane", name: "Rovine Arcane", description: "Sigilli e condizioni di stato premiano scelte attente.", minLevel: 21, maxLevel: 32, unlockWins: 18, backgroundSrc: "/famiglio/rebuild/combat/arenas/rovine-arcane-v1.webp", opponentIds: opponentIds((entry) => entry.rarity !== "comune" && ["arcano", "ardore", "antico"].includes(entry.affinity)), bossId: "beholder", rewards: { combatXp: 196, coins: 30, sigils: 3, fragments: 2 } },
  { id: "valle-titani", name: "Valle dei Titani", description: "Creature massicce e dinosauri impongono gestione di velocità e guardia.", minLevel: 31, maxLevel: 42, unlockWins: 29, backgroundSrc: "/famiglio/rebuild/combat/arenas/valle-titani-v1.webp", opponentIds: opponentIds((entry) => entry.category === "dinosaur" || entry.role === "colosso" || (entry.rarity === "epico" && entry.role === "guardiano")), bossId: "tyrannosaurus", rewards: { combatXp: 284, coins: 44, sigils: 4, fragments: 3 } },
  { id: "soglia-leggendaria", name: "Soglia Leggendaria", description: "La prova conclusiva custodisce i Famigli non acquistabili direttamente.", minLevel: 41, maxLevel: 50, unlockWins: 42, backgroundSrc: "/famiglio/rebuild/combat/arenas/soglia-leggendaria-v1.webp", opponentIds: opponentIds((entry) => entry.rarity === "leggendario" || entry.rarity === "epico"), bossId: "ancient-black-dragon", rewards: { combatXp: 390, coins: 65, sigils: 6, fragments: 5 } },
] as const;

export type FamiliarCombatShopCard = {
  id: string;
  name: string;
  type: FamiliarCombatEntry["type"];
  rarity: CombatRarity;
  affinity: CombatAffinity;
  role: CombatRole;
  initialHp: number;
  initialAttack: number;
  initialDefense: number;
  initialSpeed: number;
  purchasable: boolean;
  acquisition: string;
};

export function combatShopCardFor(familiarId: string): FamiliarCombatShopCard | null {
  const entry = familiarCombatEntry(familiarId);
  const collection = COLLECTION_BY_ID.get(familiarId);
  if (!entry || !collection) return null;
  const legendary = entry.rarity === "leggendario";
  return {
    id: entry.id,
    name: entry.name,
    type: entry.type,
    rarity: entry.rarity,
    affinity: entry.affinity,
    role: entry.role,
    initialHp: entry.baseStats.hp,
    initialAttack: entry.baseStats.attack,
    initialDefense: entry.baseStats.defense,
    initialSpeed: entry.baseStats.speed,
    purchasable: !legendary,
    acquisition: legendary ? "Ricompensa della Soglia Leggendaria" : collection.unlock,
  };
}

export function validateFamiliarCombatCatalog() {
  const errors: string[] = [];
  const canonicalIds = new Set(FAMILIAR_COLLECTION.map((entry) => entry.id));
  const combatIds = new Set<string>();
  for (const entry of FAMILIAR_COMBAT_CATALOG) {
    if (combatIds.has(entry.id)) errors.push(`ID duplicato: ${entry.id}`);
    combatIds.add(entry.id);
    if (!canonicalIds.has(entry.id)) errors.push(`ID non canonico: ${entry.id}`);
    if (entry.moves.length < 8) errors.push(`${entry.id}: meno di otto mosse complessive`);
    if (entry.moves.filter((move) => move.source === "species").length < 4) errors.push(`${entry.id}: meno di quattro mosse di specie`);
    if (entry.moves.filter((move) => move.source === "affinity").length < 2) errors.push(`${entry.id}: mosse di affinità incomplete`);
    if (!entry.moves.some((move) => move.source === "role")) errors.push(`${entry.id}: mossa di ruolo assente`);
    if (!entry.moves.some((move) => move.id === entry.ultimateMoveId && move.source === "ultimate")) errors.push(`${entry.id}: tecnica finale assente`);
    if (new Set(entry.moves.map((move) => move.id)).size !== entry.moves.length) errors.push(`${entry.id}: mosse duplicate`);
    const schedule = createSeededMoveSchedule(entry.id, `audit:${entry.id}`);
    if (schedule.length !== MOVE_UNLOCK_BANDS.length) errors.push(`${entry.id}: calendario incompleto`);
    schedule.forEach((unlock, index) => {
      const band = MOVE_UNLOCK_BANDS[index];
      if (unlock.level < band[0] || unlock.level > band[1]) errors.push(`${entry.id}: livello ${unlock.level} fuori fascia`);
    });
  }
  for (const id of canonicalIds) if (!combatIds.has(id)) errors.push(`Famiglio canonico mancante: ${id}`);
  if (FAMILIAR_COMBAT_CATALOG.length !== FAMILIAR_COLLECTION.length) errors.push("Catalogo combattimento e collezione non hanno la stessa dimensione");
  for (const circuit of FAMILIAR_COMBAT_CIRCUITS) {
    if (!canonicalIds.has(circuit.bossId)) errors.push(`${circuit.id}: boss non canonico`);
    if (!circuit.opponentIds.length) errors.push(`${circuit.id}: nessun avversario`);
    for (const id of circuit.opponentIds) if (!canonicalIds.has(id)) errors.push(`${circuit.id}: avversario non canonico ${id}`);
  }
  return { ok: errors.length === 0, errors };
}
