export type VipAtelierMediaPrivate = {
  id: string;
  mediaId: string;
  sourceFile: string;
  objectKey: string;
  title: string;
  alt: string;
};

export const VIP_ATELIER_MEDIA_PRIVATE = [
  { id: "forest-01", mediaId: "vip-atelier-forest-01", sourceFile: "set1/1.jpg", objectKey: "vip-zone/atelier/previews/forest-01.webp", title: "Insieme nel bosco - fase 1", alt: "Prima costruzione a matita del ritratto con una ragazza e il suo cane" },
  { id: "forest-02", mediaId: "vip-atelier-forest-02", sourceFile: "set1/2.jpg", objectKey: "vip-zone/atelier/previews/forest-02.webp", title: "Insieme nel bosco - fase 2", alt: "Disegno rifinito dei due protagonisti prima del colore" },
  { id: "forest-03", mediaId: "vip-atelier-forest-03", sourceFile: "set1/3.jpg", objectKey: "vip-zone/atelier/previews/forest-03.webp", title: "Insieme nel bosco - fase 3", alt: "I protagonisti acquistano colore mentre lo sfondo resta in costruzione" },
  { id: "forest-04", mediaId: "vip-atelier-forest-04", sourceFile: "set1/4.jpg", objectKey: "vip-zone/atelier/previews/forest-04.webp", title: "Insieme nel bosco - fase 4", alt: "Composizione completa con la ragazza e il cane immersi nel paesaggio" },
  { id: "midnight-01", mediaId: "vip-atelier-midnight-01", sourceFile: "set2/1.jpg", objectKey: "vip-zone/atelier/previews/midnight-01.webp", title: "Icona dopo mezzanotte - fase 1", alt: "Primo studio in bianco e nero di un volto diviso e deformato" },
  { id: "midnight-02", mediaId: "vip-atelier-midnight-02", sourceFile: "set2/2.jpg", objectKey: "vip-zone/atelier/previews/midnight-02.webp", title: "Icona dopo mezzanotte - fase 2", alt: "Seconda fase del ritratto horror con identita e capelli definiti" },
  { id: "midnight-03", mediaId: "vip-atelier-midnight-03", sourceFile: "set2/3.jpg", objectKey: "vip-zone/atelier/previews/midnight-03.webp", title: "Icona dopo mezzanotte - fase 3", alt: "Terza fase del ritratto con contrasti e deformazioni approfonditi" },
  { id: "midnight-04", mediaId: "vip-atelier-midnight-04", sourceFile: "set2/4.jpg", objectKey: "vip-zone/atelier/previews/midnight-04.webp", title: "Icona dopo mezzanotte - fase 4", alt: "Versione completa in bianco e nero del ritratto horror" },
  { id: "reason", mediaId: "vip-atelier-reason", sourceFile: "bozz inedite/1.jpg", objectKey: "vip-zone/atelier/previews/reason.webp", title: "Il sonno genera mostri", alt: "Composizione in bianco e nero sul sonno della ragione" },
  { id: "zombie-sketch", mediaId: "vip-atelier-zombie-sketch", sourceFile: "bozz inedite/3.jpg", objectKey: "vip-zone/atelier/previews/zombie-sketch.webp", title: "Ritratto Zombie - studio", alt: "Studio lineare di un volto con occhiali e sorriso esasperato" },
  { id: "zombie-final", mediaId: "vip-atelier-zombie-final", sourceFile: "bozz inedite/4.jpg", objectKey: "vip-zone/atelier/previews/zombie-final.webp", title: "Ritratto Zombie - compiuto", alt: "Versione a colori del personaggio Zombie" },
  { id: "se-mi-lasci", mediaId: "vip-atelier-se-mi-lasci", sourceFile: "se mi lasci ti cancello.jpg", objectKey: "vip-zone/atelier/previews/se-mi-lasci.webp", title: "Se mi lasci ti cancello", alt: "Anteprima protetta dell'opera Se mi lasci ti cancello" },
  { id: "bianca-neve", mediaId: "vip-atelier-bianca-neve", sourceFile: "bianca neve.jpg", objectKey: "vip-zone/atelier/previews/bianca-neve.webp", title: "Bianca Neve", alt: "Anteprima protetta dell'opera Bianca Neve" },
  { id: "fantozz", mediaId: "vip-atelier-fantozz", sourceFile: "Fantozz.jpg", objectKey: "vip-zone/atelier/previews/fantozz.webp", title: "Studio di carattere I", alt: "Studio caricaturale in bianco e nero di un volto maschile" },
  { id: "merm", mediaId: "vip-atelier-merm", sourceFile: "merM.jpg", objectKey: "vip-zone/atelier/previews/merm.webp", title: "Studio di icona II", alt: "Studio in bianco e nero di un ritratto femminile cinematografico" },
] as const satisfies readonly VipAtelierMediaPrivate[];

export const VIP_ATELIER = {
  code: "LW-VIP-ATELIER-01",
  eyebrow: "Atelier VIP · Diario di studio 01",
  title: "Ogni disegno conserva il percorso.",
  subtitle: "Prima dell'opera finita esistono esitazioni, scelte e trasformazioni. Qui restano visibili.",
  introduction: "Un archivio riservato che non mostra soltanto il risultato: segue il vissuto del disegno, dalla prima linea alla forma che decide di restare.",
  processes: [
    {
      id: "insieme-nel-bosco",
      kicker: "Processo creativo · Quattro fasi",
      title: "Insieme nel bosco",
      summary: "Due presenze vengono costruite come un solo ricordo. Prima il rapporto, poi il colore, infine il luogo che le custodisce.",
      closing: "Il paesaggio arriva per ultimo: non domina i protagonisti, li accoglie.",
      phases: [
        { mediaId: "vip-atelier-forest-01", label: "Fase 01", title: "Il primo incontro", story: "La composizione cerca subito la vicinanza fra i due soggetti. Le linee ancora aperte lasciano spazio alla postura e al legame." },
        { mediaId: "vip-atelier-forest-02", label: "Fase 02", title: "Il legame prende forma", story: "I volti e il pelo acquistano identita. Il disegno si concentra sulle espressioni prima di scegliere il mondo che li circonda." },
        { mediaId: "vip-atelier-forest-03", label: "Fase 03", title: "Il colore entra nel ricordo", story: "Il colore separa i piani e rende i protagonisti presenti. Lo sfondo resta in attesa, come una memoria ancora da mettere a fuoco." },
        { mediaId: "vip-atelier-forest-04", label: "Fase 04", title: "Il mondo si chiude attorno a loro", story: "La scena completa restituisce profondita e atmosfera. Il percorso termina quando figure e ambiente iniziano a raccontarsi insieme." },
      ],
    },
    {
      id: "icona-dopo-mezzanotte",
      kicker: "Processo creativo · Quattro fasi",
      title: "Icona dopo mezzanotte",
      summary: "Un volto riconoscibile attraversa una metamorfosi horror. L'identita non scompare: viene spezzata, duplicata e resa inquieta.",
      closing: "La deformazione funziona perche il volto originario rimane ancora leggibile sotto la frattura.",
      phases: [
        { mediaId: "vip-atelier-midnight-01", label: "Fase 01", title: "La frattura", story: "Il volto nasce gia diviso. La prima costruzione stabilisce la tensione tra ritratto e creatura senza nascondere il segno iniziale." },
        { mediaId: "vip-atelier-midnight-02", label: "Fase 02", title: "L'identita ritorna", story: "Capelli, sguardo e profilo rendono il soggetto riconoscibile. L'orrore cresce attorno a un'identita che resiste." },
        { mediaId: "vip-atelier-midnight-03", label: "Fase 03", title: "Il contrasto si approfondisce", story: "Le masse scure e le linee del volto vengono riequilibrate. Le due meta smettono di competere e diventano una sola presenza." },
        { mediaId: "vip-atelier-midnight-04", label: "Fase 04", title: "Dopo mezzanotte", story: "La versione compiuta conserva l'energia del tratto e rende definitiva la metamorfosi, senza levigare l'inquietudine del disegno." },
      ],
    },
  ],
  notebook: [
    {
      id: "reason",
      index: "Taccuino 01",
      title: "Il sonno genera mostri",
      mediaIds: ["vip-atelier-reason"],
      story: "Una frase attraversa la pagina e diventa immagine. Il volto umano e la presenza alle sue spalle condividono lo stesso incubo.",
      state: "Visione completa",
    },
    {
      id: "zombie",
      index: "Taccuino 02",
      title: "Nascita di Zombie",
      mediaIds: ["vip-atelier-zombie-sketch", "vip-atelier-zombie-final"],
      story: "Una bozza rapida trova il proprio personaggio. Il passaggio al colore non cancella l'irregolarita del primo segno: la trasforma in carattere.",
      state: "Studio e compiuto",
    },
    {
      id: "se-mi-lasci",
      index: "Taccuino 03",
      title: "Se mi lasci ti cancello",
      mediaIds: ["vip-atelier-se-mi-lasci"],
      story: "Il ricordo diventa materia da trattenere o cancellare. La tavola resta sospesa nel momento in cui un legame prova a sopravvivere alla propria scomparsa.",
      state: "Opera inedita",
    },
    {
      id: "bianca-neve",
      index: "Taccuino 04",
      title: "Bianca Neve",
      mediaIds: ["vip-atelier-bianca-neve"],
      story: "Una figura conosciuta attraversa una nuova interpretazione. Il disegno conserva l'eco della fiaba e la conduce verso una presenza piu personale e contemporanea.",
      state: "Opera inedita",
    },
  ],
  studies: [
    { id: "study-character", index: "Studio 01", title: "Il carattere prima della somiglianza", mediaId: "vip-atelier-fantozz", story: "Il ritratto cerca il peso dell'espressione: sopracciglia, bocca e postura diventano una grammatica della personalita." },
    { id: "study-icon", index: "Studio 02", title: "Quando un volto diventa icona", mediaId: "vip-atelier-merm", story: "Il bianco e nero riduce il rumore e lascia emergere silhouette, sguardo e presenza scenica." },
  ],
  rightsNote: "Studi interpretativi non ufficiali. I riferimenti culturali e le identita raffigurate restano ai rispettivi titolari; le tavole sono presentate come documentazione del processo artistico.",
} as const;
