import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DAYS = 60;
const profiles = [
  { id: "casual", careDaysPerWeek: 4, dailyCareXp: 22, dailyCoins: 8, expeditionsPerCareDay: 1, battlesPerCareDay: .35 },
  { id: "regolare", careDaysPerWeek: 6, dailyCareXp: 36, dailyCoins: 15, expeditionsPerCareDay: 2, battlesPerCareDay: .8 },
  { id: "intenso", careDaysPerWeek: 7, dailyCareXp: 40, dailyCoins: 15, expeditionsPerCareDay: 3, battlesPerCareDay: 1.5 },
];

function simulate(profile) {
  let bondXp = 0;
  let nexusCoins = 0;
  let adventureXp = 0;
  let combatXp = 0;
  let careDays = 0;
  let youngDay = null;
  let adultDay = null;
  for (let day = 1; day <= DAYS; day += 1) {
    const active = (day % 7) < profile.careDaysPerWeek;
    if (!active) continue;
    careDays += 1;
    bondXp += Math.min(40, profile.dailyCareXp);
    nexusCoins += profile.dailyCoins;
    adventureXp += profile.expeditionsPerCareDay * 34;
    nexusCoins += profile.expeditionsPerCareDay * 15;
    combatXp += profile.battlesPerCareDay * 70;
    nexusCoins += profile.battlesPerCareDay * 11;
    if (!youngDay && bondXp >= 900 && careDays >= 14) youngDay = day;
    if (!adultDay && bondXp >= 3500 && careDays >= 35) adultDay = day;
  }
  return {
    profile: profile.id,
    days: DAYS,
    careDays,
    bondXp: Math.round(bondXp),
    nexusCoins: Math.round(nexusCoins),
    adventureXp: Math.round(adventureXp),
    combatXp: Math.round(combatXp),
    youngDay,
    adultDay,
  };
}

const results = profiles.map(simulate);
const failures = [];
const intense = results.find((result) => result.profile === "intenso");
if (intense?.youngDay && intense.youngDay < 22) failures.push("La fase Giovane arriva troppo presto rispetto al limite XP giornaliero.");
if (intense?.adultDay && intense.adultDay < 60) failures.push("La fase Adulto arriva prima del periodo di cura progettato.");
if ((intense?.nexusCoins ?? 0) > 7_500) failures.push("Accumulo di Monete Nexus eccessivo in 60 giorni.");

const report = { generatedAt: new Date().toISOString(), results, failures, passed: failures.length === 0 };
const outputDir = path.join(process.cwd(), "artifacts");
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "famiglio-economy-60-days.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;

