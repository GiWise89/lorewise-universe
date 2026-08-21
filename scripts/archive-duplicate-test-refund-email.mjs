import { readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const orderReference = process.argv[2]?.trim();
if (!orderReference) throw new Error("Indica il codice ordine di collaudo.");
const directory = join(process.cwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const file = readdirSync(directory).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
if (!file) throw new Error("Database locale non trovato.");
const database = new DatabaseSync(join(directory, file));
const rows = database.prepare(`SELECT id FROM transactional_emails
  WHERE template = 'order_refunded' AND payload_json LIKE ? AND status = 'sent'
  ORDER BY created_at ASC`).all(`%${orderReference}%`);
for (const duplicate of rows.slice(1)) {
  database.prepare("UPDATE transactional_emails SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(duplicate.id);
}
console.log(`${orderReference}: ${Math.max(0, rows.length - 1)} notifica duplicata archiviata.`);
database.close();
