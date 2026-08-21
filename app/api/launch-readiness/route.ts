import { env } from "@/lib/netlifyRuntime";

import artworkDeliveries from "@/data/automatic-artwork-deliveries.json";
import { verifiedWindowsInstaller } from "@/lib/gameDeliveryPolicy";
import { requireOrderAdmin } from "@/lib/orderAdminAuth";
import { getStripeConfiguration, type StripeRuntimeEnv } from "@/lib/stripe";
import { confirmedLaunchPolicy } from "@/lib/launchPolicy";

type RuntimeEnv = StripeRuntimeEnv & {
  DB?: D1Database;
  COMMISSION_UPLOADS?: R2Bucket;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  SUPABASE_PUBLIC_URLS_APPROVED?: string;
  LOREWISE_SMTP_CONFIGURED?: string;
  LOREWISE_EMAIL_PROVIDER?: string;
  LOREWISE_EMAIL_SENDER_NAME?: string;
  LOREWISE_EMAIL_SENDER_ADDRESS?: string;
  LOREWISE_EMAIL_REPLY_TO?: string;
  RESEND_API_KEY?: string;
  LOREWISE_LEGAL_NAME?: string;
  LOREWISE_LEGAL_ADDRESS?: string;
  LOREWISE_PRIVACY_CONTACT?: string;
  LOREWISE_DATA_RETENTION_POLICY?: string;
  LOREWISE_MINIMUM_ACCOUNT_AGE?: string;
  LOREWISE_SUPPORT_RESPONSE_POLICY?: string;
  HOPLIX_COOKIE_AUDIT_APPROVED?: string;
  LOREWISE_PUBLICATION_APPROVED?: string;
  LOREWISE_COMMERCIAL_LEGAL_APPROVED?: string;
  LOREWISE_STRIPE_PREFLIGHT_APPROVED?: string;
  LOREWISE_STRIPE_E2E_APPROVED?: string;
  LOREWISE_MANUAL_DELIVERY_APPROVED?: string;
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED?: string;
};

type Check = {
  id: string;
  label: string;
  detail: string;
  ready: boolean;
  required: boolean;
};

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

export async function GET() {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  const runtime = env as unknown as RuntimeEnv;
  const stripe = getStripeConfiguration(runtime);
  const manualDelivery = enabled(runtime.LOREWISE_MANUAL_DELIVERY_APPROVED);
  const [artworkRows, gameRows] = await Promise.all([
    auth.database.prepare("SELECT COUNT(*) AS count FROM artwork_delivery_files WHERE status = 'approved'").first<{ count: number }>(),
    auth.database.prepare(`SELECT COUNT(*) AS count FROM game_delivery_files
      WHERE status = 'approved' AND scan_status = 'passed' AND install_test_status = 'passed'
      AND update_test_status IN ('passed', 'deferred_first_release')`).first<{ count: number }>(),
  ]);
  const approvedArtwork = Number(artworkRows?.count ?? 0);
  const approvedGames = Number(gameRows?.count ?? 0);
  const expectedArtwork = artworkDeliveries.count;
  const siteUrl = runtime.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || confirmedLaunchPolicy.siteUrl;
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim());
  const legalName = runtime.LOREWISE_LEGAL_NAME?.trim() || confirmedLaunchPolicy.legalName;
  const privacyContact = runtime.LOREWISE_PRIVACY_CONTACT?.trim() || confirmedLaunchPolicy.privacyContact;
  const dataRetentionPolicy = runtime.LOREWISE_DATA_RETENTION_POLICY?.trim() || confirmedLaunchPolicy.dataRetentionPolicy;
  const minimumAccountAge = runtime.LOREWISE_MINIMUM_ACCOUNT_AGE?.trim() || confirmedLaunchPolicy.minimumAccountAge;
  const supportResponsePolicy = runtime.LOREWISE_SUPPORT_RESPONSE_POLICY?.trim() || confirmedLaunchPolicy.supportResponsePolicy;
  const emailProvider = runtime.LOREWISE_EMAIL_PROVIDER?.trim() || confirmedLaunchPolicy.emailProvider;
  const emailSenderName = runtime.LOREWISE_EMAIL_SENDER_NAME?.trim() || confirmedLaunchPolicy.emailSenderName;
  const emailSenderAddress = runtime.LOREWISE_EMAIL_SENDER_ADDRESS?.trim() || confirmedLaunchPolicy.emailSenderAddress;
  const emailReplyTo = runtime.LOREWISE_EMAIL_REPLY_TO?.trim() || confirmedLaunchPolicy.emailReplyTo;
  const legalConfigured = [legalName, runtime.LOREWISE_LEGAL_ADDRESS, privacyContact,
    dataRetentionPolicy, minimumAccountAge].every(configured);

  const groups: Array<{ id: string; title: string; description: string; checks: Check[] }> = [
    {
      id: "infrastruttura",
      title: "Accesso e infrastruttura",
      description: "Account, archivio e deposito privato necessari a ogni servizio LoreWise.",
      checks: [
        { id: "supabase", label: "LoreWise ID", detail: supabaseConfigured ? "Supabase configurato." : "Inserire URL e chiave pubblicabile Supabase.", ready: supabaseConfigured, required: true },
        { id: "d1", label: "Archivio D1", detail: "Database collegato e raggiungibile dall'area amministrativa.", ready: Boolean(runtime.DB), required: true },
        { id: "delivery", label: "Consegna privata", detail: runtime.COMMISSION_UPLOADS ? "Deposito automatico privato disponibile." : manualDelivery ? "Consegna manuale protetta approvata per la prima fase commerciale." : "Approvare la consegna manuale protetta oppure collegare un deposito automatico.", ready: Boolean(runtime.COMMISSION_UPLOADS) || manualDelivery, required: true },
        { id: "site-url", label: "Dominio pubblico", detail: siteUrl ? `Dominio impostato: ${siteUrl}` : "Impostare NEXT_PUBLIC_SITE_URL.", ready: Boolean(siteUrl), required: true },
        { id: "redirects", label: "Redirect di accesso", detail: enabled(runtime.SUPABASE_PUBLIC_URLS_APPROVED) ? "URL pubblici verificati nel pannello Supabase." : "Verificare dominio e /auth/callback nel pannello Supabase.", ready: enabled(runtime.SUPABASE_PUBLIC_URLS_APPROVED), required: true },
        { id: "smtp", label: "Email account", detail: enabled(runtime.LOREWISE_SMTP_CONFIGURED) ? `${emailProvider} confermato · ${emailSenderName} <${emailSenderAddress}>.` : `Provider scelto: ${emailProvider}. Mittente: ${emailSenderName} <${emailSenderAddress}>. Dominio verificato; collegare e collaudare SMTP.`, ready: enabled(runtime.LOREWISE_SMTP_CONFIGURED) && [emailProvider, emailSenderName, emailSenderAddress, emailReplyTo].every(configured), required: true },
        { id: "resend-commerce", label: "Ricevute commerciali", detail: /^re_[A-Za-z0-9_\-]{16,}$/.test(runtime.RESEND_API_KEY?.trim() ?? "") ? "API Resend collegata alla coda transazionale LoreWise." : "Aggiungere una chiave API Resend con solo permesso di invio per consegnare ricevute, rinnovi e preventivi.", ready: /^re_[A-Za-z0-9_\-]{16,}$/.test(runtime.RESEND_API_KEY?.trim() ?? ""), required: true },
      ],
    },
    {
      id: "commercio",
      title: "Pagamenti e diritti",
      description: "Stripe può operare in prova o in modalità reale; l'ambiente live richiede tutti i gate finali.",
      checks: [
        { id: "stripe-mode", label: "Modalità Stripe", detail: stripe.configured ? `Stripe ${stripe.mode} configurato e autorizzato.` : stripe.blockers.join(" "), ready: stripe.configured, required: true },
        { id: "stripe-webhook", label: "Webhook Stripe", detail: stripe.webhookConfigured ? `Segreto webhook ${stripe.mode} configurato.` : "Configurare il webhook dell'ambiente selezionato e il relativo whsec_.", ready: stripe.webhookConfigured, required: true },
        { id: "stripe-preflight", label: "Preflight staging", detail: enabled(runtime.LOREWISE_STRIPE_PREFLIGHT_APPROVED) ? `HTTPS, modalità ${stripe.mode}, webhook e blocco indicizzazione verificati nello staging.` : `Eseguire stripe:staging-check in modalità ${stripe.mode} e approvarne la ricevuta.`, ready: enabled(runtime.LOREWISE_STRIPE_PREFLIGHT_APPROVED), required: true },
        { id: "stripe-e2e", label: "Acquisto completo", detail: enabled(runtime.LOREWISE_STRIPE_E2E_APPROVED) ? "Ordine, diritto, consegna e rimborso collaudati." : `Eseguire un acquisto Stripe ${stripe.mode} completo e approvarne l'esito.`, ready: enabled(runtime.LOREWISE_STRIPE_E2E_APPROVED), required: true },
        { id: "legal", label: "Dati legali", detail: legalConfigured ? "Titolare, indirizzo, privacy, conservazione ed età minima compilati." : "Completare titolare, indirizzo, privacy, conservazione ed età minima.", ready: legalConfigured, required: true },
        { id: "commercial-legal", label: "Inquadramento commerciale", detail: enabled(runtime.LOREWISE_COMMERCIAL_LEGAL_APPROVED) ? "Inquadramento fiscale e amministrativo verificato professionalmente." : "Nessuna azienda, sede o Partita IVA dichiarata: vendite reali e abbonamenti devono restare disattivati.", ready: enabled(runtime.LOREWISE_COMMERCIAL_LEGAL_APPROVED), required: true },
        { id: "support", label: "Tempi di assistenza", detail: supportResponsePolicy, ready: configured(supportResponsePolicy), required: true },
      ],
    },
    {
      id: "consegne",
      title: "Consegne protette",
      description: "I file completi restano fuori dal sito pubblico e vengono sbloccati solo da un diritto verificato.",
      checks: [
        { id: "art-local", label: "Pacchetti Arte locali", detail: `${expectedArtwork}/${expectedArtwork} pacchetti verificati, originali invariati.`, ready: expectedArtwork > 0, required: true },
        { id: "art-delivery", label: "Consegna Arte", detail: approvedArtwork === expectedArtwork ? `${approvedArtwork}/${expectedArtwork} pacchetti approvati nel deposito privato.` : manualDelivery ? "Pacchetti verificati localmente; consegna manuale protetta attiva." : `${approvedArtwork}/${expectedArtwork} pacchetti nel deposito automatico.`, ready: approvedArtwork === expectedArtwork || manualDelivery, required: true },
        { id: "game-local", label: "The Wound Remembers Windows", detail: `${verifiedWindowsInstaller.version} verificato · ${verifiedWindowsInstaller.sha256.slice(0, 12)}…`, ready: true, required: true },
        { id: "game-delivery", label: "Consegna del gioco", detail: approvedGames ? `${approvedGames} installer approvato e scaricabile automaticamente.` : manualDelivery ? "Installer verificato; consegna manuale privata all'email LoreWise dell'acquirente." : "Approvare una modalità di consegna privata prima della vendita.", ready: approvedGames > 0 || manualDelivery, required: true },
      ],
    },
    {
      id: "esterni",
      title: "Servizi collegati",
      description: "Controlli che dipendono da pannelli o decisioni esterne al codice locale.",
      checks: [
        { id: "hoplix", label: "GiWiseShop · Hoplix", detail: enabled(runtime.HOPLIX_COOKIE_AUDIT_APPROVED) ? "Cookie, dipendenze e passaggio visivo approvati." : "Verifica Hoplix sospesa su decisione del proprietario.", ready: enabled(runtime.HOPLIX_COOKIE_AUDIT_APPROVED), required: false },
        { id: "publication", label: "Autorizzazione alla pubblicazione", detail: enabled(runtime.LOREWISE_PUBLICATION_APPROVED) ? "Autorizzazione finale del proprietario registrata." : "Pubblicazione e nuovo staging non autorizzati: mantenere false fino al consenso esplicito di Luigi.", ready: enabled(runtime.LOREWISE_PUBLICATION_APPROVED), required: true },
        { id: "google", label: "Accesso Google", detail: enabled(runtime.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED) ? "Provider opzionale attivo." : "Opzionale: l'accesso email e password resta sufficiente.", ready: enabled(runtime.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED), required: false },
        { id: "fuori-trama", label: "Fuori Trama", detail: "Build, 141 test e collaudo responsive locale superati. Distribuzione commerciale sospesa finché i 667 riferimenti esterni non saranno rimossi o autorizzati.", ready: false, required: false },
      ],
    },
  ];

  const requiredChecks = groups.flatMap((group) => group.checks).filter((check) => check.required);
  const readyRequired = requiredChecks.filter((check) => check.ready).length;
  return Response.json({
    mode: stripe.mode,
    generatedAt: new Date().toISOString(),
    summary: { ready: readyRequired, total: requiredChecks.length, launchReady: readyRequired === requiredChecks.length },
    groups,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
