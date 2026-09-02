import { familiarExperienceForLevel, FAMILIAR_MILESTONES } from "../lib/nexusFamiliarProgression.ts";

const profiles = [
  { name: "Saltuario", dailyExperience: 70, dailyCoins: 12 },
  { name: "Regolare", dailyExperience: 175, dailyCoins: 30 },
  { name: "Assiduo", dailyExperience: 270, dailyCoins: 55 },
];

const rows = profiles.flatMap((profile) => FAMILIAR_MILESTONES.map((milestone) => ({
  profilo: profile.name,
  livello: milestone.level,
  giorni: Math.ceil(familiarExperienceForLevel(milestone.level) / profile.dailyExperience),
})));

const regularLevel50 = rows.find((row) => row.profilo === "Regolare" && row.livello === 50)?.giorni ?? 0;
if (regularLevel50 < 280 || regularLevel50 > 380) throw new Error(`Livello 50 regolare fuori obiettivo: ${regularLevel50} giorni`);

const regularCoinsInMonth = (profiles.find((profile) => profile.name === "Regolare")?.dailyCoins ?? 0) * 30;
if (regularCoinsInMonth < 700 || regularCoinsInMonth > 1000) throw new Error(`Economia mensile fuori obiettivo: ${regularCoinsInMonth} monete`);

console.table(rows);
console.log(`BILANCIAMENTO FAMIGLIO: PASS · livello 50 regolare in ${regularLevel50} giorni · ${regularCoinsInMonth} monete/mese`);
