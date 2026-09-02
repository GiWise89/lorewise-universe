import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { lorewiseAndroidRelease } from "../lib/appReleases.ts";

test("the Famiglio Android download points to the signed local release artifact", () => {
  assert.equal(lorewiseAndroidRelease.status, "available");
  assert.equal(lorewiseAndroidRelease.version, "1.1.1");
  assert.match(lorewiseAndroidRelease.downloadHref ?? "", /^\/downloads\/Famiglio-del-Nexus-Android-/);
  const relative = lorewiseAndroidRelease.downloadHref?.replace(/^\//, "") ?? "";
  const file = new URL(`../public/${relative}`, import.meta.url);
  assert.equal(existsSync(file), true);
  assert.ok(statSync(file).size > 100_000);
  const sha256 = createHash("sha256").update(readFileSync(file)).digest("hex");
  assert.equal(sha256, lorewiseAndroidRelease.sha256);
});

test("the Android release page explains notifications and installation without mojibake", () => {
  const source = readFileSync(new URL("../app/download-app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Il Famiglio sempre con te/);
  assert.match(source, /È tornato dall’uscita/);
  assert.match(source, /Autorizza questa origine/);
  assert.doesNotMatch(source, /Ã|â€™|â†/);
});
