import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("l'hero dell'Area personale non impone ritorni a capo e mantiene una scala controllata", () => {
  const page = read("app/account/page.tsx");
  const styles = read("app/globals.css");
  assert.match(page, /Il tuo universo, sempre con te/);
  assert.doesNotMatch(page, /Tutto ciò che<br/);
  assert.match(styles, /\.account-hero-copy \{[^}]*border-left:4px solid/s);
  assert.match(styles, /\.account-hero \.eyebrow \{[^}]*margin:0 0 clamp\(30px/);
  assert.match(styles, /\.account-hero h1 \{[^}]*word-break:normal;[^}]*hyphens:none/s);
  assert.match(styles, /\.account-principle \.eyebrow \{[^}]*margin:0 0 clamp\(26px/);
  assert.match(styles, /\.account-principle h2 \{ margin-top:0; \}/);
});

test("le card Universe Pass separano titolo, vantaggi e azione", () => {
  const styles = read("app/abbonamento/pass-focus.module.css");
  assert.match(styles, /\.planCard\{display:flex;min-width:0;flex-direction:column/);
  assert.match(styles, /\.planCard ul\{margin:28px 0/);
  assert.match(styles, /membership-purchase-action\)\{margin-top:auto/);
  assert.match(styles, /\.planTop h3\{[^}]*word-break:normal;hyphens:none/);
});

test("Codex e richiesta commissione tengono separati soprattitoli e titoli", () => {
  const codexPage = read("app/enciclopedia/page.tsx");
  const codexStyles = read("app/enciclopedia/codex.css");
  const globalStyles = read("app/globals.css");
  assert.match(codexPage, /<h1>LoreWise Codex\.<\/h1>/);
  assert.match(codexStyles, /\.codex-home-copy>\.eyebrow\{[^}]*margin:0 0 clamp\(22px/);
  assert.match(globalStyles, /\.commission-request-focus-intro \.eyebrow\{[^}]*margin:0 0 clamp\(22px/);
  assert.match(globalStyles, /\.commission-request-promotion-summary \.commission-promotion-banner\{[^}]*background:radial-gradient/s);
});

test("le tre intestazioni principali di GiWise Shop non toccano i soprattitoli", () => {
  const styles = read("app/globals.css");
  assert.match(styles, /\.giwise-shop-hero-copy>\.eyebrow,[\s\S]*\.giwise-shop-support>div>\.eyebrow\{display:block;margin:0 0 clamp\(28px/);
  assert.match(styles, /\.giwise-shop-hero-copy>h1,[\s\S]*\.giwise-shop-support>div>h2\{margin-top:0\}/);
});
