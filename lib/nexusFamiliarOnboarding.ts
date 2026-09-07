import type { FamiliarCareCommand } from "./nexusFamiliarActions.ts";

export const FAMILIAR_GUEST_ACTION_LIMIT = 2;
export const FAMILIAR_STORAGE_KEY = "lorewise:nexus-familiar:v1";
export const FAMILIAR_GUEST_ACTION_STORAGE_KEY = "lorewise:nexus-familiar:guest-actions:v1";
export const FAMILIAR_ID_PROMPT_STORAGE_KEY = "lorewise:nexus-familiar:id-prompt:v1";
export const FAMILIAR_TUTORIAL_STORAGE_KEY = "lorewise:nexus-familiar:tutorial:v1";
export const FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX = "lorewise:nexus-familiar:context-tip:v2:";

export const FAMILIAR_ID_ADVANTAGES = [
  "Crea il LoreWise ID per trasformare questa prova in un legame permanente",
  "Salvataggio e sincronizzazione automatica del Famiglio",
  "Missioni giornaliere e ricompense reali",
  "Crescita completa fino al livello 50",
  "Monete Nexus per sbloccare nuove tane e look",
  "Vantaggi e piccoli sconti dal livello 10",
  "Protezione dei progressi su più dispositivi",
  "Diario, personalità, scoperte e cartoline conservati nel tuo legame",
] as const;

export const FAMILIAR_GUIDED_TUTORIAL_STEPS = [
  { title: "Vive nella sua tana", copy: "Qui il tuo Famiglio vive, esplora e riposa. Osserva i suoi bisogni e scopri come cambia il suo umore durante la giornata.", target: "habitat", view: "den" },
  { title: "Prenditene cura", copy: "Offrigli del cibo, lavalo, gioca con lui, curalo e lascialo riposare. Ogni gesto rafforza il vostro legame.", target: "care", view: "den", panel: "actions" },
  { title: "Il legame continua", copy: "Accompagnalo nelle uscite, completa le Missioni e raccogli i ricordi del vostro Legame. Puoi aggiungere fino a due Case separate per crescere tre Famigli senza perdere i loro progressi.", target: "utilities", view: "den" },
] as const;

export const FAMILIAR_CONTEXTUAL_TIPS = {
  outside: "Scegli 5, 10 o 15 minuti. Vedrai la partenza, il tempo restante e il piccolo racconto portato al ritorno.",
  shop: "Qui trovi soltanto Tane illustrate complete, look e nuovi Famigli. L'anteprima non consuma Monete Nexus.",
  legacy: "Ricordi, personalità, scoperte e cartoline crescono con le azioni reali compiute insieme.",
  missions: "Le Missioni premiano attività vere. Saltare un giorno non azzera il legame e non fa perdere il Famiglio.",
} as const;

export const FAMILIAR_CONTEXTUAL_TUTORIAL_LABELS = {
  outside: "FUORI CASA",
  shop: "BOTTEGA",
  legacy: "LEGAME",
  missions: "MISSIONI E RITUALI",
} as const;

export const FAMILIAR_CONTEXTUAL_TUTORIALS = {
  outside: [
    { title: "Scegli la tua uscita", copy: "Ogni percorso indica durata, energia richiesta e ricompensa. Le uscite da 5, 10 e 15 minuti diventano più ricche procedendo di livello.", target: "outside-intro", view: "outside", panel: "outside" },
    { title: "Segui tutto il viaggio", copy: "Dopo la partenza vedrai il tempo restante. Al ritorno accogli il Famiglio per ricevere il racconto e riscuotere la ricompensa.", target: "outside-options", view: "outside", panel: "outside" },
    { title: "Conserva ciò che scopre", copy: "Alcune uscite portano reperti, ricordi o cartoline illustrate. Li ritroverai nella sezione Legame senza perdere nulla se torni più tardi.", target: "outside-intro", view: "outside", panel: "outside" },
  ],
  shop: [
    { title: "Esplora i reparti", copy: "Ambienti, Look e Famigli premium sono separati in reparti chiari. Le Tane sono illustrazioni complete e non richiedono di collocare arredi uno per uno.", target: "shop-tabs", view: "shop", panel: "shop" },
    { title: "Guarda prima di scegliere", copy: "Le anteprime temporanee mostrano il risultato nella Tana senza consumare Monete Nexus e senza sostituire ciò che possiedi già.", target: "shop-content", view: "shop", panel: "shop" },
    { title: "Monete e acquisti premium", copy: "Le Monete Nexus sbloccano contenuti di gioco; i nuovi Famigli premium mostrano sempre il prezzo reale prima di aprire l'acquisto protetto.", target: "shop-tabs", view: "shop", panel: "shop" },
  ],
  legacy: [
    { title: "Le pagine del vostro legame", copy: "Usa le schede per passare tra Diario, Personalità, Scoperte e Centro ricompense. Ogni pagina racconta una parte diversa della vostra storia.", target: "legacy-tabs", view: "legacy", panel: "legacy" },
    { title: "Ricordi e personalità", copy: "Il Diario registra automaticamente i momenti importanti. Cure, gioco, riposo e uscite fanno emergere preferenze e reazioni proprie della specie.", target: "legacy-content", view: "legacy", panel: "legacy" },
    { title: "Scoperte, cartoline e premi", copy: "I reperti trovati fuori casa completano raccolte e cartoline. Nel Centro ricompense controlli livello, monete, vantaggi e traguardi ottenuti.", target: "legacy-tabs", view: "legacy", panel: "legacy" },
  ],
  missions: [
    { title: "Missioni, Presenze e Desiderio", copy: "Queste tre schede raccolgono gli obiettivi del giorno, il ritorno settimanale e la preferenza quotidiana del Famiglio.", target: "missions-tabs", view: "progress", panel: "missions" },
    { title: "Completa azioni reali", copy: "Ogni giorno ricevi una Missione facile, una normale e una difficile tra LoreWise, cura, lotte e spedizioni. Quando la completi puoi riscuotere il premio dalla sua scheda.", target: "mission-list", view: "progress", panel: "missions" },
    { title: "Cresci senza punizioni", copy: "Le Presenze non azzerano la sequenza se salti un giorno e il Desiderio si completa solo con l'azione richiesta. I traguardi mostrano i prossimi vantaggi.", target: "growth", view: "progress", panel: "missions" },
  ],
} as const;

export function completedGuestCareActions(previous: number, completed: FamiliarCareCommand) {
  if (!["food", "soap", "toy", "medicine", "rest"].includes(completed)) return Math.max(0, previous);
  return Math.min(FAMILIAR_GUEST_ACTION_LIMIT, Math.max(0, Math.floor(previous)) + 1);
}

export function shouldShowLoreWiseIdPrompt(completedActions: number, hasLoreWiseId: boolean) {
  return !hasLoreWiseId && completedActions >= FAMILIAR_GUEST_ACTION_LIMIT;
}

export function shouldRequireLoreWiseIdForNextCare(completedActions: number, hasLoreWiseId: boolean) {
  return !hasLoreWiseId && completedActions >= FAMILIAR_GUEST_ACTION_LIMIT;
}

export const FAMILIAR_TUTORIAL_STEPS = FAMILIAR_GUIDED_TUTORIAL_STEPS.map(({ title, copy }) => ({ title, copy }));
