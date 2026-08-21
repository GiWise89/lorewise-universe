export const commissionCategories = [
  "Ritratti personalizzati",
  "Bambini",
  "Coppie e legami",
  "Animali",
  "Trasformazioni fantasy/horror",
  "Fan art e ritratti iconici",
] as const;

export type CommissionCategory = (typeof commissionCategories)[number];

export type CommissionWork = {
  slug: string;
  code: string;
  image: string;
  title: string;
  category: CommissionCategory;
  requestType: string;
  year: string;
  technique: string;
  description: string;
  resolution: string;
  featured?: boolean;
  fanArt?: boolean;
  project?: "caroline" | "giorgego";
};

const technique = "Illustrazione digitale, line art e colorazione digitale.";

const catalogSeed: Omit<CommissionWork, "slug" | "code" | "image" | "technique" | "year">[] = [
  { title: "Piccola luce", category: "Bambini", requestType: "Ritratto infantile", description: "Un ritratto luminoso costruito attorno all’espressione e ai colori caldi dell’infanzia.", resolution: "2480 × 3508 px" },
  { title: "Regina di sé", category: "Ritratti personalizzati", requestType: "Ritratto pop", description: "Una commissione energica che trasforma il soggetto in un’icona pop sicura e celebrativa.", resolution: "1748 × 2480 px" },
  { title: "Visione al tramonto", category: "Ritratti personalizzati", requestType: "Ritratto ambientato", description: "La luce del tramonto accompagna un ritratto elegante, definito dai capelli intrecciati e dallo sguardo diretto.", resolution: "1748 × 2480 px", project: "caroline" },
  { title: "Eleganza lunare", category: "Ritratti personalizzati", requestType: "Ritratto ambientato", description: "Una seconda interpretazione più essenziale, con posa laterale e atmosfera morbida.", resolution: "2480 × 3508 px", project: "caroline" },
  { title: "Radici e orizzonti", category: "Ritratti personalizzati", requestType: "Ritratto ambientato", description: "Un ritratto ravvicinato che valorizza lineamenti, texture e luce naturale.", resolution: "2480 × 3508 px", featured: true, project: "caroline" },
  { title: "Sete cremisi", category: "Trasformazioni fantasy/horror", requestType: "Trasformazione horror", description: "Il ritratto personale diventa una figura vampiresca attraverso occhi innaturali, palette cremisi e dettagli gotici.", resolution: "2480 × 3508 px", featured: true },
  { title: "Il sorriso del caos", category: "Trasformazioni fantasy/horror", requestType: "Trasformazione horror", description: "Una trasformazione da clown horror che conserva la riconoscibilità del volto e ne esaspera il lato inquietante.", resolution: "2480 × 3508 px" },
  { title: "Sguardo di porpora", category: "Ritratti personalizzati", requestType: "Ritratto ravvicinato", description: "Un primo studio del soggetto, concentrato sull’espressione e sui contrasti cromatici.", resolution: "2480 × 3377 px", project: "giorgego" },
  { title: "Riflessi d’autunno", category: "Ritratti personalizzati", requestType: "Ritratto ambientato", description: "La seconda interpretazione apre il ritratto verso un paesaggio caldo e una posa più spontanea.", resolution: "2480 × 3508 px", project: "giorgego" },
  { title: "Identità GiWise", category: "Ritratti personalizzati", requestType: "Avatar professionale", description: "Un autoritratto illustrato pensato come identità visiva e firma creativa di GiWise Studio.", resolution: "2480 × 3508 px" },
  { title: "Noi, senza filtri", category: "Coppie e legami", requestType: "Ritratto di coppia", description: "Due persone riunite in un’unica composizione, con dettagli personali e un linguaggio grafico condiviso.", resolution: "2480 × 3508 px", featured: true },
  { title: "Il traghettatore", category: "Trasformazioni fantasy/horror", requestType: "Trasformazione dark", description: "Un volto reale reinterpretato come presenza oscura, attraverso segni spezzati e uno sguardo soprannaturale.", resolution: "1748 × 2480 px" },
  { title: "Contrasto", category: "Ritratti personalizzati", requestType: "Ritratto monocromatico", description: "Un ritratto in bianco e nero affidato alla forza della linea e al rapporto netto tra luce e ombra.", resolution: "2480 × 3508 px" },
  { title: "Spirito guerriero", category: "Trasformazioni fantasy/horror", requestType: "Trasformazione fantasy", description: "Il soggetto viene trasformato in una guerriera contemporanea, tra simbologia nordica e carattere personale.", resolution: "2480 × 3508 px" },
  { title: "Leo · Piccolo sole", category: "Animali", requestType: "Ritratto di animale", description: "Un ritratto affettuoso che conserva espressione, pelo e proporzioni del piccolo protagonista.", resolution: "2480 × 3508 px", featured: true },
  { title: "Lil Peep & XXXTentacion", category: "Fan art e ritratti iconici", requestType: "Ritratto commemorativo su commissione", description: "Un doppio ritratto commemorativo richiesto come omaggio personale ai due artisti.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Promessa al tramonto", category: "Coppie e legami", requestType: "Ritratto di coppia", description: "Una scena romantica costruita sul gesto, sulla vicinanza e sulla luce calda del tramonto.", resolution: "2480 × 3508 px" },
  { title: "Guerriera delle rovine", category: "Trasformazioni fantasy/horror", requestType: "Trasformazione fantasy", description: "Un ritratto trasformato in personaggio da battaglia, con armatura, paesaggio e presenza scenica.", resolution: "2480 × 3508 px" },
  { title: "Marilyn Manson · Ritratto I", category: "Fan art e ritratti iconici", requestType: "Ritratto musicale su commissione", description: "Un ritratto scenico di Marilyn Manson, costruito tra eleganza teatrale e atmosfera inquietante.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Michael Jackson", category: "Fan art e ritratti iconici", requestType: "Ritratto musicale su commissione", description: "Un omaggio illustrato a Michael Jackson, con il palco e il movimento evocati sullo sfondo.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Marilyn Manson · Ritratto II", category: "Fan art e ritratti iconici", requestType: "Ritratto musicale su commissione", description: "Una seconda commissione dedicata a Marilyn Manson, più ravvicinata, grafica e monocromatica.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Player One", category: "Ritratti personalizzati", requestType: "Ritratto lifestyle", description: "Un ritratto personale ambientato nella postazione gaming, ricco di elementi che raccontano interessi e stile.", resolution: "2480 × 3508 px", featured: true },
  { title: "Urlo di scena", category: "Trasformazioni fantasy/horror", requestType: "Trasformazione horror", description: "Una trasformazione clown intensa ed espressiva, progettata per dare al volto una nuova identità scenica.", resolution: "1440 × 2304 px" },
  { title: "The Notorious B.I.G.", category: "Fan art e ritratti iconici", requestType: "Ritratto musicale su commissione", description: "Un ritratto su commissione dedicato a The Notorious B.I.G., incorniciato da una luce neon contemporanea.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Noyz Narcos · Doppio volto", category: "Fan art e ritratti iconici", requestType: "Reinterpretazione horror su commissione", description: "Un ritratto richiesto come reinterpretazione horror di Noyz Narcos, diviso tra identità reale e creatura.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Piccola ribelle", category: "Bambini", requestType: "Ritratto infantile", description: "Un ritratto giovane e diretto, costruito su colori chiari, sguardo e personalità.", resolution: "2480 × 3508 px" },
  { title: "Snoop Dogg", category: "Fan art e ritratti iconici", requestType: "Ritratto musicale su commissione", description: "Un ritratto illustrato di Snoop Dogg con riferimenti visivi riconoscibili e una palette verde profonda.", resolution: "2480 × 3508 px", fanArt: true },
  { title: "Estate elettrica", category: "Ritratti personalizzati", requestType: "Ritratto lifestyle", description: "Una posa dinamica e una luce calda trasformano il ritratto in una copertina personale contemporanea.", resolution: "2480 × 3499 px" },
  { title: "Cielo negli occhi", category: "Ritratti personalizzati", requestType: "Ritratto ambientato", description: "Un ritratto sereno e luminoso in cui lineamenti, capelli e cielo condividono la stessa atmosfera.", resolution: "2480 × 3508 px" },
  { title: "Ulla · Guardia al tramonto", category: "Animali", requestType: "Ritratto di animale", description: "Il profilo fiero di Ulla viene fissato in un ritratto ambientato, fedele alla postura e al carattere.", resolution: "2480 × 3508 px" },
  { title: "Warhammer 40,000 · Campione del Caos", category: "Fan art e ritratti iconici", requestType: "Reinterpretazione fan-made su commissione", description: "Il committente viene reinterpretato all’interno dell’universo di Warhammer 40,000 come guerriero corazzato.", resolution: "2480 × 3508 px", fanArt: true, featured: true },
  { title: "Luce sul mare", category: "Ritratti personalizzati", requestType: "Ritratto ambientato", description: "Un momento rilassato sul mare trasformato in un ritratto caldo, naturale e personale.", resolution: "2480 × 3508 px" },
];

export const commissionWorks: CommissionWork[] = catalogSeed.map((work, index) => {
  const number = String(index + 1).padStart(3, "0");
  return {
    ...work,
    slug: `lw-com-${number}`,
    code: `LW-COM-${number}`,
    image: `/commissions/previews-webp/lw-com-${number}-preview.webp`,
    technique,
    year: "2026",
  };
});

export const featuredCommissionWorks = commissionWorks.filter((work) => work.featured);
export const carolineProject = commissionWorks.filter((work) => work.project === "caroline");
export const giorgegoProject = commissionWorks.filter((work) => work.project === "giorgego");
