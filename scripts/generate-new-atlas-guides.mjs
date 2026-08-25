import hogwarts from "./guide-blueprints/hogwarts-legacy.mjs";
import zelda from "./guide-blueprints/zelda-tears-of-the-kingdom.mjs";
import sims from "./guide-blueprints/the-sims-4.mjs";
import redDead from "./guide-blueprints/red-dead-redemption-2.mjs";
import monsterHunter from "./guide-blueprints/monster-hunter-wilds.mjs";
import diablo from "./guide-blueprints/diablo-iv.mjs";
import pokopia from "./guide-blueprints/pokemon-pokopia.mjs";
import { buildAtlasGuides } from "./atlas-guide-builder.mjs";

await buildAtlasGuides([hogwarts, zelda, sims, redDead, monsterHunter, diablo, pokopia]);
