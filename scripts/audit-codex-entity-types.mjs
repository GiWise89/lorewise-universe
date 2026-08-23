import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dossiers = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "third-party-dossiers.generated.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "data", "codex", "fuori-trama-registry.generated.json"), "utf8"));
const registryById = new Map(registry.map((record) => [record.id, record]));
const failures = [];
const counts = { reali: 0, finzione: 0, storicoReligiosi: 0, simboliCreature: 0, fanArt: 0 };
const fact = (dossier, label) => dossier.narrative.find((item) => item.label === label)?.value || "";
const nature = (dossier) => dossier.identity.find((item) => item.label === "Specie o natura")?.value || "";

for (const dossier of dossiers) {
  const record = registryById.get(dossier.slug);
  if (!record) continue;
  const classification = fact(dossier, "Classificazione");
  const identity = `${nature(dossier)} ${classification}`;
  if (/person[ae] real[ei]/i.test(classification)) {
    counts.reali += 1;
    if (/personaggio di finzione/i.test(identity)) failures.push(`${dossier.slug}: persona reale classificata anche come personaggio di finzione`);
  }
  if (classification === "Personaggio di finzione" || /personagg[io]+ ricorrent/i.test(classification)) {
    counts.finzione += 1;
    if (/person[ae] real[ei]/i.test(identity)) failures.push(`${dossier.slug}: personaggio di finzione classificato anche come persona reale`);
  }
  if (/storica e religiosa/i.test(classification)) {
    counts.storicoReligiosi += 1;
    if (/finzione/i.test(identity)) failures.push(`${dossier.slug}: figura storico-religiosa classificata come finzione`);
  }
  if (/simbolo|animale preistorico|creatura|entit[aà]|antropomorf|pok[eé]mon/i.test(classification)) {
    counts.simboliCreature += 1;
    if (/person[ae] real[ei]/i.test(identity)) failures.push(`${dossier.slug}: simbolo o creatura classificato come persona reale`);
  }
  if (["Carte Extra · Fan Art", "GiWise Fan Art"].includes(record.franchise)) {
    counts.fanArt += 1;
    const editorialText = `${dossier.editorial?.verificationLabel || ""} ${dossier.editorial?.sourcePolicy || ""} ${dossier.catalog?.continuity || ""} ${dossier.summary?.value || ""}`;
    if (dossier.editorial?.verificationLabel !== "Opera derivata approfondita · canone separato" || !/non canonic|canone separato/i.test(editorialText)) failures.push(`${dossier.slug}: fan art senza separazione esplicita dal canone`);
  }
}
for (const [category, count] of Object.entries(counts)) if (!count) failures.push(`${category}: nessuna scheda controllata`);
if (failures.length) {
  console.error(`Audit dei cinque tipi fallito (${failures.length} problemi):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`Cinque controlli superati: ${counts.reali} persone reali, ${counts.finzione} personaggi di finzione, ${counts.storicoReligiosi} figure storico-religiose, ${counts.simboliCreature} simboli o creature, ${counts.fanArt} fan art GiWise.`);
