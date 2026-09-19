import assert from "node:assert/strict";
import test from "node:test";
import { isSameSiteOrigin, siteOriginFor } from "../lib/requestOrigin.ts";

test("accetta il dominio pubblico anche quando Netlify espone un indirizzo interno", () => {
  const internal = new Request("https://main--lorewise.netlify.app/api/account/session", { method: "POST" });
  assert.equal(isSameSiteOrigin(internal, "https://lorewisenexus.it"), true);
  assert.equal(isSameSiteOrigin(internal, "https://www.lorewisenexus.it"), true);
  assert.equal(isSameSiteOrigin(internal, "https://main--lorewise.netlify.app"), true);
  assert.equal(isSameSiteOrigin(internal, null), true);
  assert.equal(isSameSiteOrigin(internal, "https://evil.example"), false);
  assert.equal(siteOriginFor(internal), "https://lorewisenexus.it");
  assert.equal(siteOriginFor(new Request("http://localhost:3130/x")), "http://localhost:3130");
});
