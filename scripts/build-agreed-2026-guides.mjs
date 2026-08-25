import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const steamShot = (appId, hash) => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/ss_${hash}.1920x1080.jpg`;
const inazumaAsset = (asset) => `https://www.inazuma.jp/victory-road/assets/img/${asset}`;

const guides = [
  {
    slug: "cyberpunk-2077",
    code: "LW-ATLAS-CP77-001",
    game: "Cyberpunk 2077",
    title: "Manuale di sopravvivenza a Night City",
    subtitle: "Dalla creazione di V a Phantom Liberty, per costruire una mercenaria o un mercenario efficace senza perdere il controllo della storia.",
    description: "Sedici capitoli e quarantotto schede operative dedicate a edizioni, impostazioni, V, attributi, cyberware, combattimento, hacking, veicoli, quartieri, incarichi, economia, relazioni, storia, finali, Phantom Liberty e Update 2.3.",
    versionLabel: "Ultimate Edition · Update 2.3 · Phantom Liberty · verifica 24 agosto 2026",
    vipFrom: "2026-11-23T00:00:00+01:00",
    publicAt: "2026-11-30T00:00:00+01:00",
    storeUrl: "https://www.cyberpunk.net/us/en/buy",
    storeLabel: "Acquista Cyberpunk 2077",
    palette: "#070b12",
    coverUrl: steamShot("1091500", "526123764d1c628caa1eb62c596f1b732f416c8c"),
    coverAlt: "V e un’auto davanti allo skyline di Night City",
    coverCaption: "Night City · screenshot ufficiale dello store Steam mostrato integralmente",
    livingGuide: {
      enabled: true,
      announcement: "Ultimate Edition, Phantom Liberty e Update 2.3 riuniti in un unico percorso.",
      scope: { expansion: "Phantom Liberty", contentUpdate: "Update 2.3", season: "Edizione corrente" },
      cadence: "monthly", lastCheckedAt: "2026-08-24", nextCheckAt: "2026-09-24T09:00:00+02:00",
      notificationTarget: "/notifiche", approvalRequired: true,
      monitoredSourceUrls: ["https://www.cyberpunk.net/us/en/update-2.3", "https://www.cyberpunk.net/en/news/51674/update-2-3-patch-notes", "https://support.cdprojektred.com/en/cyberpunk/pc"],
    },
    images: [
      ["872822c5e50dc71f345416098d29fc3ae5cd26c1", "Night City vista dalle strade sopraelevate", "Edizioni e piattaforme · Night City su PC"],
      ["ae4465fa8a44dd330dbeb7992ba196c2f32cabb1", "Night City illuminata di notte", "Impostazioni e leggibilità nella città notturna"],
      ["af2804aa4bf35d4251043744412ce3b359a125ef", "Editor dell’aspetto di V", "Creazione di V · schermata ufficiale"],
      ["429db1d013a0366417d650d84f1eff02d1a18c2d", "V osserva Night City con la giacca da mercenario", "Identità e crescita del personaggio"],
      ["284ba40590de8f604ae693631c751a0aefdc452e", "Johnny Silverhand con braccio cibernetico", "Cyberware e identità cibernetica"],
      ["0002f18563d313bdd1d82c725d411408ebf762b0", "Scontro ravvicinato contro avversari potenziati", "Combattimento e lettura delle minacce"],
      ["b529b0abc43f55fc23fe8058eddb6e37c9629a6a", "V si muove in un vicolo sorvegliato di Night City", "Furtività e accesso agli ambienti"],
      ["0e64170751e1ae20ff8fdb7001a8892fd48260e7", "Automobile sportiva in officina", "Veicoli, collezione e personalizzazione"],
      ["9284d1c5b248726760233a933dbb83757d7d5d95", "Panorama urbano di Night City alla luce del giorno", "Quartieri e orientamento urbano"],
      ["7924f64b6e5d586a80418c9896a1c92881a7905b", "Inseguimento tra V e la polizia", "Incarichi, pericoli e risposta della polizia"],
      ["bb1a60b8e5061caef7208369f42c5c9d574c9ac4", "V parla con una fixer in un mercato", "Fixer, ricompense ed economia"],
      ["2f649b68d579bf87011487d29bc4ccbfdd97d34f", "V conversa in automobile", "Relazioni e dialoghi a Night City"],
      ["8640d9db74f7cad714f6ecfb0e1aceaa3f887e58", "Johnny Silverhand davanti alle luci di Night City", "Johnny Silverhand e la storia principale"],
      ["ff3d920e254d18aa2a25d3765ac2ebe845efd208", "Figura solitaria nelle Badlands", "Finali e conseguenze protette"],
      ["f79fda81e6f3a37e0978054102102d71840f8b57", "Solomon Reed nel distretto di Dogtown", "Phantom Liberty · Dogtown e Solomon Reed"],
      ["4eb068b1cf52c91b57157b84bed18a186ed7714b", "Moto futuristica sulle strade notturne", "Update 2.3 · veicoli e nuovi modi di attraversare Night City"],
    ],
    chapters: [
      ["editions-platforms", "Edizioni e piattaforme", "Scegliere base game, espansione e piattaforma corretti", "La Ultimate Edition comprende il gioco base e Phantom Liberty; Update 2.3 è gratuito per chi possiede il gioco sulle piattaforme supportate.", ["Confronta base e Ultimate Edition", "Verifica che Phantom Liberty sia inclusa", "Controlla spazio libero e requisiti", "Collega l’account CD PROJEKT RED se vuoi il cross-progression", "Scarica ogni pacchetto prima di iniziare"], ["Phantom Liberty non è disponibile su PS4 e Xbox One", "La versione attuale è pensata per PC, PS5, Xbox Series, Switch 2 e Mac", "Conserva la ricevuta dello store usato"], ["L’espansione non compare=>Controlla licenza, piattaforma e download separato", "Il gioco avvia una versione precedente=>Verifica aggiornamenti e spazio libero"]],
      ["settings-accessibility", "Impostazioni e accessibilità", "Rendere Night City leggibile prima del primo incarico", "Interfaccia, sottotitoli, difficoltà, mira, camera, grafica e densità urbana vanno regolati prima di giudicare il combattimento.", ["Imposta lingua, sottotitoli e dimensione testo", "Regola luminosità e campo visivo", "Scegli difficoltà e aiuti alla mira", "Controlla motion blur, aberrazione e vibrazione", "Prova guida e combattimento in una zona sicura"], ["La modalità prestazioni aiuta la risposta ai comandi", "Riduci gli effetti che causano affaticamento", "Conserva un preset stabile prima di sperimentare"], ["Il testo è difficile da leggere=>Aumenta sottotitoli e contrasto HUD", "La guida del veicolo dà nausea=>Riduci movimento camera e motion blur"]],
      ["character-lifepath", "V e percorso di vita", "Creare V senza confondere identità e statistiche", "Aspetto, voce e percorso di vita definiscono presentazione e opzioni narrative; non determinano da soli una build superiore.", ["Scegli corpo, voce e aspetto", "Valuta Nomade, Ragazzo di strada o Corporativo", "Decidi lo stile di dialogo", "Conferma il livello di nudità desiderato", "Crea un salvataggio prima del prologo"], ["Il percorso di vita apre dialoghi specifici", "La build si decide soprattutto con attributi, perk e cyberware", "Scegli il prologo che vuoi davvero interpretare"], ["Temo di perdere contenuti=>Ogni percorso offre varianti, non una campagna completamente diversa", "Voglio cambiare aspetto=>Usa specchi e servizi disponibili, verificando ciò che resta modificabile"]],
      ["attributes-perks", "Attributi, perk e build", "Costruire un ciclo di gioco che sai spiegare", "Corpo, Riflessi, Abilità tecnica, Intelligenza e Freddezza sostengono famiglie diverse di armi, dialoghi e azioni.", ["Scegli un’azione principale", "Individua l’attributo che la sostiene", "Aggiungi sopravvivenza e mobilità", "Spendi perk lungo una sola sinergia alla volta", "Prova la rotazione prima di salire di livello"], ["Non distribuire punti in modo uniforme", "I perk si possono riorganizzare più facilmente degli attributi", "Mantieni almeno una soluzione contro bersagli corazzati o lontani"], ["La build sembra debole=>Controlla arma, attributo, perk e cyberware come unico sistema", "Hai troppi comandi=>Riduci le abilità attive e scegli un ciclo più semplice"]],
      ["cyberware-health", "Cyberware e sopravvivenza", "Aumentare la potenza senza saturare la capacità", "Il cyberware governa armatura, mobilità, sistema operativo e strumenti offensivi; ogni impianto deve sostenere la build.", ["Scegli sistema operativo", "Controlla capacità cyberware", "Aggiungi difesa e cura", "Installa mobilità coerente", "Confronta il risultato in combattimento"], ["Cyberdeck, Sandevistan e Berserk richiedono stili diversi", "Non comprare ogni rarità senza leggere l’effetto", "Bilancia armatura, vita e mitigazione"], ["Non posso installare un impianto=>Aumenta capacità o libera uno slot", "Muoio durante la ricarica=>Rivedi cura, copertura e attivazione difensiva"]],
      ["combat-weapons", "Combattimento e armi", "Leggere distanza, coperture e priorità", "Pistole, fucili, armi tecniche, smart, lame e corpo a corpo cambiano gestione di munizioni, posizione e tempo d’esposizione.", ["Scansiona il gruppo", "Segna netrunner e tiratori", "Apri da copertura", "Usa mobilità per cambiare angolo", "Raccogli bottino dopo lo scontro"], ["Porta due soluzioni con distanze diverse", "Ricarica dietro copertura", "Non inseguire un nemico dentro un secondo gruppo"], ["Le munizioni finiscono=>Alterna armi o migliora economia dei colpi", "Un’élite assorbe tutto=>Controlla tipo di danno, armatura e punti deboli"]],
      ["stealth-netrunning", "Furtività e netrunning", "Entrare in un’area prima con gli occhi e poi con le armi", "Telecamere, access point, quickhack, RAM e tracciamento permettono di ridurre il rischio prima del contatto diretto.", ["Scansiona telecamere e guardie", "Individua una via verticale", "Disattiva o controlla i dispositivi", "Isola il primo bersaglio", "Prepara un’uscita se parte l’allarme"], ["Controlla costo RAM e coda dei quickhack", "Sposta i corpi fuori dalle pattuglie", "La furtività non obbliga a evitare ogni scontro"], ["Vengo localizzato subito=>Interrompi il tracciamento e cambia posizione", "La RAM non basta=>Riduci il costo o scegli quickhack più essenziali"]],
      ["vehicles", "Veicoli e spostamenti", "Scegliere il mezzo per strada, combattimento e atmosfera", "Auto e moto hanno massa, visibilità e risposta diverse; Update 2.3 amplia collezione, guida autonoma e personalizzazione.", ["Prova visuale interna ed esterna", "Regola sensibilità di guida", "Salva un veicolo preferito", "Usa la chiamata lontano dagli ostacoli", "Sperimenta CrystalCoat dove supportato"], ["Le moto aiutano nel traffico", "Le auto proteggono meglio negli scontri", "Non iniziare una sparatoria senza una via di fuga"], ["Il veicolo non arriva=>Spostati in una strada libera", "Perdi controllo in curva=>Frena prima e riduci la correzione improvvisa"]],
      ["night-city-districts", "Night City e quartieri", "Esplorare senza trasformare la mappa in una lista", "Watson, Westbrook, City Center, Heywood, Santo Domingo, Pacifica e Badlands hanno identità, pericoli e incarichi differenti.", ["Apri punti di viaggio", "Scegli un quartiere per sessione", "Raggruppa incarichi vicini", "Osserva verticalità e accessi", "Rientra quando l’inventario è pieno"], ["Camminare rivela più eventi della guida rapida", "Il livello di pericolo conta meno di build e attenzione", "Lascia attività secondarie per cambiare ritmo"], ["Un segnalino sembra irraggiungibile=>Cerca scale, ascensori e livelli stradali", "La mappa è opprimente=>Filtra categorie e scegli un solo obiettivo"]],
      ["gigs-ncpd", "Incarichi, fixer e NCPD", "Capire obiettivo e ricompensa prima di sparare", "Gli incarichi premiano approcci diversi, mentre le attività NCPD sono più immediate e utili per denaro, esperienza e materiali.", ["Leggi il messaggio del fixer", "Scansiona l’edificio", "Scegli furtività o assalto", "Completa eventuali obiettivi facoltativi", "Controlla il messaggio di chiusura"], ["Non lasciare l’area prima della conferma", "I bonus dipendono spesso dal metodo", "Usa gli incarichi per provare la build"], ["L’incarico non termina=>Controlla oggetti, messaggi e area evidenziata", "Il fixer non chiama=>Avvicinati correttamente o verifica lo stato della missione"]],
      ["economy-crafting", "Economia, bottino e creazione", "Tenere soltanto ciò che sostiene la build", "Crediti, componenti, armi iconiche e materiali diventano gestibili con una routine di confronto e deposito.", ["Segna armi iconiche", "Confronta danno e sinergie", "Smonta ciò che serve ai componenti", "Vendi il resto", "Conserva un set alternativo nel deposito"], ["Non valutare un’arma solo dal DPS", "Proteggi gli oggetti iconici", "Compra cyberware prima di consumabili casuali"], ["L’inventario è pieno=>Smonta, vendi e usa il deposito del veicolo", "I crediti finiscono=>Riduci acquisti cosmetici e completa incarichi mirati"]],
      ["relationships", "Relazioni e romance", "Rispettare tempi, identità e richieste dei personaggi", "Judy, Panam, River, Kerry e altri alleati sviluppano archi distinti; dialoghi e disponibilità dipendono da scelte precedenti.", ["Ascolta le chiamate", "Completa le missioni personali", "Evita risposte che contraddicono il ruolo scelto", "Non forzare ogni opzione romantica", "Salva prima dei dialoghi decisivi"], ["Non tutte le romance sono disponibili a ogni V", "L’amicizia resta un percorso completo", "Le conseguenze possono arrivare molte ore dopo"], ["Una missione personale non parte=>Attendi tempo di gioco e completa il passaggio precedente", "Hai chiuso una relazione=>Torna a un salvataggio precedente solo se vuoi davvero riscriverla"]],
      ["main-story", "Storia principale", "Seguire il Relic senza perdere Night City", "La campagna alterna urgenza narrativa e libertà reale: gli atti principali aprono personaggi, quartieri e sistemi.", ["Mantieni un salvataggio per atto", "Alterna storia e secondarie", "Leggi messaggi dopo le missioni", "Completa gli archi degli alleati", "Fermati prima del punto di non ritorno"], ["Il timer narrativo non è sempre un timer reale", "Le secondarie modificano le opzioni finali", "Non leggere guide ai finali prima del momento decisivo"], ["Temi di avanzare troppo=>Controlla l’avviso di punto di non ritorno", "Una missione sembra bloccata=>Passa tempo, allontanati e attendi la chiamata"]],
      ["endings-completion", "Finali e completamento", "Preparare le opzioni finali senza rivelarle", "I finali dipendono dagli archi completati, da scelte precise e, con Phantom Liberty, da ulteriori possibilità.", ["Completa missioni degli alleati", "Conserva un salvataggio prima del punto di non ritorno", "Controlla equipaggiamento e consumabili", "Scegli secondo il tuo V", "Rientra nel salvataggio di completamento per altri percorsi"], ["Ogni finale ha un tono diverso", "Il cento per cento non richiede una sola conclusione", "Proteggi la prima scelta dalle anticipazioni"], ["Manca un’opzione=>Non hai completato l’arco collegato", "Vuoi vedere altri finali=>Usa il salvataggio precedente senza cancellare quello originale"], "Spoiler protetti"],
      ["phantom-liberty", "Phantom Liberty", "Entrare a Dogtown al momento giusto", "L’espansione aggiunge una storia di spionaggio, il distretto di Dogtown, Relic perk, incarichi, veicoli e finali collegati.", ["Verifica installazione dell’espansione", "Raggiungi il punto d’accesso nella storia", "Crea un salvataggio separato", "Esplora Dogtown prima di correre", "Spendi Relic point sulla build reale"], ["Dogtown è più verticale e densa", "Le decisioni hanno conseguenze importanti", "Alterna incarichi di Mr. Hands e trama principale"], ["La chiamata non arriva=>Avanza la storia base e controlla il download", "Un finale cambia il percorso=>Usa il salvataggio separato per esplorare altre scelte"], "Spoiler protetti"],
      ["update-23-future", "Update 2.3 e contenuti", "Usare le novità senza ricominciare la partita", "Update 2.3 aggiunge veicoli, AutoDrive, taxi Delamain, Photo Mode ampliato e nuove opzioni di personalizzazione su piattaforme supportate.", ["Aggiorna gioco e driver", "Carica un salvataggio esistente", "Prova AutoDrive in una strada libera", "Controlla nuovi veicoli e CrystalCoat", "Esplora Photo Mode con una scena sicura"], ["Non è necessario iniziare un nuovo V", "Alcune funzioni dipendono dalla piattaforma", "Disattiva le mod incompatibili prima dell’aggiornamento"], ["Il gioco si chiude dopo la patch=>Avvia senza mod e verifica i file", "Una funzione non compare=>Controlla piattaforma, versione e requisiti ufficiali"]],
    ],
    sections: [
      ["prepare", "Prepara Night City", "Edizioni, impostazioni e creazione di V.", ["editions-platforms", "settings-accessibility", "character-lifepath"]],
      ["build", "Costruisci V", "Attributi, cyberware e combattimento.", ["attributes-perks", "cyberware-health", "combat-weapons"]],
      ["infiltrate", "Entra nel sistema", "Furtività, hacking e veicoli.", ["stealth-netrunning", "vehicles"]],
      ["city", "Vivi la città", "Quartieri, incarichi ed economia.", ["night-city-districts", "gigs-ncpd", "economy-crafting"]],
      ["story", "Scegli chi essere", "Relazioni, storia e finali protetti.", ["relationships", "main-story", "endings-completion"]],
      ["dogtown", "Oltre il confine", "Phantom Liberty e Update 2.3.", ["phantom-liberty", "update-23-future"]],
    ],
    sources: [
      ["Cyberpunk 2077 · sito ufficiale", "https://www.cyberpunk.net/us/en/cyberpunk-2077"],
      ["Cyberpunk 2077 · Update 2.3", "https://www.cyberpunk.net/us/en/update-2.3"],
      ["Update 2.3 · note ufficiali", "https://www.cyberpunk.net/en/news/51674/update-2-3-patch-notes"],
      ["CD PROJEKT RED · supporto", "https://support.cdprojektred.com/en/cyberpunk/pc"],
      ["Cyberpunk 2077 · Steam", "https://store.steampowered.com/app/1091500/Cyberpunk_2077/"],
    ],
  },
  {
    slug: "inazuma-eleven-victory-road",
    code: "LW-ATLAS-IEVR-001",
    game: "INAZUMA ELEVEN: Victory Road",
    title: "La strada verso la vittoria",
    subtitle: "Dalla nuova storia alla squadra dei sogni, per padroneggiare il calcio iperdimensionale senza perdere progressi o legami.",
    description: "Sedici capitoli e quarantotto schede operative dedicate a edizioni, configurazione, Story Mode, partite, Focus, Zone, tecniche speciali, tattiche, sviluppo, Chronicle, scouting, Competition, Bond Station, cross-save, aggiornamenti e completamento.",
    versionLabel: "Versione 7.1.x · Contenders for Glory · verifica 24 agosto 2026",
    vipFrom: "2026-11-30T00:00:00+01:00",
    publicAt: "2026-12-07T00:00:00+01:00",
    storeUrl: "https://www.inazuma.jp/victory-road/en/product/",
    storeLabel: "Acquista Victory Road",
    palette: "#071a32",
    coverUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/capsule_616x353.jpg",
    coverAlt: "Il cast di INAZUMA ELEVEN Victory Road riunito attorno al pallone con il logo ufficiale",
    coverCaption: "INAZUMA ELEVEN: Victory Road · cast e identità ufficiale del gioco",
    livingGuide: {
      enabled: true,
      announcement: "Story, Chronicle, Competition e aggiornamenti gratuiti riuniti in un solo percorso.",
      scope: { expansion: "Contenders for Glory", contentUpdate: "Versione 7.1.x", season: "Tornei online" },
      cadence: "monthly", lastCheckedAt: "2026-08-24", nextCheckAt: "2026-09-24T09:00:00+02:00",
      notificationTarget: "/notifiche", approvalRequired: true,
      monitoredSourceUrls: ["https://www.inazuma.jp/victory-road/en/index.html", "https://www.inazuma.jp/victory-road/en/topics/", "https://www.inazuma.jp/victory-road/en/system/"],
    },
    images: [
      ["https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/header.jpg", "Logo ufficiale e protagonisti di Victory Road attorno al pallone", "Edizioni e piattaforme · identità ufficiale del gioco"],
      [steamShot("2799860", "1279f2e22e9c3760910577060bc78189111bdec7"), "Esplorazione della scuola con obiettivo e comandi visibili", "Configurazione iniziale · comandi, obiettivi ed esplorazione"],
      [inazumaAsset("story/synopsis/img_synopsis_01_2510.jpg"), "Destin Billows nel cortile della scuola durante lo Story Mode", "Story Mode · il nuovo protagonista e la nuova scuola"],
      [inazumaAsset("competition/stit_zone_o_2510.jpg"), "Zona offensiva attiva durante una partita", "Fondamentali della partita · posizione, tensione e scelta dell'azione"],
      [inazumaAsset("competition/stit_forcus_2510.jpg"), "Interfaccia Focus durante un confronto uno contro uno", "Focus · spazio, direzione e risultato del duello"],
      [steamShot("2799860", "9a85e64436ad96f1ceb06a9b71f433229d2834d2"), "Fire Tornado DD eseguito da due giocatori", "Tecniche speciali · Fire Tornado DD in azione"],
      [inazumaAsset("competition/stit_tactics_2510.jpg"), "Carta tattica dorata attivata durante la partita", "Tattiche e comando · bonus e piano di squadra"],
      [steamShot("2799860", "a128008288c35a69d0b5511eb8633c742e17f7f7"), "Giocatori di epoche diverse riuniti come squadra", "Costruzione della squadra · ruoli e generazioni riunite"],
      [inazumaAsset("competition/img_enhancement-system_01_2510.jpg"), "Giocatore potenziato con una tecnica durante la crescita", "Abilearn e passivi · sviluppo del giocatore"],
      [inazumaAsset("chronicle/img_chronicle-battle-route_01_2510.jpg"), "Percorso di battaglie e squadre del Chronicle Mode", "Chronicle Mode · percorso nella storia della serie"],
      [inazumaAsset("chronicle/img_chronicle-players_01_2510.jpg"), "Schermata della rosa con giocatori e parametri", "Scouting e collezione · scelta e confronto dei giocatori"],
      [steamShot("2799860", "8c0e596b3d4e097bb24072e90e27e42ac449ae2f"), "Partita competitiva nello stadio con punteggio e comandi visibili", "Competition Mode · partita e pressione competitiva"],
      [inazumaAsset("kizuna/img_kizuna-town_02_2510.jpg"), "Bond Town personalizzata attorno a un campo da calcio", "Bond Station · costruzione della propria città"],
      [inazumaAsset("kizuna/img_friends_01_2510.jpg"), "Avatar e amici riuniti nella Bond Station", "Cross-play e cross-save · squadra e amici tra piattaforme"],
      [steamShot("2799860", "e78a4001ebb5a025a277d249bd04368d7d5f5800"), "Nuova scena narrativa con Destin Billows durante un aggiornamento", "Aggiornamenti e DLC · nuovi percorsi narrativi"],
      [inazumaAsset("competition/stit_chain_2510.jpg"), "Tecnica speciale concatenata nella fase decisiva della partita", "Completamento · tecnica concatenata per la vittoria finale"],
    ],
    chapters: [
      ["editions-platforms", "Edizioni e piattaforme", "Scegliere Standard, Deluxe e piattaforma", "Victory Road è disponibile in digitale su Switch 2, Switch, PS5, PS4, Xbox Series e Steam, con Standard, Deluxe e upgrade separato.", ["Confronta Standard e Deluxe", "Verifica costo dell’upgrade", "Controlla spazio e requisiti PC", "Valuta cross-save tra le piattaforme usate", "Scarica aggiornamenti prima del primo avvio"], ["I bonus Deluxe vanno posseduti sulla piattaforma in cui vuoi usarli", "La versione italiana include interfaccia e sottotitoli", "Su PC è richiesto Easy Anti-Cheat"], ["Un bonus non compare=>Controlla edizione e piattaforma della licenza", "Il gioco non parte su PC=>Verifica Windows 11, driver, spazio ed Easy Anti-Cheat"]],
      ["first-setup", "Configurazione iniziale", "Preparare comandi, rete e leggibilità", "Prima di entrare in Story o Competition conviene regolare camera, assistenze, indicatori, volume e connessione.", ["Scegli lingua e sottotitoli", "Completa il tutorial dei comandi", "Regola camera e vibrazione", "Verifica connessione e account", "Prova una partita senza pressione"], ["Impara un comando alla volta", "La qualità della rete conta nelle partite online", "Conserva un preset comodo per sessioni lunghe"], ["I comandi sembrano confusi=>Ripeti il tutorial e usa allenamento", "La partita online scatta=>Controlla rete cablata e regione"]],
      ["story-mode", "Story Mode", "Seguire Destin senza correre oltre la squadra", "La storia si svolge venticinque anni dopo il primo Inazuma Eleven e segue Destin Billows e Harper Evans.", ["Esplora la scuola", "Parla con i personaggi segnati", "Completa gli obiettivi di squadra", "Allena i ruoli mancanti", "Salva prima delle partite importanti"], ["Le scene animate sono parte centrale dell’esperienza", "Non trascurare dialoghi e legami", "Costruisci la squadra secondo la storia prima di ottimizzarla"], ["Non trovi il prossimo obiettivo=>Controlla mappa e registro", "Una partita blocca la storia=>Rivedi ruoli, tensione e tecniche"]],
      ["match-basics", "Fondamentali della partita", "Trasformare possesso e duelli in occasioni", "Movimento, passaggi, contrasti, Over Ride e Catch Bomb costruiscono il ritmo prima delle tecniche speciali.", ["Mantieni una linea di passaggio", "Attira un avversario", "Usa Over Ride nel momento utile", "Proteggi la palla prima del tiro", "Ricompattati dopo la perdita"], ["Non correre sempre verso la porta", "Cambia lato contro una difesa affollata", "Conserva giocatori dietro la palla"], ["Perdi ogni duello=>Valuta statistiche, direzione e supporto", "Non crei occasioni=>Muovi la palla prima di usare una tecnica"]],
      ["focus-zone", "Focus", "Vincere il confronto leggendo spazio e direzione", "Il Focus concentra il duello tra attaccante e difensore; posizione, abilità e scelta del movimento determinano l’esito.", ["Osserva la direzione avversaria", "Scegli il varco", "Valuta il supporto vicino", "Usa l’abilità solo quando serve", "Prepara l’azione successiva"], ["La fretta rende prevedibili", "Un Focus vinto non garantisce un tiro libero", "Impara quando rinunciare al duello"], ["Il difensore anticipa sempre=>Varia direzione e tempo", "Vinci il Focus ma perdi palla=>Cerca subito un passaggio sicuro"]],
      ["special-moves", "Zone e tecniche speciali", "Spendere tensione per cambiare davvero l’azione", "Zone, tiri, parate, blocchi e catene hanno costi e finestre diverse; la tecnica migliore è quella usata nel momento corretto.", ["Controlla tensione disponibile", "Attiva la zona coerente", "Crea spazio per il tiratore", "Concatena solo con supporto", "Conserva una risposta difensiva"], ["Non spendere tutto nel primo attacco", "Le tecniche difensive valgono quanto i tiri", "Conosci portata e requisito di ogni mossa"], ["La tecnica non si attiva=>Controlla posizione, tensione e finestra", "Il portiere para tutto=>Aumenta qualità dell’occasione e usa catene"]],
      ["tactics-commander", "Tattiche e Commander Mode", "Dare alla squadra un piano riconoscibile", "Tattiche, Geoglyph e Commander Mode permettono di guidare ruoli e comportamento oltre il controllo diretto.", ["Scegli un’identità offensiva", "Assegna ruoli chiari", "Prepara una variante difensiva", "Usa Geoglyph nella zona utile", "Cambia piano dopo aver letto l’avversario"], ["Una tattica deve adattarsi ai giocatori", "Non cambiare formazione a ogni errore", "Commander Mode richiede istruzioni semplici"], ["La squadra si allunga=>Riduci aggressività o distanza tra reparti", "Gli attaccanti non ricevono palla=>Rivedi supporti e costruzione"]],
      ["team-building", "Formazione e ruoli", "Costruire undici giocatori che si aiutano", "Portiere, difensori, centrocampisti e attaccanti devono coprire fasi diverse; il valore totale non sostituisce l’equilibrio.", ["Scegli un portiere affidabile", "Costruisci una coppia difensiva", "Aggiungi regia e recupero", "Abbina attaccanti complementari", "Prepara sostituzioni per ruolo"], ["Non usare soltanto i personaggi preferiti nello stesso ruolo", "Controlla elementi e tecniche", "La panchina deve risolvere problemi reali"], ["Subisci contropiedi=>Aggiungi equilibrio e copertura", "Segni poco=>Crea un secondo modo di finalizzare"]],
      ["abilearn-passives", "Abilearn, passivi e legami", "Far crescere la squadra lungo un progetto", "Abilearn Board, Team Passives e Bond Link permettono di specializzare giocatori e rafforzare relazioni tra i membri.", ["Definisci il ruolo finale", "Apri l’Abilearn Board", "Sblocca nodi coerenti", "Combina Team Passives", "Collega Bond Link utili"], ["Non spendere risorse su ogni ramo", "I passivi di squadra richiedono composizione", "I legami devono sostenere il piano di gioco"], ["La crescita sembra lenta=>Concentra risorse sul nucleo titolare", "Un passivo non si attiva=>Controlla requisiti e limite della squadra"]],
      ["chronicle-mode", "Chronicle Mode", "Attraversare la storia della serie senza perdersi", "Chronicle Mode raccoglie squadre, partite e oltre 5.400 giocatori dell’intera saga lungo percorsi tematici.", ["Scegli un percorso storico", "Controlla requisiti della tappa", "Prepara una squadra adatta", "Completa obiettivi secondari", "Segna i giocatori ancora mancanti"], ["Procedi per epoca o squadra", "Non tentare di collezionare tutto subito", "Usa Chronicle per testare combinazioni"], ["Una tappa è troppo difficile=>Cambia percorso e rinforza il nucleo", "Non trovi un giocatore=>Controlla percorso, ricompensa e condizione"]],
      ["scouting-collection", "Scouting e collezione", "Ottenere giocatori senza sprecare risorse", "La collezione enorme richiede filtri, priorità e una distinzione tra preferiti, titolari e progetti futuri.", ["Filtra per ruolo ed elemento", "Segna i preferiti", "Controlla metodo di ottenimento", "Investi prima sui titolari", "Archivia i doppioni con criterio"], ["Non inseguire rarità senza ruolo", "Costruisci una lista breve", "Conserva risorse per eventi e nuovi percorsi"], ["La rosa è ingestibile=>Usa filtri e categorie personali", "Non ottieni il giocatore desiderato=>Verifica la fonte prima di spendere ancora"]],
      ["competition-online", "Competition e online", "Giocare contro persone con un piano e rispetto", "Competition Mode, ranked e tornei mettono alla prova lettura, gestione della tensione e capacità di adattamento.", ["Controlla connessione", "Scegli una squadra conosciuta", "Osserva i primi minuti", "Cambia tattica una volta", "Rivedi la sconfitta senza cambiare tutto"], ["Evita abbandoni e comportamenti scorretti", "Impara una risposta contro le strategie frequenti", "La classifica non misura il divertimento"], ["Il matchmaking fallisce=>Controlla stato servizi, regione e aggiornamento", "Perdi serie di partite=>Fermati e rivedi un solo errore ricorrente"]],
      ["bond-station", "Bond Station", "Creare una città che racconta la tua squadra", "Bond Station permette di personalizzare avatar e Bond Town, collocare oggetti, invitare amici e usare l’avatar nelle partite.", ["Crea l’avatar", "Scegli un tema della città", "Posiziona oggetti funzionali e decorativi", "Salva il layout", "Invita amici quando il percorso è leggibile"], ["Lascia spazio per muoversi", "Usa oggetti della serie che ami", "Non sacrificare chiarezza per riempire ogni area"], ["Un oggetto non si posiziona=>Controlla spazio e collisioni", "Gli amici non entrano=>Verifica privacy, rete e versione"]],
      ["crossplay-crosssave", "Cross-play e cross-save", "Spostare la squadra senza perdere dati o bonus", "Cross-play e cross-save permettono di giocare su più piattaforme, ma licenze e contenuti Deluxe restano legati agli acquisti.", ["Crea o collega l’account richiesto", "Carica il salvataggio principale", "Attendi conferma della sincronizzazione", "Apri l’altra piattaforma", "Controlla squadra e contenuti prima di continuare"], ["Non sovrascrivere alla cieca", "I bonus Deluxe richiedono licenza sulla piattaforma usata", "Conserva una copia sicura quando disponibile"], ["Il salvataggio non compare=>Controlla account, rete e versione", "Mancano bonus=>Verifica edizione posseduta su quella piattaforma"]],
      ["dlc-updates", "Aggiornamenti gratuiti", "Integrare nuovi percorsi senza smontare la squadra", "Gli aggiornamenti maggiori gratuiti hanno ampliato giocatori, modalità e sfide fino a Contenders for Glory e alla versione 7.1.x.", ["Aggiorna tutte le piattaforme", "Leggi il contenuto aggiunto", "Controlla nuovi percorsi", "Prova una novità alla volta", "Rivedi passivi solo se necessario"], ["Non ricostruire la squadra per ogni patch", "Controlla limiti aggiornati dei passivi", "Separa novità permanenti e tornei temporanei"], ["Una modalità non compare=>Verifica versione e completamento richiesto", "La squadra cambia rendimento=>Controlla note di bilanciamento e passivi"]],
      ["completion", "Completamento", "Definire la propria vittoria finale", "Storia, Chronicle, collezione, online e Bond Town offrono traguardi diversi; scegli ciò che rende completa la tua esperienza.", ["Completa la storia", "Chiudi i percorsi Chronicle preferiti", "Costruisci la squadra dei sogni", "Raggiungi un obiettivo online realistico", "Fotografa o salva Bond Town e rosa finale"], ["Il 100% non è obbligatorio", "Oltre 5.400 giocatori richiedono selezione", "Conserva una squadra simbolica oltre a quella competitiva"], ["Ti senti bloccato dal collezionismo=>Riduci la lista ai personaggi importanti", "Non sai cosa fare dopo la storia=>Scegli Chronicle, Competition o Bond Station come nuovo centro"]],
    ],
    sections: [
      ["kickoff", "Prepara il calcio d’inizio", "Edizioni, impostazioni e Story Mode.", ["editions-platforms", "first-setup", "story-mode"]],
      ["match", "Gioca la partita", "Fondamentali, Focus e tecniche.", ["match-basics", "focus-zone", "special-moves"]],
      ["coach", "Guida la squadra", "Tattiche, formazione e crescita.", ["tactics-commander", "team-building", "abilearn-passives"]],
      ["chronicle", "Attraversa la leggenda", "Chronicle, scouting e collezione.", ["chronicle-mode", "scouting-collection"]],
      ["connect", "Connettiti al mondo", "Competition, Bond Station e cross-save.", ["competition-online", "bond-station", "crossplay-crosssave"]],
      ["future", "Continua il viaggio", "Aggiornamenti e completamento.", ["dlc-updates", "completion"]],
    ],
    sources: [
      ["Victory Road · sito ufficiale", "https://www.inazuma.jp/victory-road/en/index.html"],
      ["Victory Road · prodotto ed edizioni", "https://www.inazuma.jp/victory-road/en/product/"],
      ["Victory Road · sistema di gioco", "https://www.inazuma.jp/victory-road/en/system/"],
      ["Victory Road · notizie e aggiornamenti", "https://www.inazuma.jp/victory-road/en/topics/"],
      ["Victory Road · Steam", "https://store.steampowered.com/app/2799860/INAZUMA_ELEVEN__Victory_Road/"],
    ],
  },
  {
    slug: "the-mortuary-assistant",
    code: "LW-ATLAS-TMA-001",
    game: "The Mortuary Assistant",
    title: "Il turno di River Fields",
    subtitle: "Una guida horror ordinata per affrontare il lavoro notturno, riconoscere l’entità e proteggere i segreti della prima partita.",
    description: "Sedici capitoli e quarantotto schede operative dedicate a edizioni, accessibilità, primo turno, obitorio, ispezione, registri, strumenti, imbalsamazione, infestazioni, demoni, sigilli, inventario, possessione, finali, Embalming Only e Definitive Edition.",
    versionLabel: "Definitive Edition · verifica 24 agosto 2026",
    vipFrom: "2026-10-26T00:00:00+01:00",
    publicAt: "2026-11-02T00:00:00+01:00",
    storeUrl: "https://store.steampowered.com/app/1295920/The_Mortuary_Assistant/",
    storeLabel: "Acquista The Mortuary Assistant",
    palette: "#070909",
    coverUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1295920/library_hero.jpg",
    coverAlt: "River Fields Mortuary nella copertina ufficiale di The Mortuary Assistant",
    coverCaption: "Definitive Edition · grafica ufficiale Steam mostrata integralmente",
    images: [
      ["https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1295920/page_bg_raw.jpg", "River Fields Mortuary nella grafica ufficiale", "Edizioni, piattaforme e contenuti della Definitive Edition"],
      [steamShot("1295920", "42f9274feae24d77a539fea430ae214f6bab62f4"), "Ufficio della camera mortuaria durante il turno", "Primo turno · ufficio e ambiente di lavoro"],
      [steamShot("1295920", "2cdf505b0575216a6ea88bfebe56a381d5f58750"), "Sala d’attesa della River Fields Mortuary", "Orientamento negli ambienti della struttura"],
      [steamShot("1295920", "595746f0b8a03392b143d7dd74952f55db87b9a2"), "Scheda d’ispezione accanto al corpo", "Ispezione del corpo e registrazione dei segni"],
      [steamShot("1295920", "b144f359ddfd81efb20a55440748ced0b3c36ace"), "Sistema informatico dei registri mortuari", "Record System · inserimento dei segni osservati"],
      [steamShot("1295920", "9c03b9e47c3b3038c0b1f8c07d22627741f5d876"), "Fluido per imbalsamazione selezionato nell’inventario", "Strumenti e sostanze della procedura di gioco"],
      [steamShot("1295920", "d4767e3cc1cad71a68f0f79ba061de5eb770917a"), "Checklist delle attività di imbalsamazione", "Sequenza di imbalsamazione e controllo delle attività"],
      [steamShot("1295920", "648b098a80d70afc687cea973298a4039c2eac80"), "Apparizione nel corridoio della camera mortuaria", "Infestazioni e segnali fuori posto"],
      [steamShot("1295920", "8f7f15e075b4843726e2e52e0ca10df3b7022aba"), "Creatura inquietante sopra i mobili", "Manifestazioni e pressione demoniaca"],
      [steamShot("1295920", "1dd874221214b4c3c753bc0142bc345d2bc15735"), "Menu dei sigilli demoniaci sopra un corpo", "Identificazione del demone e scelta dei sigilli"],
      [steamShot("1295920", "6b347b201a841701a7765a02a372551534347766"), "Corridoio con scritta inquietante sulla parete", "Sopravvivenza durante il turno notturno"],
      [steamShot("1295920", "12ab4a16b0901b3939efd13b03ca0d625497dedb"), "Checklist e simbolo demoniaco nella camera mortuaria", "Possessione, tempo e stabilità del turno"],
      [steamShot("1295920", "95f294e3b2b43cf5c8f9765e51c0953663c30ad6"), "Primo piano inquietante durante un evento horror", "Finali e segreti protetti"],
      [steamShot("1295920", "bfe5af7e6d6a8671edf025e0f9d00f9a2a414d92"), "Figura nell’oscurità della camera mortuaria", "Embalming Only e differenze dalla modalità horror"],
      ["https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1295920/library_600x900_2x.jpg", "Copertina verticale ufficiale della Definitive Edition", "Definitive Edition · nuovi corpi, eventi e contenuti"],
      [steamShot("1295920", "fd9c4f93a6c5eaa9e698616decfe1d1357840d3b"), "Inventario del turno con strumenti mortuari", "Settimana di Halloween · preparazione completa del turno"],
    ],
    chapters: [
      ["editions-accessibility", "Edizioni e accessibilità", "Entrare a River Fields sapendo che esperienza aspettarsi", "La Definitive Edition è disponibile su PC e console e contiene horror psicologico, corpi, sangue, possessione, sobbalzi e temi di dipendenza e trauma.", ["Controlla classificazione e avvisi", "Scegli piattaforma e comandi", "Regola luminosità e volume", "Imposta l’aggressività delle infestazioni quando disponibile", "Decidi se iniziare dalla modalità narrativa o Embalming Only"], ["Gioca in un ambiente adatto al tuo benessere", "Riduci volume e sensibilità se i sobbalzi sono troppo intensi", "Interrompere una sessione è sempre una scelta valida"], ["L’horror è troppo forte=>Riduci aggressività o usa Embalming Only", "L’immagine è troppo buia=>Regola gamma senza cancellare i contrasti essenziali"]],
      ["first-shift", "Primo turno", "Imparare il lavoro prima di inseguire il soprannaturale", "Il tutorial introduce strumenti, stanze e ordine generale; la prima priorità è completare correttamente le attività osservabili.", ["Ascolta Raymond", "Esplora l’ufficio", "Leggi la checklist", "Impara dove sono gli strumenti", "Salva mentalmente il percorso tra ufficio e sala di preparazione"], ["Non correre durante il tutorial", "Apri cassetti e armadi con metodo", "Distingui un’attività di lavoro da un evento horror"], ["Non sai cosa fare=>Rileggi clipboard e messaggi", "Un oggetto sembra mancare=>Controlla la stanza e il mobile associati alla fase"]],
      ["mortuary-layout", "Mappa dell’obitorio", "Orientarsi senza perdersi durante un evento", "Ufficio, sala d’attesa, corridoi, deposito refrigerato e sala di imbalsamazione formano un circuito breve ma facile da confondere sotto pressione.", ["Individua l’uscita", "Memorizza il deposito", "Localizza computer e clipboard", "Segna mentalmente armadi e reagenti", "Ripeti il giro prima di iniziare il corpo"], ["Lascia aperto ciò che aiuta l’orientamento", "Non accumulare oggetti in punti casuali", "Usa luci e porte come riferimenti"], ["Ti perdi durante un’apparizione=>Torna alla sala centrale e riparti", "Non trovi il reagente=>Controlla etichetta, mobile e fase corrente"]],
      ["body-inspection", "Ispezione del corpo", "Registrare i segni senza saltare zone", "La scheda richiede di esaminare sistematicamente il corpo e annotare i segni prima di inserirli nel Record System.", ["Prendi la clipboard", "Ruota il corpo con calma", "Controlla testa e torso", "Esamina entrambe le braccia", "Concludi con entrambe le gambe"], ["Segui sempre lo stesso ordine", "Non confondere un segno registrabile con un evento", "Ricontrolla il lato opposto prima del computer"], ["Manca un segno=>Ripeti l’ispezione per zone", "Il registro non accetta i dati=>Controlla posizione e descrizione selezionate"]],
      ["record-system", "Record System", "Trasformare l’ispezione in un registro completo", "Il computer richiede dati e segni corretti; una voce incompleta blocca le fasi successive.", ["Apri il record del corpo", "Inserisci nome e dati richiesti", "Seleziona ogni segno", "Confronta con la clipboard", "Stampa o completa la registrazione"], ["Non affidarti alla memoria sotto pressione", "Controlla due volte le zone simmetriche", "Completa il record prima di cambiare attività"], ["Il record resta incompleto=>Confronta ogni riga con la clipboard", "Hai inserito il lato sbagliato=>Correggi prima di confermare"]],
      ["embalming-tools", "Strumenti e sostanze", "Riconoscere ogni oggetto dalla sua funzione di gioco", "Aghi, fili, tubi, trocar, reagenti e prodotti finali vengono usati in fasi precise; raccogliere tutto senza criterio rallenta.", ["Leggi il nome dell’oggetto", "Associalo alla fase della checklist", "Porta solo ciò che serve ora", "Rimetti a posto la ricerca", "Controlla la fase successiva prima di muoverti"], ["La clipboard resta la fonte principale", "Gli oggetti piccoli possono essere vicini tra loro", "Non confondere prodotti simili"], ["Non puoi usare uno strumento=>Non sei nella fase corretta", "L’inventario è pieno=>Deposita ciò che non serve immediatamente"]],
      ["embalming-sequence", "Sequenza di imbalsamazione", "Completare il procedimento di gioco senza saltare passaggi", "La procedura è una sequenza interattiva specifica del gioco e non sostituisce formazione o pratica professionale reale.", ["Segui la checklist nell’ordine", "Prepara gli strumenti della fase", "Completa l’interazione richiesta", "Controlla che l’attività venga barrata", "Passa alla fase successiva solo dopo conferma"], ["Non improvvisare l’ordine", "Un evento horror può interrompere ma non cancellare la fase", "Rileggi la voce se il comando non appare"], ["La checklist non avanza=>Manca un’interazione o un oggetto", "Hai perso il punto della sequenza=>Riparti dall’ultima voce non barrata"]],
      ["haunt-signs", "Segnali e infestazioni", "Notare ciò che cambia senza inseguire ogni rumore", "Porte, luci, apparizioni, oggetti e suoni possono indicare un evento, ma non ogni anomalia identifica direttamente il corpo posseduto.", ["Mantieni una routine", "Osserva cambiamenti evidenti", "Controlla il corpo dopo un evento", "Usa gli strumenti previsti dal gioco", "Torna alla checklist quando il pericolo passa"], ["Il panico fa perdere più tempo dell’apparizione", "Non ogni rumore richiede di lasciare la stanza", "Confronta più indizi prima di decidere"], ["Gli eventi sono troppo frequenti=>Riduci l’aggressività se disponibile", "Non sai se un segnale conta=>Annotalo mentalmente e cerca conferme"]],
      ["demon-identification", "Identificazione del demone", "Incrociare segni, corpo e database", "Il risultato richiede di individuare il corpo corretto e il demone corretto usando più fonti; una singola manifestazione non basta.", ["Raccogli i sigilli", "Consulta il database", "Confronta i nomi possibili", "Osserva i corpi durante il turno", "Scegli soltanto quando gli indizi convergono"], ["Evita di decidere troppo presto", "Controlla forma e ordine dei sigilli", "Tieni separati identità del demone e corpo posseduto"], ["Due demoni sembrano compatibili=>Cerca il sigillo mancante", "Non riconosci il corpo=>Confronta nuovi segni ed eventi specifici"]],
      ["sigils-night-shift", "Sigilli e turno notturno", "Confermare la scelta prima della fase finale", "Sigilli incompleti, ordine errato o corpo sbagliato trasformano una buona indagine in un finale negativo.", ["Rivedi ogni sigillo", "Conferma il nome nel database", "Controlla il corpo scelto", "Prepara il marchio corretto", "Avvia la fase finale solo dopo l’ultimo controllo"], ["Usa una procedura identica a ogni turno", "Non cambiare scelta per un solo sobbalzo", "Conserva tempo per la conferma finale"], ["Il marchio non corrisponde=>Ricontrolla ordine e famiglia del demone", "Il turno termina male=>Separa errore sul corpo da errore sui sigilli"]],
      ["survival-inventory", "Inventario e sopravvivenza", "Tenere gli strumenti essenziali raggiungibili", "Lo spazio limitato obbliga a scegliere cosa portare; una buona routine riduce viaggi e confusione durante gli eventi.", ["Porta clipboard e strumento corrente", "Conserva gli oggetti investigativi", "Deposita ciò che appartiene a fasi concluse", "Mantieni libero almeno uno spazio", "Controlla l’inventario prima di uscire dalla stanza"], ["Non raccogliere tutto insieme", "Gli oggetti chiave meritano una posizione mentale", "Apri l’inventario in una zona sicura"], ["Non puoi raccogliere un oggetto=>Libera uno slot", "Hai perso uno strumento=>Ripercorri l’ultima fase e i piani di lavoro"]],
      ["possession-stability", "Possessione e pressione", "Capire quando il turno sta peggiorando", "Allucinazioni, eventi e perdita di controllo aumentano la pressione narrativa; avanzare nel lavoro e nell’identificazione resta la risposta centrale.", ["Non abbandonare la checklist", "Completa una fase alla volta", "Cerca indizi tra gli eventi", "Evita giri inutili", "Prepara la decisione finale con anticipo"], ["La fretta produce errori permanenti", "Gli eventi possono cambiare tra i turni", "La conoscenza della struttura riduce la paura"], ["Ti blocchi dopo un evento=>Torna all’ultima attività verificabile", "Il turno sembra ormai perso=>Completa comunque l’indagine per imparare la causa"]],
      ["endings-secrets", "Finali e segreti", "Scoprire River Fields senza rovinare la prima conclusione", "Finali multipli, oggetti e frammenti di lore richiedono più turni; la prima partita va protetta dalle soluzioni complete.", ["Concludi una prima volta senza guida ai finali", "Conserva gli indizi trovati", "Esplora nuove interazioni nei turni successivi", "Cambia una decisione alla volta", "Usa i salvataggi disponibili con attenzione"], ["Un finale negativo offre informazioni", "La lore si ricompone su più turni", "Non cercare ogni segreto durante il tutorial"], ["Ottieni sempre lo stesso finale=>Modifica un requisito alla volta", "Manca un oggetto narrativo=>Esplora ufficio e aree accessibili nei turni successivi"], "Spoiler protetti"],
      ["embalming-only", "Embalming Only", "Esercitarsi sul lavoro senza la pressione horror", "La Definitive Edition aggiunge una modalità di imbalsamazione continua pensata per concentrarsi sulla routine e sui corpi.", ["Seleziona Embalming Only", "Ripeti il giro degli strumenti", "Segui sempre la checklist", "Riduci i tempi senza saltare passaggi", "Usa la modalità per memorizzare la struttura"], ["È utile anche dopo una pausa", "Separa velocità e precisione", "Non sostituisce i contenuti narrativi della modalità principale"], ["La procedura resta lenta=>Prepara il percorso prima del corpo", "Vuoi tornare all’horror=>Avvia una modalità principale separata"]],
      ["definitive-content", "Definitive Edition", "Riconoscere cosa aggiunge l’edizione definitiva", "L’aggiornamento gratuito ha introdotto nuovi corpi, infestazioni, lore, obiettivi, evento di San Valentino, miglioramenti e Embalming Only.", ["Verifica che il gioco sia aggiornato", "Controlla nuovi obiettivi", "Prova Embalming Only", "Rientra nella modalità principale per nuovi eventi", "Conserva un turno per l’evento stagionale di febbraio"], ["I nuovi eventi non appaiono tutti subito", "Le correzioni migliorano stabilità e prestazioni", "I contenuti aggiuntivi si mescolano ai turni esistenti"], ["Una funzione manca=>Controlla versione e piattaforma", "Il salvataggio è precedente=>Aggiorna e carica senza cancellarlo"]],
      ["halloween-session", "Settimana di Halloween", "Preparare una sessione horror completa e sostenibile", "La guida entra nell’Area VIP dal 26 ottobre al 2 novembre: scegli durata, intensità e obiettivo prima di iniziare il turno.", ["Regola luce e audio della stanza", "Scegli modalità e aggressività", "Prepara una sessione di durata limitata", "Fermati dopo un turno completo", "Annota il finale senza cercare subito la soluzione"], ["Meglio un turno intenso che una maratona stancante", "Giocare in compagnia cambia il tono ma non le regole", "Rispetta sempre i limiti personali"], ["La tensione diventa sgradevole=>Interrompi o passa a Embalming Only", "Vuoi continuare dopo Halloween=>La guida resta valida per la Definitive Edition"]],
    ],
    sections: [
      ["enter", "Entra a River Fields", "Edizioni, primo turno e ambienti.", ["editions-accessibility", "first-shift", "mortuary-layout"]],
      ["prepare", "Prepara il corpo", "Ispezione, registro e strumenti.", ["body-inspection", "record-system", "embalming-tools"]],
      ["work", "Completa il lavoro", "Sequenza e segnali inquietanti.", ["embalming-sequence", "haunt-signs"]],
      ["identify", "Identifica l’entità", "Demone, sigilli e sopravvivenza.", ["demon-identification", "sigils-night-shift", "survival-inventory"]],
      ["survive", "Resisti al turno", "Possessione, finali e segreti.", ["possession-stability", "endings-secrets"]],
      ["definitive", "Vivi la Definitive Edition", "Embalming Only, nuovi contenuti e Halloween.", ["embalming-only", "definitive-content", "halloween-session"]],
    ],
    sources: [
      ["The Mortuary Assistant · Steam", "https://store.steampowered.com/app/1295920/The_Mortuary_Assistant/"],
      ["DarkStone Digital · sito ufficiale", "https://www.darkstonedigital.com/"],
      ["Definitive Edition · annuncio ufficiale", "https://store.steampowered.com/news/posts/?enddate=1721315189&feed=steam_community_announcements"],
      ["DarkStone · trailer Definitive Edition", "https://www.youtube.com/watch?v=b8mdz1EAyV4"],
    ],
  },
];

function normalizeImage(image, game, index) {
  const [source, alt, caption] = image;
  return {
    sourceUrl: source.startsWith("http") ? source : steamShot(game === "cyberpunk-2077" ? "1091500" : "1295920", source),
    alt,
    caption: `${caption} · mostrata integralmente`,
    filename: `${String(index + 1).padStart(2, "0")}-${game}.webp`,
  };
}

async function downloadImage(url, output, background) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 LoreWiseGuideBuilder/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const input = Buffer.from(await response.arrayBuffer());
  await sharp(input)
    .resize(1600, 900, { fit: "contain", background, withoutEnlargement: false })
    .webp({ quality: 89, effort: 5 })
    .toFile(output);
}

for (const guide of guides) {
  if (guide.chapters.length !== 16 || guide.images.length !== 16 || guide.sections.length !== 6) {
    throw new Error(`${guide.slug}: servono 16 capitoli, 16 immagini e 6 sezioni`);
  }
  const assetRoot = path.join(root, "public", "atlas", guide.slug);
  const chapterRoot = path.join(assetRoot, "chapters");
  await mkdir(chapterRoot, { recursive: true });
  await downloadImage(guide.coverUrl, path.join(assetRoot, "cover.webp"), guide.palette);

  const images = guide.images.map((image, index) => normalizeImage(image, guide.slug, index));
  for (const [index, image] of images.entries()) {
    const chapter = guide.chapters[index];
    image.filename = `${String(index + 1).padStart(2, "0")}-${chapter[0]}.webp`;
    await downloadImage(image.sourceUrl, path.join(chapterRoot, image.filename), guide.palette);
  }

  const chapters = guide.chapters.map((chapter, index) => {
    const [id, label, title, introduction, steps, tips, scenarios, spoiler = "No spoiler"] = chapter;
    const image = images[index];
    return {
      id, number: String(index + 1).padStart(2, "0"), label, estimatedRead: "14–19 min", spoiler, title, introduction,
      images: [{ src: `/atlas/${guide.slug}/chapters/${image.filename}`, alt: image.alt, caption: image.caption, sourceUrl: image.sourceUrl }],
      blocks: [
        { label: "Percorso", title: "Procedura consigliata", text: introduction, steps },
        { label: "Decisioni", title: "Cosa fa davvero la differenza", text: `Nel capitolo “${title}” conta mantenere un obiettivo leggibile e cambiare una scelta alla volta.`, tips },
        { label: "Diagnosi", title: "Se qualcosa non funziona", text: "Parti dal problema osservabile e verifica contesto, requisiti e sequenza prima di cambiare tutto.", scenarios: scenarios.map((entry) => { const [problem, answer] = entry.split("=>"); return { problem, answer }; }), warning: "Conserva un salvataggio sicuro prima delle scelte irreversibili o dei passaggi narrativi importanti." },
      ],
    };
  });

  const built = {
    id: `${guide.slug}-complete-guide-01`, slug: guide.slug, code: guide.code, game: guide.game,
    title: guide.title, subtitle: guide.subtitle, description: guide.description, versionLabel: guide.versionLabel,
    updatedAt: "24 agosto 2026", vipFrom: guide.vipFrom, publicAt: guide.publicAt, theme: guide.slug,
    cover: { src: `/atlas/${guide.slug}/cover.webp`, alt: guide.coverAlt, caption: guide.coverCaption, sourceUrl: guide.coverUrl },
    storeUrl: guide.storeUrl, storeLabel: guide.storeLabel,
    ...(guide.livingGuide ? { livingGuide: guide.livingGuide } : {}),
    chapters,
    sections: guide.sections.map(([id, label, summary, chapterIds], index) => ({
      id, label, summary, icon: chapters.find((chapter) => chapter.id === chapterIds[0]).images[0],
      generatedIcon: {
        src: `/atlas/${guide.slug}/generated-icons-v1/${String(index + 1).padStart(2, "0")}-${id === "match" ? "tactics" : id === "coach" ? "special" : id === "chronicle" ? "team" : id === "connect" ? "chronicle" : id === "future" ? "future" : id}.webp`,
        alt: `Icona originale dedicata alla sezione ${label}`,
        caption: `${label} · icona tematica originale generata con ImageGen`,
      },
      chapterIds,
    })),
    sources: guide.sources.map(([label, href]) => ({ label, href })),
  };
  await writeFile(path.join(root, "data", `${guide.slug}-guide.json`), `${JSON.stringify(built, null, 2)}\n`, "utf8");
  console.log(`${guide.game}: 16 capitoli, 48 schede e 17 immagini web ufficiali.`);
}
