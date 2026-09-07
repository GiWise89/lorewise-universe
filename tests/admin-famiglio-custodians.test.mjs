import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("il registro Famigli e riservato esclusivamente al proprietario", () => {
  const api = read("app/api/admin/famigli/route.ts");
  assert.ok(api.includes("requireOrderAdmin"));
  assert.ok(api.includes("LOREWISE_OWNER_EMAIL"));
  assert.ok(api.includes("auth.adminEmail"));
  assert.ok(api.includes("Accesso riservato al proprietario LoreWise"));
  assert.ok(api.includes('"Cache-Control": "private, no-store"'));
});

test("il registro collega salvataggi, email e sole informazioni riepilogative", () => {
  const api = read("app/api/admin/famigli/route.ts");
  assert.ok(api.includes("nexus_pet_rebuild_saves"));
  assert.ok(api.includes("INNER JOIN customers"));
  assert.ok(api.includes("totalCustodians"));
  assert.ok(api.includes("totalFamiliars"));
  assert.ok(api.includes("summarizeSave"));
  assert.doesNotMatch(api, /Response\.json\([^)]*save_json/s);
});

test("il Centro Admin mostra numero, email e Famigli soltanto quando autorizzato", () => {
  const ui = read("components/AdminControlCenter.tsx");
  assert.ok(ui.includes('/api/admin/famigli'));
  assert.ok(ui.includes('response.status === 403'));
  assert.ok(ui.includes("Custodi dei Famigli"));
  assert.ok(ui.includes("custodian.email"));
  assert.ok(ui.includes("famiglioCustodians.totalCustodians"));
});

test("le opzioni del selettore avversario restano leggibili sul menu chiaro", () => {
  const styles = read("components/FamiglioCombatArena.module.css");
  assert.match(styles, /\.opponentDropdown select option\s*\{[^}]*background:\s*#fffaf0;[^}]*color:\s*#24102d;/s);
});
