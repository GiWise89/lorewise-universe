import type { CodexEntry } from "@/lib/codex";

export const codexTaxonomyCategories = [
  "Cinema", "Serie TV", "Animazione", "Anime", "Manga", "Fumetti", "Videogiochi", "Letteratura",
  "Persone e cultura", "Scienza e natura", "Storia e religioni", "Miti e folklore", "Illustrazioni fan art",
] as const;

export type CodexTaxonomyCategory = typeof codexTaxonomyCategories[number];

const universeAliases: Record<string, string> = {
  "I Simpson": "The Simpsons",
  "Family Guy": "I Griffin",
  "Super Mario": "Super Mario Bros.",
  "IT / IT Chapter Two / Welcome to Derry": "It",
  "IT — Miniserie TV": "It",
};

const categoriesByUniverse: Record<string, CodexTaxonomyCategory[]> = {};

function assign(universes: string[], ...categories: CodexTaxonomyCategory[]) {
  universes.forEach((universe) => { categoriesByUniverse[universe] = categories; });
}

assign([
  "A Nightmare on Elm Street", "Ace Ventura", "Bianco, rosso e Verdone", "Bud Spencer & Terence Hill",
  "Child’s Play", "Cinema classico", "Cinema e arti marziali", "Commedia italiana", "Edward mani di forbice",
  "Ghostbusters", "Halloween", "Il padrino", "Joker", "Men in Black", "Pulp Fiction", "Saw", "Scarface",
  "Scream", "Stanlio e Ollio", "Terrifier", "Friday the 13th", "The Conjuring Universe", "The Dark Knight", "The Ring",
  "The Texas Chain Saw Massacre",
], "Cinema");

assign([
  "Breaking Bad", "Dr. House - Medical Division", "I Robinson", "I Soprano", "Peaky Blinders", "Shameless US",
  "The Big Bang Theory", "The Office", "Mr. Bean",
], "Serie TV");

assign([
  "Adventure Time", "American Dad!", "BoJack Horseman", "Due fantagenitori", "Futurama", "I Griffin",
  "Il laboratorio di Dexter", "Johnny Bravo", "Le Superchicche", "Le tenebrose avventure di Billy e Mandy",
  "Leone il cane fifone", "Lo straordinario mondo di Gumball", "Looney Tunes", "Mucca e Pollo", "Pingu",
  "Popeye", "Rick and Morty", "Scooby-Doo", "South Park", "SpongeBob", "The Flintstones", "The Simpsons",
  "Tom & Jerry",
], "Animazione", "Serie TV");
assign(["Grisù il draghetto"], "Animazione", "Serie TV");

assign(["Shrek"], "Animazione", "Cinema");
assign(["Winx Club"], "Animazione", "Serie TV", "Fumetti");
assign(["Tartarughe Ninja"], "Fumetti", "Animazione", "Cinema", "Videogiochi");
assign(["Mighty Morphin Power Rangers"], "Serie TV", "Fumetti", "Cinema");

assign([
  "Attack on Titan", "Detective Conan", "Doraemon", "Dragon Ball", "Hokuto no Ken", "Holly e Benji",
  "L'Uomo Tigre", "Lupin the 3rd", "Mila e Shiro", "Naruto", "One Piece", "One-Punch Man", "Sailor Moon",
], "Manga", "Anime");
assign(["Solo Leveling"], "Letteratura", "Fumetti", "Anime");
assign(["Inazuma Eleven"], "Videogiochi", "Anime", "Manga");
assign(["Pokémon"], "Videogiochi", "Anime", "Manga");

assign([
  "Animal Crossing", "Baldur’s Gate 3", "Crash Bandicoot", "Diablo", "Donkey Kong", "Fallout", "God of War",
  "Grand Theft Auto V", "Hollow Knight", "Max Payne", "MediEvil", "Metal Gear", "Minecraft", "Mortal Kombat",
  "Oddworld", "Red Dead Redemption", "Resident Evil", "Silent Hill", "Sonic the Hedgehog", "Spyro the Dragon",
  "Street Fighter", "Super Mario Bros.", "Tekken", "The Legend of Zelda", "Tomb Raider",
], "Videogiochi");
assign(["Assassin's Creed"], "Videogiochi", "Letteratura");
assign(["The Witcher"], "Letteratura", "Videogiochi", "Serie TV");

assign(["DC Comics", "DC Comics / Batman", "Marvel"], "Fumetti", "Cinema", "Serie TV", "Animazione");
assign(["Diabolik", "Dylan Dog"], "Fumetti", "Cinema");
assign(["Harry Potter"], "Letteratura", "Cinema", "Videogiochi");
assign(["Dracula", "Frankenstein"], "Letteratura", "Cinema");
assign(["It"], "Letteratura", "Cinema", "Serie TV");
assign(["Fantozzi"], "Letteratura", "Cinema");

assign(["Creator italiani", "Cucina & Intrattenimento", "CoopTV", "Mai dire..."], "Persone e cultura", "Serie TV");
assign(["Aldo, Giovanni e Giacomo"], "Persone e cultura", "Cinema", "Serie TV");
assign(["Dinosauri"], "Scienza e natura");
assign(["Occultismo occidentale"], "Miti e folklore", "Letteratura");
assign(["Tradizione cristiana"], "Storia e religioni", "Letteratura");
assign(["Carte Extra · Fan Art", "GiWise Fan Art"], "Illustrazioni fan art");

const categoryPatterns: Array<[RegExp, CodexTaxonomyCategory]> = [
  [/romanzo|letteratura|libro|racconto|novel/i, "Letteratura"],
  [/manga/i, "Manga"],
  [/anime/i, "Anime"],
  [/fumett|comics|graphic novel/i, "Fumetti"],
  [/videogioc|video game|gioco crossover/i, "Videogiochi"],
  [/serie televisiva animata|cartoon|animazione/i, "Animazione"],
  [/serie tv|serie televisiva|miniserie|televisione/i, "Serie TV"],
  [/film|cinema/i, "Cinema"],
  [/attività pubblica|biografia pubblica/i, "Persone e cultura"],
  [/illustrazione digitale|fan art/i, "Illustrazioni fan art"],
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function canonicalCodexUniverse(universe: string) {
  return universeAliases[universe] ?? universe;
}

export function deriveCodexCategories(entry: CodexEntry): CodexTaxonomyCategory[] {
  const universe = canonicalCodexUniverse(entry.catalog.universe);
  const categories = [...(categoriesByUniverse[universe] ?? [])];
  const evidence = [
    entry.catalog.category,
    entry.catalog.work,
    ...entry.production.appearances.flatMap((appearance) => [appearance.format, appearance.title]),
  ].filter(Boolean).join(" · ");

  for (const [pattern, category] of categoryPatterns) if (pattern.test(evidence)) categories.push(category);
  if (entry.catalog.category === "Cartoon") categories.push("Animazione");
  if (entry.catalog.category === "Anime & Manga") categories.push("Anime", "Manga");
  if (entry.catalog.category === "Film & Serie") categories.push("Cinema", "Serie TV");
  if ((codexTaxonomyCategories as readonly string[]).includes(entry.catalog.category)) {
    categories.push(entry.catalog.category as CodexTaxonomyCategory);
  }

  return unique(categories.length ? categories : ["Persone e cultura"]);
}

export function codexUniverseAliases(universe: string) {
  const canonical = canonicalCodexUniverse(universe);
  return unique([
    universe, canonical,
    ...(canonical === "The Simpsons" ? ["I Simpson", "Simpson", "Simpsons"] : []),
    ...(canonical === "It" ? ["IT", "Pennywise", "Stephen King"] : []),
    ...(canonical === "I Griffin" ? ["Family Guy"] : []),
    ...(canonical === "Super Mario Bros." ? ["Super Mario", "Mario"] : []),
  ]);
}
