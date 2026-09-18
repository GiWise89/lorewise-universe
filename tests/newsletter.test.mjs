import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  NEWSLETTER_CONFIRM_TTL_HOURS,
  createNewsletterToken,
  hashNewsletterToken,
  isConfirmationExpired,
  isNewsletterToken,
  isNewsletterTopic,
  newsletterAcceptedMessage,
  normalizeNewsletterEmail,
  planNewsletterConfirmation,
  planNewsletterSignup,
  validateNewsletterSignup,
} from "../lib/newsletter.ts";
import { renderTransactionalEmail } from "../lib/transactionalEmail.ts";

const valid = { email: "  Lettrice@Esempio.IT ", topic: "cronache", consent: true, website: "" };

test("accepts only allowlisted topics", () => {
  for (const topic of ["cronache", "avvisami:demon-match-android", "avvisami:sandbox"]) assert.equal(isNewsletterTopic(topic), true);
  for (const topic of ["avvisami:altro", "CRONACHE", "", null, "__proto__", "toString"]) assert.equal(isNewsletterTopic(topic), false);
  const result = validateNewsletterSignup({ ...valid, topic: "avvisami:inventato" });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid_topic");
});

test("normalizes the email and rejects malformed addresses", () => {
  assert.equal(normalizeNewsletterEmail("  Lettrice@Esempio.IT "), "lettrice@esempio.it");
  for (const email of ["", "senza-chiocciola", "a@b", "spazio @esempio.it", `${"a".repeat(250)}@esempio.it`, 42]) {
    assert.equal(normalizeNewsletterEmail(email), null);
  }
  const result = validateNewsletterSignup(valid);
  assert.deepEqual(result, { ok: true, email: "lettrice@esempio.it", topic: "cronache" });
  assert.equal(validateNewsletterSignup({ ...valid, email: "nope" }).reason, "invalid_email");
});

test("requires explicit privacy consent as a real boolean", () => {
  for (const consent of [false, "true", 1, undefined, null]) {
    const result = validateNewsletterSignup({ ...valid, consent });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "consent_required");
  }
});

test("flags the honeypot before any other check", () => {
  assert.equal(validateNewsletterSignup({ ...valid, website: "https://spam.example" }).reason, "honeypot");
  assert.equal(validateNewsletterSignup({ ...valid, website: "x", consent: false, topic: "nope" }).reason, "honeypot");
  assert.equal(validateNewsletterSignup({ ...valid, website: 0 }).reason, "honeypot");
  assert.equal(validateNewsletterSignup({ ...valid, website: "   " }).ok, true);
  assert.equal(validateNewsletterSignup({ email: valid.email, topic: "cronache", consent: true }).ok, true);
  for (const body of [null, "stringa", [], 3]) assert.equal(validateNewsletterSignup(body).reason, "invalid_body");
});

test("creates unguessable url-safe tokens and stores only their SHA-256 hash", async () => {
  const first = createNewsletterToken();
  const second = createNewsletterToken();
  assert.notEqual(first, second);
  assert.equal(isNewsletterToken(first), true);
  assert.equal(isNewsletterToken(`${first}=`), false);
  assert.equal(isNewsletterToken("../../etc"), false);
  const hash = await hashNewsletterToken(first);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, await hashNewsletterToken(first));
  assert.notEqual(hash, await hashNewsletterToken(second));
  assert.equal(await hashNewsletterToken("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("plans signups without touching confirmed subscriptions", () => {
  assert.equal(planNewsletterSignup(null), "insert");
  assert.equal(planNewsletterSignup(undefined), "insert");
  assert.equal(planNewsletterSignup("pending"), "refresh");
  assert.equal(planNewsletterSignup("unsubscribed"), "refresh");
  assert.equal(planNewsletterSignup("confirmed"), "noop");
});

test("confirms only pending, unexpired links", () => {
  const now = new Date("2026-09-18T12:00:00Z");
  const recent = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const old = new Date(now.getTime() - (NEWSLETTER_CONFIRM_TTL_HOURS + 1) * 60 * 60 * 1000).toISOString();
  assert.equal(planNewsletterConfirmation(null, now), "invalid");
  assert.equal(planNewsletterConfirmation({ status: "pending", confirm_sent_at: recent }, now), "confirm");
  assert.equal(planNewsletterConfirmation({ status: "pending", confirm_sent_at: old }, now), "expired");
  assert.equal(planNewsletterConfirmation({ status: "pending", confirm_sent_at: null }, now), "expired");
  assert.equal(planNewsletterConfirmation({ status: "confirmed", confirm_sent_at: old }, now), "already_confirmed");
  assert.equal(planNewsletterConfirmation({ status: "unsubscribed", confirm_sent_at: recent }, now), "invalid");
  assert.equal(isConfirmationExpired("non-una-data", now), true);
});

test("acceptance message never hints at whether the address already exists", () => {
  for (const topic of ["cronache", "avvisami:demon-match-android", "avvisami:sandbox"]) {
    assert.match(newsletterAcceptedMessage(topic), /Controlla la posta/);
    assert.doesNotMatch(newsletterAcceptedMessage(topic), /già|esiste|registrat/i);
  }
});

test("renders the double opt-in email through the transactional templates", () => {
  const rendered = renderTransactionalEmail("newsletter_confirmation", { title: "Le Cronache del lunedì", detailUrl: "https://lorewisenexus.it/newsletter/conferma?token=abc" });
  assert.match(rendered.subject, /Conferma l’iscrizione · Le Cronache del lunedì/);
  assert.match(rendered.html, /newsletter\/conferma\?token=abc/);
  assert.match(rendered.html, /Nessuna iscrizione è attiva finché non confermi/);
  assert.doesNotMatch(rendered.html, /Messaggio transazionale collegato al tuo LoreWise ID/);
});

test("signup form ships consent, honeypot and accessible labels, and is placed on the agreed pages", async () => {
  const component = await readFile(new URL("../components/NewsletterSignup.tsx", import.meta.url), "utf8");
  assert.match(component, /type="checkbox" required/);
  assert.match(component, /href="\/privacy"/);
  assert.match(component, /name="website"[^>]*tabIndex=\{-1\}/);
  assert.match(component, /htmlFor=\{`\$\{id\}-email`\}/);
  assert.match(component, /role="alert"/);
  const placements = {
    "../components/SiteFooter.tsx": /variant="cronache"/,
    "../app/cronache-del-nexus/page.tsx": /variant="cronache"/,
    "../app/enciclopedia/page.tsx": /variant="cronache"/,
    "../app/giochi/[slug]/page.tsx": /isDemonMatch \? <div[^>]*><NewsletterSignup variant="avvisami" topic="avvisami:demon-match-android"/,
    "../components/SandboxDossier.tsx": /variant="avvisami" topic="avvisami:sandbox"/,
  };
  for (const [path, pattern] of Object.entries(placements)) {
    assert.match(await readFile(new URL(path, import.meta.url), "utf8"), pattern, path);
  }
  const route = await readFile(new URL("../app/api/newsletter/route.ts", import.meta.url), "utf8");
  assert.match(route, /isRateLimited\(runtime\.DB, "newsletter-ip"/);
  assert.match(route, /isRateLimited\(runtime\.DB, "newsletter-email"/);
  assert.match(route, /origin !== new URL\(request\.url\)\.origin/);
});
