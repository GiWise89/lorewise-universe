import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { STARTER_FAMILIARS, familiarPalettes } from "../lib/nexusFamiliarCatalog.ts";
import { FAMILIAR_GADGETS, familiarAppearanceWithGadget } from "../lib/nexusFamiliarGadgets.ts";
import { FAMILIAR_HABITAT_THEMES } from "../lib/nexusDayCycle.ts";
import { FAMILIAR_DESTINATIONS, FAMILIAR_SHOP_OFFERS } from "../lib/nexusFamiliarWorld.ts";
import { FAMILIAR_LEVEL_BENEFITS } from "../lib/nexusFamiliarBenefits.ts";

const root = process.cwd();
const failures = [];
const checked = [];

async function requireFile(relative) {
  const filesystemPath = relative.startsWith("/famiglio/") ? join("public", relative.slice(1)) : relative.replace(/^\//, "");
  try { await access(join(root, filesystemPath)); checked.push(relative); }
  catch { failures.push(`File mancante: ${relative}`); }
}

if (FAMILIAR_HABITAT_THEMES.length < 5) failures.push("Servono almeno cinque ambienti completi.");
for (const theme of FAMILIAR_HABITAT_THEMES) {
  for (const phase of ["alba", "giorno", "pomeriggio", "tramonto", "notte"]) await requireFile(theme.backgrounds[phase]);
  if (!(theme.groundLinePercent >= 65 && theme.groundLinePercent <= 96)) failures.push(`Linea pavimento non valida: ${theme.id}`);
}

for (const base of STARTER_FAMILIARS) {
  const requiredPalettes = base.id === "moon-rabbit" ? 1 : 3;
  if (familiarPalettes(base.id).length < requiredPalettes) failures.push(`Palette insufficienti per ${base.family}`);
  for (const gadget of FAMILIAR_GADGETS) {
    const dressed = familiarAppearanceWithGadget(base, gadget.id);
    await requireFile(dressed.spritePath);
    for (const sequence of Object.values(dressed.behaviors)) await requireFile(sequence.spritePath);
  }
}

if (FAMILIAR_DESTINATIONS.map((entry) => entry.minutes).join(",") !== "5,10,15") failures.push("Le uscite devono durare 5, 10 e 15 minuti.");
const paidOffers = FAMILIAR_SHOP_OFFERS.filter((entry) => entry.priceCents);
if (paidOffers.length === 0) failures.push("Catalogo premium Famiglio assente.");
if (paidOffers.some((entry) => entry.status !== "active")) failures.push("Nel catalogo premium restano offerte non attive.");
if (FAMILIAR_SHOP_OFFERS.some((entry) => entry.kind === "supplies" || Object.hasOwn(entry, "items"))) failures.push("Le cure essenziali non devono diventare acquisti a pagamento.");
if (FAMILIAR_LEVEL_BENEFITS.at(-1)?.level !== 50 || FAMILIAR_LEVEL_BENEFITS.at(-1)?.discountPercent !== 3) failures.push("Progressione commerciale livello 50 non valida.");

for (const relative of [
  "app/api/famiglio/route.ts", "app/api/famiglio/command/route.ts", "app/api/famiglio/missions/route.ts",
  "app/api/famiglio/activity/route.ts", "app/api/checkout/route.ts", "app/api/stripe/webhook/route.ts",
  "lib/nexusFamiliarEngagement.ts", "components/NexusFamiliarCompanion.tsx", "components/NexusFamiliarLegacy.tsx",
  "drizzle/0030_nexus_familiar_economy.sql", "netlify/database/migrations/202608300001_nexus_familiar_economy/migration.sql",
]) await requireFile(relative);

const component = await readFile(join(root, "components", "NexusFamiliarExperience.tsx"), "utf8");
for (const token of ["Notification.requestPermission", "openPaidFamiliarCheckout", "mobile-shop-drawer", "FAMILIAR_GUIDED_TUTORIAL_STEPS"]) {
  if (!component.includes(token)) failures.push(`Funzione interfaccia mancante: ${token}`);
}

const companion = await readFile(join(root, "components", "NexusFamiliarCompanion.tsx"), "utf8");
for (const token of ["familiarReactionForPath", "familiarSmartAlerts", "mission-reward", "FAMILIAR_NOTIFICATIONS_STORAGE_KEY"]) {
  if (!companion.includes(token)) failures.push(`Sistema PIP o avvisi incompleto: ${token}`);
}
const legacy = await readFile(join(root, "components", "NexusFamiliarLegacy.tsx"), "utf8");
for (const token of ["CENTRO RICOMPENSE NEXUS", "Monete disponibili", "Prossimo vantaggio", "rewardTimeline"]) {
  if (!legacy.includes(token)) failures.push(`Centro ricompense incompleto: ${token}`);
}
const missionCatalog = await readFile(join(root, "lib", "nexusFamiliarMissionCatalog.ts"), "utf8");
if (missionCatalog.includes('href: "/guide"')) failures.push("Collegamento missione guide non valido.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`FAMIGLIO RELEASE AUDIT: PASS · ${checked.length} file · ${FAMILIAR_HABITAT_THEMES.length} ambienti · ${STARTER_FAMILIARS.length} specie · ${FAMILIAR_GADGETS.length} look completi`);
}
