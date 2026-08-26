import assert from "node:assert/strict";
import test from "node:test";
import { renderMarketingEmail } from "../lib/marketingEmail.ts";

test("renders a GiWise Studio campaign with a direct unsubscribe path", () => {
  const rendered = renderMarketingEmail({
    subject: "Una nuova opera è arrivata",
    heading: "Entra nel nuovo mondo.",
    body: "La nuova collezione è disponibile.\n\nApri l’archivio per scoprirla.",
    actionLabel: "Scopri la collezione",
    actionUrl: "https://lorewisenexus.it/arte",
  }, "https://lorewisenexus.it/email-preferences/unsubscribe?token=test");
  assert.match(rendered.html, /Scopri la collezione/);
  assert.match(rendered.html, /email-preferences\/unsubscribe\?token=test/);
  assert.match(rendered.html, /ricevute e i messaggi necessari/i);
  assert.doesNotMatch(rendered.html, /tracking|pixel/i);
});

test("escapes campaign content", () => {
  const rendered = renderMarketingEmail({ subject: "Test", heading: "<img src=x>", body: "<script>alert(1)</script>" }, "https://example.test/unsubscribe");
  assert.doesNotMatch(rendered.html, /<script>|<img src=x>/);
  assert.match(rendered.html, /&lt;script&gt;/);
});

test("does not inject tracking pixels or remote images", () => {
  const rendered = renderMarketingEmail({ subject: "Test", heading: "Titolo", body: "Messaggio" }, "https://example.test/unsubscribe");
  assert.doesNotMatch(rendered.html, /<img|open_pixel|utm_/i);
});
