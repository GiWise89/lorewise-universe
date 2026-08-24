import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("la community espone like, commenti, risposte e moderazione", () => {
  const api = read("app/api/art-community/route.ts");
  const ui = read("components/ArtworkCommunity.tsx");
  for (const action of ["toggle_like", "toggle_comment_like", "edit_comment", "delete_comment", "report_comment", "parentCommentId"]) {
    assert.match(api, new RegExp(action));
  }
  for (const label of ["Mi piace", "Commenta", "Rispondi", "Segnala", "Modifica", "Elimina"]) {
    assert.ok(ui.includes(label), `Azione UI mancante: ${label}`);
  }
});

test("l'archivio usa la stessa community con barra compatta e profilo obbligatorio", () => {
  const catalog = read("components/ArtCatalog.tsx");
  const compact = read("components/ArtworkCardSocial.tsx");
  const gate = read("components/ProfileCompletionGate.tsx");
  const profileApi = read("app/api/account/profile/route.ts");
  assert.ok(catalog.includes("ArtworkCardSocial"));
  assert.ok(compact.includes("/api/art-community"));
  assert.ok(compact.includes("toggle_like"));
  assert.ok(compact.includes('action: "comment"'));
  assert.ok(compact.includes("Apri la conversazione completa"));
  assert.ok(gate.includes("Completa il profilo"));
  assert.ok(profileApi.includes("profileCompletion"));
});

test("profili pubblici e avatar hanno privacy e validazione", () => {
  const profile = read("app/api/account/profile/route.ts");
  const avatar = read("app/api/account/avatar/route.ts");
  const publicAvatar = read("app/api/profile-avatar/[username]/route.ts");
  for (const field of ["username", "profileVisibility"]) assert.ok(profile.includes(field));
  assert.ok(avatar.includes("ACCOUNT_PROFILE_LIMITS.avatarBytes"));
  assert.ok(avatar.includes("detectedType"));
  assert.ok(publicAvatar.includes("profile_visibility = 'public'"));
  assert.ok(publicAvatar.includes('"Cache-Control": "private, no-store"'));
});

test("la sincronizzazione dell'accesso non sovrascrive il nome pubblico salvato", () => {
  const customerSync = read("lib/supabase/customer.ts");
  const conflictUpdate = customerSync.slice(customerSync.indexOf("ON CONFLICT(id) DO UPDATE SET"));
  assert.ok(conflictUpdate.includes("email = excluded.email"));
  assert.doesNotMatch(conflictUpdate, /display_name\s*=\s*excluded\.display_name/);
});

test("le notifiche possono essere lette e rimosse in modo persistente", () => {
  const api = read("app/api/notifications/route.ts");
  const adminApi = read("app/api/admin/notifications/route.ts");
  const header = read("components/SiteHeader.tsx");
  for (const action of ["read", "read_all", "dismiss", "dismiss_read"]) assert.ok(api.includes(action));
  assert.ok(api.includes("dismissed_at IS NULL"));
  assert.ok(api.includes("new Date().toISOString()"));
  assert.ok(adminApi.includes("new Date().toISOString()"));
  assert.doesNotMatch(api, /COALESCE\([^\n]*CURRENT_TIMESTAMP/);
  assert.doesNotMatch(adminApi, /COALESCE\([^\n]*CURRENT_TIMESTAMP/);
  assert.ok(header.includes('href="/notifiche"'));
  assert.ok(header.includes("lorewise:notifications-updated"));
});
