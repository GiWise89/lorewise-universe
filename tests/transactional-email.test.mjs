import assert from "node:assert/strict";
import test from "node:test";
import { renderTransactionalEmail } from "../lib/transactionalEmail.ts";

test("renders distinct commercial messages with the correct destination", () => {
  const purchase = renderTransactionalEmail("order_paid", { referenceCode: "LW-20260820-ABC123", title: "Legami Infernali", amountLabel: "17,90 €", detailUrl: "https://lorewisenexus.it/account/ordini/LW-20260820-ABC123" });
  assert.match(purchase.subject, /Acquisto confermato/);
  assert.match(purchase.html, /Il tuo acquisto è nella Libreria/);
  assert.match(purchase.html, /account\/ordini\/LW-20260820-ABC123/);

  const collection = renderTransactionalEmail("order_paid", { referenceCode: "LW-HALLOWEEN-002", title: "Collezione horror · Incubi Interiori", amountLabel: "24,90 €", collectionSize: 3, detailUrl: "https://lorewisenexus.it/account/ordini/LW-HALLOWEEN-002" });
  assert.match(collection.subject, /Collezione confermata/);
  assert.match(collection.html, /3 pacchetti protetti/);
  assert.match(collection.html, /licenza personale per ogni opera/);
  assert.match(collection.html, /Apri i download della collezione/);

  const pass = renderTransactionalEmail("subscription_activated", { planLabel: "Universe Pass Collector", accountUrl: "https://lorewisenexus.it/account" });
  assert.match(pass.subject, /Universe Pass attivo/);
  assert.match(pass.html, /crediti, sconti e accessi/i);

  const commission = renderTransactionalEmail("commission_payment", { referenceCode: "LW-REQ-20260820-ABC123", title: "Ritratto Completo", phaseLabel: "Acconto", amountLabel: "20,00 €", detailUrl: "https://lorewisenexus.it/commissioni/stato" });
  assert.match(commission.subject, /Acconto confermato/);
  assert.match(commission.html, /commissioni\/stato/);
});

test("escapes user-provided text in transactional email HTML", () => {
  const rendered = renderTransactionalEmail("commission_received", { name: "<script>alert(1)</script>", title: "<b>Ritratto</b>", referenceCode: "LW-REQ-TEST" });
  assert.doesNotMatch(rendered.html, /<script>/);
  assert.doesNotMatch(rendered.html, /<b>Ritratto<\/b>/);
  assert.match(rendered.html, /&lt;script&gt;/);
});
