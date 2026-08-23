const source = (title, url, kind = "secondary") => ({ title, url, kind, note: "Fonte selezionata per verificare identita, sviluppo, continuita e stato documentato." });
const entry = (phases, sources, profile = {}) => ({ phases, sources, profile });

const cartoonNetwork = (path) => source("Cartoon Network · archivio della serie", `https://www.cartoonnetwork.com/tv_shows/${path}/`, "official");
const wikipediaIt = (path, title = "Wikipedia · voce enciclopedica") => source(title, `https://it.wikipedia.org/wiki/${path}`);
const wikipediaEn = (path, title = "Wikipedia · voce enciclopedica") => source(title, `https://en.wikipedia.org/wiki/${path}`);
const wikidata = (id) => source("Wikidata · identificatore strutturato", `https://www.wikidata.org/wiki/${id}`, "structured-secondary");

export const curatedUnresolvedDossiers = {
  "cammy-white": entry([
    "Cammy debutta in Super Street Fighter II come giovane agente britannica legata alla Delta Red, dopo essere stata impiegata e condizionata da Shadaloo.",
    "La sua storia ricostruisce il passato da Doll di M. Bison e il recupero progressivo di identita, autonomia e legami con le altre ex Dolls.",
    "Combatte con tecniche rapide, calci e manovre acrobatiche; la disciplina militare convive con la protezione delle persone sopravvissute al controllo di Shadaloo.",
    "Street Fighter 6 la presenta ancora operativa nella Delta Red: questa fase viene distinta dal film live action e dalle altre continuita adattate."
  ], [source("Street Fighter 6 · Cammy", "https://www.streetfighter.com/6/en-us/character/cammy", "official"), wikipediaIt("Cammy"), wikidata("Q2074563")]),
  "king-tekken": entry([
    "Il King documentato e il secondo lottatore a portare la maschera da giaguaro: raccoglie l'eredita del primo King dopo la sua morte e debutta in Tekken 3.",
    "Allenato da Armor King, trasforma il wrestling professionistico in uno strumento per finanziare e proteggere l'orfanotrofio legato al suo predecessore.",
    "Il rapporto con Craig Marduk passa dalla vendetta al rispetto competitivo, mentre la rivalita con Armor King II resta separata da quella del primo portatore del nome.",
    "In Tekken 8 continua a combattere come wrestler e benefattore; il dossier non fonde King I, King II e le versioni non canoniche."
  ], [source("Tekken 8 · King", "https://tekken.com/fighters/king", "official"), wikipediaEn("King_(Tekken)"), wikidata("Q2400404")]),
  "pennywise-1990": entry([
    "Questa scheda riguarda la manifestazione di It interpretata da Tim Curry nella miniserie televisiva del 1990, non la versione cinematografica moderna.",
    "L'entita assume soprattutto l'aspetto di Pennywise per attirare e terrorizzare i bambini di Derry, riemergendo secondo un ciclo pluridecennale.",
    "Il Club dei Perdenti la affronta da giovane e poi da adulto; muta forma sfruttando paure personali, memorie e fragilita del gruppo.",
    "La miniserie conclude questa continuita con lo scontro nelle fogne; romanzo, film del 2017-2019 e serie successive restano documentati separatamente."
  ], [wikipediaIt("It_(miniserie_televisiva)"), wikipediaIt("It_(personaggio)"), wikidata("Q132148")]),
  "leone-il-cane-fifone": entry([
    "Leone e un cane rosa adottato da Marilù e Giustino e vive con loro in una fattoria isolata a Altrove, nel Kansas.",
    "Pur essendo costantemente spaventato, interviene quando creature, maledizioni o visitatori minacciano la famiglia, spesso cercando informazioni al computer.",
    "Il suo coraggio non coincide con l'assenza di paura: nasce dalla scelta ripetuta di proteggere soprattutto Marilù, anche quando Giustino lo deride.",
    "La serie televisiva costituisce il riferimento principale; corti, speciali e crossover sono registrati come apparizioni distinte."
  ], [wikipediaIt("Leone_il_cane_fifone"), cartoonNetwork("courage"), wikidata("Q641486")]),
  "dexter": entry([
    "Dexter e un bambino prodigio che mantiene un laboratorio segreto dietro la propria camera, costruendo macchine e conducendo esperimenti lontano dai genitori.",
    "Le intrusioni della sorella Dee Dee e la rivalita con Mandark trasformano spesso i suoi progetti in incidenti che deve poi contenere.",
    "La sua intelligenza scientifica e eccezionale, ma orgoglio, segretezza e bisogno di controllo producono molti dei conflitti della serie.",
    "Le diverse stagioni e gli speciali modificano tono e design senza stabilire una crescita adulta definitiva del personaggio."
  ], [wikipediaIt("Il_laboratorio_di_Dexter"), cartoonNetwork("dexter"), wikidata("Q904733")]),
  "mamma-dexter-dee-dee": entry([
    "La madre di Dexter e Dee Dee e un personaggio senza nome proprio stabile nella serie e viene identificata attraverso il ruolo familiare.",
    "Gestisce la casa con forte attenzione alla pulizia e indossa quasi sempre guanti di gomma, elemento visivo ricorrente e funzionale alle gag.",
    "Non conosce normalmente l'esistenza del laboratorio: il contrasto fra quotidianita domestica e scienza segreta sostiene numerosi episodi.",
    "Il dossier mantiene solo le informazioni mostrate nella serie e non le attribuisce biografie inventate o nomi provenienti dai fan."
  ], [wikipediaEn("List_of_Dexter%27s_Laboratory_characters"), cartoonNetwork("dexter"), wikidata("Q904733")]),
  "papa-dexter-dee-dee": entry([
    "Il padre di Dexter e Dee Dee e presentato senza un nome proprio canonico stabile ed e riconoscibile come figura paterna della famiglia.",
    "Ha un comportamento entusiasta e infantile, spesso concentrato su hobby, cibo o competizioni quotidiane piu che sugli esperimenti del figlio.",
    "Come la moglie, ignora normalmente il laboratorio segreto; questa inconsapevolezza separa il mondo domestico dalle avventure scientifiche.",
    "La scheda si limita alle apparizioni televisive e non trasforma gag episodiche in una cronologia personale non attestata."
  ], [wikipediaEn("List_of_Dexter%27s_Laboratory_characters"), cartoonNetwork("dexter"), wikidata("Q904733")]),
  "mamma-mucca-pollo": entry([
    "La madre di Mucca e Pollo e una figura umana ricorrente, mostrata quasi esclusivamente dalla vita in giu come scelta visiva della serie.",
    "Svolge il ruolo di genitore affettuoso in una famiglia volutamente assurda, senza che la differenza di specie dei figli venga spiegata realisticamente.",
    "Le sue apparizioni sostengono gag domestiche e parodie della famiglia da sitcom, piu che un arco biografico continuativo.",
    "La scheda non inventa volto, nome o passato: registra soltanto cio che la serie rende visibile o dichiara."
  ], [wikipediaEn("List_of_Cow_and_Chicken_characters"), cartoonNetwork("cowchicken"), wikidata("Q719872")]),
  "papa-mucca-pollo": entry([
    "Il padre di Mucca e Pollo e un personaggio umano ricorrente rappresentato quasi sempre soltanto dalla vita in giu.",
    "Partecipa alla quotidianita familiare con un tono surreale e tratta Mucca e Pollo come figli senza fornire una spiegazione biologica.",
    "La funzione narrativa e soprattutto comica: incarna l'adulto da sitcom all'interno di situazioni deliberatamente illogiche.",
    "Nome, volto completo e biografia non vengono colmati con ipotesi: il dossier conserva il limite documentale della serie."
  ], [wikipediaEn("List_of_Cow_and_Chicken_characters"), cartoonNetwork("cowchicken"), wikidata("Q719872")]),
  "stella-winx": entry([
    "Stella e la principessa di Solaria e la fata legata al Sole e alla Luna; incontra Bloom e contribuisce alla nascita del gruppo Winx.",
    "Il suo percorso combina formazione ad Alfea, responsabilita dinastiche e maturazione personale oltre l'immagine iniziale di ragazza interessata alla moda.",
    "Usa magia luminosa e collabora stabilmente con Bloom, Flora, Musa, Tecna e Aisha nelle missioni del gruppo.",
    "Le serie animate, i film e Fate: The Winx Saga sono continuita o adattamenti distinti e non vengono sommati automaticamente."
  ], [source("Winx Club · Stella", "https://winx.fandom.com/wiki/Stella", "specialist-secondary"), source("Winx Club · sito ufficiale", "https://www.winxclub.com/", "official"), wikipediaIt("Personaggi_di_Winx_Club")]),
  "flora-winx": entry([
    "Flora proviene da Linphea ed e la fata della Natura, con poteri connessi a piante, crescita e forze del mondo naturale.",
    "La sua indole gentile evolve in una maggiore sicurezza durante la formazione ad Alfea e nelle battaglie affrontate con le Winx.",
    "Il rapporto con Helia e il legame con la sorella Miele fanno parte della continuita animata principale e vanno distinti dagli adattamenti.",
    "Resta una componente centrale del gruppo nelle stagioni e nei progetti animati successivi, con trasformazioni magiche documentate fase per fase."
  ], [source("Winx Club · Flora", "https://winx.fandom.com/wiki/Flora", "specialist-secondary"), source("Winx Club · sito ufficiale", "https://www.winxclub.com/", "official"), wikipediaIt("Personaggi_di_Winx_Club")]),
  "musa-winx": entry([
    "Musa proviene da Melody ed e la fata della Musica, capace di trasformare suono, ritmo e vibrazioni in magia.",
    "La perdita della madre e il rapporto complesso con il padre Ho-Boe influenzano il suo legame con la musica e la sua crescita emotiva.",
    "La relazione con Riven attraversa separazioni e riconciliazioni e non viene ridotta a un tratto fisso del personaggio.",
    "Nella continuita animata rimane una Winx attiva; film e adattamenti live action sono trattati separatamente."
  ], [source("Winx Club · Musa", "https://winx.fandom.com/wiki/Musa", "specialist-secondary"), source("Winx Club · sito ufficiale", "https://www.winxclub.com/", "official"), wikipediaIt("Personaggi_di_Winx_Club")]),
  "aisha-winx": entry([
    "Aisha, chiamata Layla in alcune localizzazioni, e la principessa di Andros e la fata dei Fluidi o Morphix.",
    "Entra nel gruppo dopo le fondatrici e conquista autonomia rispetto ai doveri di corte, diventando una combattente e atleta particolarmente determinata.",
    "Il legame con Nabu e il lutto conseguente segnano una svolta importante, senza esaurire il suo ruolo nelle missioni successive.",
    "La scheda segue la continuita animata e registra separatamente nomi localizzati, film e reinterpretazioni live action."
  ], [source("Winx Club · Aisha", "https://winx.fandom.com/wiki/Aisha", "specialist-secondary"), source("Winx Club · sito ufficiale", "https://www.winxclub.com/", "official"), wikipediaIt("Personaggi_di_Winx_Club")]),
  "re-ramses": entry([
    "Re Ramses e il fantasma di un antico sovrano la cui stele viene sottratta e finisce alla fattoria di Leone.",
    "Appare davanti alla casa e impone la restituzione della stele, annunciando tre piaghe quando Giustino rifiuta per avidita.",
    "Leone affronta le conseguenze delle maledizioni mentre cerca di proteggere la famiglia e riportare l'oggetto al suo posto.",
    "Il personaggio appartiene soprattutto all'episodio La maledizione di Re Ramses e non possiede un arco continuativo oltre quella vicenda."
  ], [source("Courage Wiki · King Ramses", "https://courage.fandom.com/wiki/King_Ramses", "specialist-secondary"), wikipediaEn("King_Ramses%27_Curse"), wikidata("Q641486")]),
  "tiger-man": entry([
    "Naoto Date assume l'identita mascherata dell'Uomo Tigre dopo essere stato addestrato dalla Tana delle Tigri come lottatore spietato.",
    "Il contatto con gli orfani che lo ammirano lo porta a rompere con l'organizzazione e a usare i guadagni del ring per sostenerli.",
    "La lotta contro gli emissari della Tana unisce redenzione personale, wrestling e protezione dell'orfanotrofio.",
    "Manga, prima serie animata, Uomo Tigre II e Tiger Mask W vengono mantenuti come fasi o continuita differenti."
  ], [wikipediaIt("L%27Uomo_Tigre"), wikipediaEn("Tiger_Mask"), wikidata("Q1061995")]),
  "rick-sanchez": entry([
    "Rick Sanchez e uno scienziato capace di viaggiare fra dimensioni, inserito nella famiglia Smith come nonno di Morty e Summer.",
    "Il portale e le invenzioni gli permettono imprese cosmiche, ma alcolismo, cinismo e fuga dalle responsabilita danneggiano i rapporti familiari.",
    "La serie distingue Rick C-137, Rick Prime, cloni e varianti: condividere aspetto o nome non significa condividere la stessa biografia.",
    "Il personaggio continua nella serie televisiva in corso; il dossier aggiorna gli eventi per stagione senza anticipare un finale non ancora prodotto."
  ], [source("Adult Swim · Rick and Morty", "https://www.adultswim.com/videos/rick-and-morty", "official"), wikipediaEn("Rick_Sanchez"), wikidata("Q20008422")]),
  "morty-smith": entry([
    "Morty Smith e il nipote adolescente di Rick e il suo compagno piu frequente nelle spedizioni interdimensionali.",
    "All'inizio insicuro e facilmente travolto dagli eventi, accumula esperienza, diffidenza e capacita decisionale dopo le conseguenze delle avventure.",
    "Funziona spesso da contrappeso morale a Rick, pur compiendo scelte discutibili e vivendo relazioni diverse nelle varie dimensioni.",
    "La continuita mantiene separati Morty principale, Evil Morty e le molte varianti; la serie televisiva resta aperta."
  ], [source("Adult Swim · Rick and Morty", "https://www.adultswim.com/videos/rick-and-morty", "official"), wikipediaEn("Morty_Smith"), wikidata("Q20008421")]),
  "grisu-draghetto": entry([
    "Grisu e un giovane drago che rifiuta la professione incendiaria della propria specie e desidera diventare pompiere.",
    "Suo padre Fume tenta di ricondurlo alla tradizione dei draghi, mentre Grisu cerca lavori e occasioni per dimostrare la propria vocazione.",
    "Il soffio di fuoco, spesso involontario, crea il paradosso centrale: possiede proprio la capacita opposta al mestiere che sogna.",
    "Le serie animate successive riprendono il nucleo del personaggio con episodi e produzioni da distinguere dall'edizione originaria."
  ], [wikipediaIt("Gris%C3%B9_il_draghetto"), source("Mondo TV · Grisù", "https://www.mondotv.it/", "official"), wikidata("Q1362417")]),
  "power-ranger-bianco": entry([
    "Tommy Oliver diventa il Ranger Bianco dopo aver perso stabilmente i poteri del Ranger Verde nella continuita Mighty Morphin.",
    "Zordon gli affida i poteri della Tigre Bianca, la spada parlante Saba e in seguito la guida operativa della squadra.",
    "La nuova identita segna il passaggio da ex avversario controllato da Rita a leader affidabile e alleato dei Rangers.",
    "Le successive identita Ranger di Tommy e le versioni cinematografiche vengono registrate separatamente dalla fase Mighty Morphin."
  ], [source("Power Rangers · sito ufficiale", "https://powerrangers.hasbro.com/", "official"), source("RangerWiki · White Ranger", "https://powerrangers.fandom.com/wiki/Tommy_Oliver", "specialist-secondary"), wikipediaIt("Tommy_Oliver")]),
  "mighty-morphin-megazord": entry([
    "Il Dino Megazord nasce dalla combinazione dei cinque Dinozord pilotati dai Mighty Morphin Power Rangers.",
    "La configurazione consente alla squadra di affrontare mostri ingigantiti, alternando combattimento corpo a corpo e Power Sword.",
    "Danni, sostituzioni degli Zord e nuovi sistemi combinati modificano il ruolo del Megazord nel corso della serie.",
    "Thunder Megazord, Ninja Megazord e versioni di altre squadre sono macchine diverse e non vengono trattate come un unico corpo."
  ], [source("Power Rangers · sito ufficiale", "https://powerrangers.hasbro.com/", "official"), source("RangerWiki · Dino Megazord", "https://powerrangers.fandom.com/wiki/Dino_Megazord", "specialist-secondary"), wikipediaEn("Megazord")]),
  "coco-bandicoot": entry([
    "Coco Bandicoot e la sorella minore di Crash e viene introdotta come inventrice e specialista informatica nella serie di Naughty Dog.",
    "Dopo un iniziale ruolo di supporto diventa progressivamente giocabile, guidando veicoli e partecipando direttamente alle missioni.",
    "La competenza tecnica completa l'approccio fisico di Crash e sostiene il gruppo contro Cortex e le minacce temporali o dimensionali.",
    "I remake e Crash Bandicoot 4 riorganizzano apparizioni e giocabilita; la cronologia originale e quella moderna restano esplicitate."
  ], [source("Crash Bandicoot · sito ufficiale", "https://www.crashbandicoot.com/", "official"), wikipediaEn("Coco_Bandicoot"), wikidata("Q5140400")]),
  "dino-flintstones": entry([
    "Dino e l'animale domestico della famiglia Flintstone, uno Snorkasaurus trattato come un cane affettuoso nell'eta della pietra della serie.",
    "Accoglie spesso Fred con entusiasmo fisico e partecipa alla vita di casa, alle gag e alle avventure familiari.",
    "La caratterizzazione privilegia fedelta, energia e gelosia occasionale, senza trasformarlo in un dinosauro realistico.",
    "Serie, speciali e film presentano variazioni di design e voce; il dossier mantiene la sitcom animata come continuita principale."
  ], [wikipediaEn("Dino_(The_Flintstones)"), source("Warner Bros. · The Flintstones", "https://www.warnerbros.com/tv/flintstones", "official"), wikidata("Q5278483")]),
  "wile-e-coyote": entry([
    "Willy il Coyote e un predatore del deserto che dedica piani elaborati alla cattura di Beep Beep nei cortometraggi Looney Tunes.",
    "Acquista congegni ACME, costruisce trappole e applica teorie ingegnose che falliscono per difetti, tempismo o regole comiche del mondo.",
    "La perseveranza e l'autostima da genio contrastano con risultati disastrosi; in alcune apparizioni parla, ma la coppia classica e quasi muta.",
    "Cortometraggi con Beep Beep, incontri con Bugs Bunny e produzioni successive sono catalogati senza fondere automaticamente ogni ruolo."
  ], [wikipediaIt("Willy_il_Coyote_e_Beep_Beep"), source("Looney Tunes · sito ufficiale", "https://www.looneytunes.com/", "official"), wikidata("Q822524")]),
  "beep-beep-road-runner": entry([
    "Beep Beep e un velocissimo uccello del deserto inseguito senza successo da Willy il Coyote nei cortometraggi Looney Tunes.",
    "Sfugge alle trappole grazie a velocita, traiettorie impossibili e una consapevolezza istintiva delle regole fisiche comiche.",
    "Il richiamo onomatopeico e la corsa costituiscono i suoi segni distintivi; raramente agisce come aggressore diretto.",
    "Le apparizioni moderne possono ampliare il contesto, ma non cancellano la struttura essenziale dei corti diretti da Chuck Jones."
  ], [wikipediaIt("Willy_il_Coyote_e_Beep_Beep"), source("Looney Tunes · sito ufficiale", "https://www.looneytunes.com/", "official"), wikidata("Q230225")]),
  "jake-the-dog": entry([
    "Jake e un cane magico capace di allungare e trasformare il corpo ed e il fratello adottivo e compagno d'avventure di Finn.",
    "L'esperienza, l'umorismo e un passato non sempre lineare lo rendono mentore informale, pur lasciandolo incline alla distrazione.",
    "Costruisce una famiglia con Lady Iridella e i loro figli, mentre il rapporto con Finn rimane il centro emotivo delle avventure.",
    "Il finale della serie e gli speciali successivi documentano fasi diverse della sua esistenza senza cancellare la cronologia precedente."
  ], [source("Cartoon Network · Adventure Time", "https://www.cartoonnetwork.com/video/adventuretime/", "official"), wikipediaEn("Jake_the_Dog"), wikidata("Q3806262")]),
  "jules-winnfield": entry([
    "Jules Winnfield e un sicario al servizio di Marsellus Wallace e opera in coppia con Vincent Vega all'inizio di Pulp Fiction.",
    "Recita una versione elaborata di Ezechiele 25:17 prima delle esecuzioni, usando il discorso come rituale di dominio.",
    "Dopo essere sopravvissuto a una sparatoria interpreta l'evento come intervento divino e decide di abbandonare la vita criminale.",
    "Il confronto nella tavola calda rappresenta la sua ultima fase documentata nel film; non gli viene attribuito un seguito non mostrato."
  ], [source("Miramax · Pulp Fiction", "https://www.miramax.com/movie/pulp-fiction/", "official"), wikipediaEn("Jules_Winnfield"), wikidata("Q6309105")]),
  "mia-wallace": entry([
    "Mia Wallace e la moglie di Marsellus Wallace e una ex attrice che racconta di aver partecipato al pilota televisivo Fox Force Five.",
    "Trascorre una serata con Vincent Vega fra il Jack Rabbit Slim's e una gara di twist, in un rapporto sorvegliato dal rischio imposto da Marsellus.",
    "Scambia eroina per cocaina, subisce un'overdose e viene rianimata con adrenalina; lei e Vincent concordano di tacere l'accaduto.",
    "La sua vicenda resta circoscritta alla narrazione non lineare del film e non viene estesa con biografie speculative."
  ], [source("Miramax · Pulp Fiction", "https://www.miramax.com/movie/pulp-fiction/", "official"), wikipediaEn("Mia_Wallace"), wikidata("Q3900376")]),
  "gesu-cristo": entry([
    "Gesu di Nazareth e una figura storica e religiosa del I secolo; le fonti antiche e la ricerca moderna distinguono il profilo storico dalle affermazioni di fede.",
    "I Vangeli narrano predicazione, discepoli, guarigioni e conflitto con le autorita, mentre cronologia e dettagli sono oggetto di studio critico.",
    "La crocifissione sotto Ponzio Pilato appartiene al nucleo storico generalmente riconosciuto; risurrezione e natura divina sono centrali nella fede cristiana.",
    "Il dossier presenta separatamente dati storici, testi evangelici e dottrina, senza ridurre una tradizione religiosa a un personaggio di finzione."
  ], [source("Encyclopaedia Britannica · Jesus", "https://www.britannica.com/biography/Jesus", "reference"), source("Vaticano · Vangeli", "https://www.vatican.va/archive/ITA0001/_INDEX.HTM", "primary"), wikipediaIt("Ges%C3%B9")], {
    category: "Storia e religioni", format: "Profilo storico e religioso", classification: "Figura storica e religiosa", species: "Essere umano · figura storica e religiosa", gender: "Maschile · lui", birth: "I secolo a.C., data precisa discussa", age: "Morto nel I secolo d.C.", origin: "Giudea romana", role: "Predicatore e figura centrale del cristianesimo", continuity: "Fonti storiche, testi evangelici e tradizioni religiose mantenuti distinti", continuityNote: "Dati storici, narrazione evangelica e dottrina cristiana sono presentati su livelli distinti.", creator: "Non applicabile · persona storica", firstAppearance: "Fonti cristiane del I secolo e testimonianze antiche", firstYear: "I secolo d.C."
  }),
  "baphomet": entry([
    "Il nome Baphomet compare nelle accuse medievali rivolte ai Cavalieri templari e non identifica con certezza un culto antico unitario.",
    "Nel XIX secolo Eliphas Levi disegna la figura caprina androgina che diventa l'immagine moderna piu riconoscibile del simbolo.",
    "Occultismo, cultura popolare e movimenti successivi reinterpretano il segno con significati differenti, talvolta incompatibili.",
    "La scheda separa documenti templari, elaborazione di Levi e usi contemporanei, evitando di presentarli come una biografia continua."
  ], [source("Encyclopaedia Britannica · Baphomet", "https://www.britannica.com/topic/Baphomet", "reference"), wikipediaEn("Baphomet"), wikidata("Q217477")], {
    category: "Storia dei simboli", format: "Profilo storico e iconografico", classification: "Simbolo storico e occultistico", species: "Nome e simbolo iconografico · non persona", gender: "Non applicabile al simbolo", birth: "Attestazioni medievali; iconografia moderna dal XIX secolo", age: "Non applicabile", origin: "Accuse templari medievali e rielaborazione occultista europea", role: "Simbolo reinterpretato in contesti storici e occultistici", continuity: "Storia documentale del nome e dell'iconografia", continuityNote: "Accuse medievali, immagine di Éliphas Lévi e usi contemporanei non costituiscono un'unica entità biografica.", creator: "Origine incerta · iconografia moderna di Éliphas Lévi", firstAppearance: "Attestazioni medievali del nome Baphomet", firstYear: "Medioevo"
  }),
  "edward-mani-di-forbice": entry([
    "Edward e un essere artificiale lasciato incompleto dal proprio inventore, morto prima di sostituire le lame provvisorie con mani umane.",
    "Peg Boggs lo porta nel quartiere suburbano, dove le abilita di potatura e acconciatura generano prima curiosita e poi celebrita.",
    "Il legame con Kim e la manipolazione da parte di Jim conducono all'emarginazione e al ritorno di Edward nella villa.",
    "Il film conclude la sua storia in isolamento; musical, fumetti e altre derivazioni non vengono usati per riscrivere automaticamente quel finale."
  ], [wikipediaIt("Edward_mani_di_forbice"), source("20th Century Studios · Edward Scissorhands", "https://www.20thcenturystudios.com/movies/edward-scissorhands", "official"), wikidata("Q501707")]),
  "detective-conan": entry([
    "Shinichi Kudo e un giovane detective che viene avvelenato dall'Organizzazione Nera con APTX 4869 e si ritrova nel corpo di un bambino.",
    "Assume l'identita di Conan Edogawa, vive con Ran e Kogoro Mori e risolve casi mantenendo segreta la propria condizione.",
    "Usa strumenti creati dal professor Agasa e raccoglie indizi sull'organizzazione, mentre Ai Haibara condivide l'origine della trasformazione.",
    "Manga e anime sono ancora in sviluppo; film e speciali possono avere collocazione autonoma e non anticipano una conclusione canonica."
  ], [source("Detective Conan · portale ufficiale", "https://www.conan-portal.com/", "official"), wikipediaIt("Detective_Conan"), wikidata("Q3853685")]),
  "pingu": entry([
    "Pingu e un giovane pinguino imperatore che vive con i genitori e la sorellina Pinga in una comunita polare antropomorfa.",
    "Le storie seguono giochi, amicizie, gelosie e piccoli problemi quotidiani attraverso stop motion e un linguaggio inventato comprensibile dal contesto.",
    "Il rapporto con Robby la foca e gli altri bambini costruisce esperienze di cooperazione e conseguenze senza una crescita cronologica rigida.",
    "La serie svizzera originale e le produzioni successive mantengono lo stesso nucleo, ma vengono registrate come fasi produttive distinte."
  ], [source("Pingu · sito ufficiale", "https://www.pingu.jp/", "official"), wikipediaIt("Pingu"), wikidata("Q685225")]),
  "billy-grim-adventures": entry([
    "Billy e un bambino estremamente ingenuo e impulsivo che, insieme a Mandy, vince una sfida contro il Tristo Mietitore.",
    "La vittoria costringe Tenebra a diventare amico e compagno dei due, aprendo l'accesso a oggetti e mondi soprannaturali.",
    "L'entusiasmo di Billy genera spesso il problema dell'episodio, mentre la sua lealta e imprevedibilita possono anche risolverlo.",
    "La serie principale, i film televisivi e i crossover sono catalogati separatamente per non trasformare ogni gag in un fatto permanente."
  ], [wikipediaIt("Le_tenebrose_avventure_di_Billy_e_Mandy"), cartoonNetwork("billymandy"), wikidata("Q13923")]),
  "mandy-grim-adventures": entry([
    "Mandy e una bambina fredda, autoritaria e pragmaticamente crudele che vince con Billy la servitu eterna di Tenebra.",
    "Controlla il gruppo attraverso intelligenza, intimidazione e una quasi totale assenza di paura, contrapponendosi all'ingenuita di Billy.",
    "La sua ambizione produce scenari di potere e dominio, ma la serie li usa spesso come futuri alternativi o conseguenze episodiche.",
    "Film e crossover ampliano le apparizioni senza stabilire una sola cronologia lineare per tutte le gag."
  ], [wikipediaIt("Le_tenebrose_avventure_di_Billy_e_Mandy"), cartoonNetwork("billymandy"), wikidata("Q13923")]),
  "il-cavaliere-hollow-knight": entry([
    "Il Cavaliere e un ricettacolo nato nell'Abisso e ritorna nel regno decaduto di Nidosacro all'inizio di Hollow Knight.",
    "Esplora le rovine, acquisisce abilita e affronta l'Infezione, ricostruendo indirettamente il progetto del Re Pallido e il fallimento del Cavaliere Vacuo.",
    "Il suo grado di vuoto, le scelte del giocatore e il rapporto con Hornet determinano accesso e significato dei diversi finali.",
    "I finali vengono presentati come esiti alternativi documentati, senza dichiararne uno unico quando il gioco non lo impone."
  ], [source("Hollow Knight · sito ufficiale", "https://www.hollowknight.com/", "official"), source("Hollow Knight Wiki · Knight", "https://hollowknight.wiki/w/Knight", "specialist-secondary"), wikidata("Q65059434")]),
  "hornet-hollow-knight": entry([
    "Hornet e la figlia del Re Pallido e di Herrah la Bestia e agisce come protettrice delle rovine di Nidosacro.",
    "In Hollow Knight mette alla prova il Cavaliere, custodisce informazioni sulla sua origine e puo intervenire negli esiti legati al Cuore del Vuoto.",
    "Combatte con ago, filo e grande mobilita; la sua natura unisce eredita divina e appartenenza al popolo dei ragni.",
    "In Hollow Knight: Silksong e protagonista di una nuova vicenda: eventi e progressione del seguito restano distinti dal suo ruolo nel primo gioco."
  ], [source("Hollow Knight: Silksong · sito ufficiale", "https://www.hollowknightsilksong.com/", "official"), source("Hollow Knight Wiki · Hornet", "https://hollowknight.wiki/w/Hornet", "specialist-secondary"), wikidata("Q116532009")]),
  "annegato-minecraft": entry([
    "L'Annegato e una variante ostile dello zombie che compare negli ambienti acquatici di Minecraft e puo derivare dalla trasformazione di uno zombie sommerso.",
    "Nuota e attacca in acqua; alcuni esemplari impugnano un tridente, rendendo possibile anche l'attacco a distanza.",
    "Generazione, equipaggiamento e bottino dipendono dall'edizione e dalla versione del gioco, quindi le percentuali non vengono trattate come eterne.",
    "La scheda segue la documentazione corrente di Java e Bedrock Edition e segnala le differenze invece di unirle."
  ], [source("Minecraft Wiki · Annegato", "https://minecraft.wiki/w/Drowned", "specialist-secondary"), source("Minecraft · sito ufficiale", "https://www.minecraft.net/", "official"), wikidata("Q497692")]),
  "statua-di-dio-solo-leveling": entry([
    "La Statua di Dio domina il doppio dungeon del Tempio di Cartenon incontrato da Sung Jinwoo e dal suo gruppo all'inizio di Solo Leveling.",
    "Esegue le regole del tempio con sguardo letale, forza enorme e un sorriso immobile, punendo chi non interpreta correttamente i comandamenti.",
    "Il massacro e la prova finale conducono Jinwoo alla selezione da parte del Sistema, rendendo l'incontro il catalizzatore della sua trasformazione.",
    "Web novel, webtoon e anime rappresentano la sequenza con differenze di adattamento che il dossier mantiene separate."
  ], [source("Solo Leveling Wiki · Statue of God", "https://solo-leveling.fandom.com/wiki/Statue_of_God", "specialist-secondary"), source("Crunchyroll · Solo Leveling", "https://www.crunchyroll.com/series/GDKHZEJ0K/solo-leveling", "official"), wikipediaIt("Solo_Leveling")]),
  "joe-bastianich": entry([
    "Joe Bastianich e un ristoratore, imprenditore vinicolo, autore e personaggio televisivo statunitense di origine italiana.",
    "Ha sviluppato attivita nella ristorazione con la famiglia Bastianich e con partner professionali, partecipando alla gestione di ristoranti e aziende vinicole.",
    "La notorieta televisiva deriva soprattutto dai ruoli di giudice in programmi come MasterChef negli Stati Uniti e in Italia.",
    "Le attivita musicali e mediatiche piu recenti vengono documentate come carriera pubblica; vita privata e valutazioni personali restano fuori dal dossier."
  ], [source("Joe Bastianich · sito ufficiale", "https://joebastianich.com/", "official"), wikipediaIt("Joe_Bastianich"), wikidata("Q3808635")]),
  "dino-cooptv": entry([
    "Dino CoopTV e documentato come autore e volto del progetto digitale CoopTV, nel contesto dell'intrattenimento online italiano.",
    "La scheda ricostruisce soltanto contenuti, collaborazioni e presenze pubbliche attribuite ai canali ufficiali del progetto.",
    "Eventuali personaggi interpretati in video vengono distinti dalla persona reale e non sono usati per dedurre dati privati.",
    "Lo stato corrente viene verificato sulle pubblicazioni dei canali: assenze o cambi di formato non vengono trasformati in conclusioni biografiche."
  ], [source("CoopTV · canale YouTube", "https://www.youtube.com/@CoopTV", "official"), source("CoopTV · canale Twitch", "https://www.twitch.tv/cooptv", "official")], {
    category: "Persone e cultura", work: "Attività pubblica di CoopTV", primaryWork: "Canali ufficiali CoopTV", format: "Biografia professionale pubblica", classification: "Persona reale · creator digitale", species: "Persona reale", gender: "Identità pubblica documentata", birth: "Dato privato non necessario al dossier", age: "Non indicata senza una fonte pubblica affidabile", origin: "Italia · attività digitale pubblica", role: "Autore e volto del progetto digitale CoopTV", continuity: "Carriera pubblica documentata", continuityNote: "Persona reale, personaggi interpretati e format video restano distinti.", creator: "Dino CoopTV", firstAppearance: "Attività pubblica sui canali CoopTV", firstYear: "Periodo documentato dai canali ufficiali"
  }),
  "blur-tumblurr": entry([
    "Blur e il nome pubblico usato da Gianmarco Tocco, conosciuto online anche come Tumblurr, creator e streamer italiano.",
    "La sua attivita si sviluppa fra video, dirette e progetti di intrattenimento competitivo, con una comunita costruita su piu piattaforme.",
    "Collaborazioni, squadre e partecipazioni a eventi vengono registrate per data senza confondere il nome pubblico con opere o gruppi omonimi.",
    "La scheda segue i soli canali verificabili e la produzione pubblica corrente, escludendo dati personali non necessari."
  ], [source("Tumblurr · Twitch", "https://www.twitch.tv/tumblurr", "official"), source("Tumblurr · YouTube", "https://www.youtube.com/@Tumblurr", "official"), source("Atom Heart Magazine · profilo", "https://www.atomheartmagazine.com/gianmarco-tocco-tumblurr-blur-twitch/")]),
  "therealmarzaa": entry([
    "Marza e il nome pubblico di Francesco Marzano, creator italiano attivo fra video online e dirette streaming.",
    "Il percorso parte dalla produzione su YouTube e si amplia con contenuti dal vivo, intrattenimento e collaborazioni con altri creator.",
    "Format, gruppi e presenze in eventi sono documentati attraverso i canali ufficiali e non vengono confusi con profili omonimi.",
    "Lo stato attuale riguarda esclusivamente l'attivita pubblica verificabile; dati privati, indiscrezioni e inferenze sono esclusi."
  ], [source("Marza · Twitch", "https://www.twitch.tv/therealmarzaa", "official"), source("Marza · YouTube", "https://www.youtube.com/@TheRealMarzaa", "official")]),
  "dario-moccia": entry([
    "Dario Moccia e un autore, illustratore, divulgatore e creator italiano attivo fra cultura pop, fumetto, animazione e streaming.",
    "Dopo il lavoro video su YouTube ha sviluppato dirette e format di approfondimento, mantenendo centrale la ricerca su produzione artistica e media.",
    "Ha curato progetti editoriali e collezionabili, fra cui opere e carte realizzate con artisti e collaboratori, distinguendo sempre autore, editore e licenza.",
    "La scheda aggiorna soltanto attivita e progetti annunciati pubblicamente e non interpreta opinioni o vicende private come fatti biografici."
  ], [source("Dario Moccia · YouTube", "https://www.youtube.com/@DarioMocciaArchives", "official"), source("Dario Moccia · Twitch", "https://www.twitch.tv/dariomoccia", "official"), source("Tomodachi Press", "https://tomodachipress.it/", "official")]),
  "annabelle-conjuring": entry([
    "Annabelle e la bambola di porcellana fittizia usata come tramite da un'entita demoniaca nel ciclo cinematografico The Conjuring Universe.",
    "Le origini vengono ampliate nei film dedicati, che collocano la bambola fra la creazione del giocattolaio Mullins e i successivi proprietari.",
    "Ed e Lorraine Warren la custodiscono nella stanza degli artefatti dopo averne riconosciuto il pericolo nella continuita dei film.",
    "La bambola cinematografica non coincide con la vera Raggedy Ann associata ai Warren: ispirazione reale e finzione vengono documentate separatamente."
  ], [source("Warner Bros. · Annabelle", "https://www.warnerbros.com/movies/annabelle", "official"), wikipediaEn("Annabelle_(doll)"), wikidata("Q20981098")]),
  "mimmo-bianco-rosso-verdone": entry([
    "Mimmo e il giovane ingenuo interpretato da Carlo Verdone nel segmento romano di Bianco, rosso e Verdone.",
    "Viaggia verso il seggio elettorale con la nonna Teresa, affrontando soste e contrattempi con premura ma poca capacita di imporsi.",
    "Il rapporto con la nonna e il linguaggio dimesso distinguono Mimmo dagli altri personaggi interpretati da Verdone nello stesso film.",
    "La sua vicenda si conclude nel perimetro del film del 1981 e non viene prolungata con biografie non mostrate."
  ], [wikipediaIt("Bianco,_rosso_e_Verdone"), source("Cinematografo · Bianco rosso e Verdone", "https://www.cinematografo.it/film/bianco-rosso-e-verdone-rsi4nkm7"), wikidata("Q3638315")]),
  "aldo-giovanni-giacomo": entry([
    "Aldo Baglio, Giovanni Storti e Giacomo Poretti formano un trio comico italiano attivo fra teatro, televisione e cinema.",
    "La collaborazione si consolida negli anni Novanta con spettacoli teatrali e presenze televisive, prima del successo cinematografico di Tre uomini e una gamba.",
    "Il repertorio alterna personaggi ricorrenti, comicita fisica, dialogo e costruzione collettiva, con lavori anche individuali chiaramente attribuiti.",
    "Attivita del trio e carriere personali vengono aggiornate separatamente attraverso il sito e le comunicazioni ufficiali."
  ], [source("Aldo Giovanni e Giacomo · sito ufficiale", "https://www.aldogiovanniegiacomo.it/", "official"), wikipediaIt("Aldo,_Giovanni_e_Giacomo"), wikidata("Q3609101")], {
    category: "Persone e cultura", work: "Carriera artistica di Aldo Baglio, Giovanni Storti e Giacomo Poretti", primaryWork: "Teatro, televisione e cinema · attività pubblica documentata", format: "Biografia pubblica collettiva", classification: "Tre persone reali · trio comico", species: "Tre persone reali", gender: "Maschile · loro", birth: "Date individuali documentate nelle rispettive biografie", age: "Età individuali, non applicabile come dato unico del trio", origin: "Italia", role: "Attori, comici, autori e registi", continuity: "Carriera pubblica del trio e attività individuali attribuite separatamente", continuityNote: "Il trio reale viene distinto dai personaggi di finzione interpretati nei propri spettacoli e film.", creator: "Aldo Baglio · Giovanni Storti · Giacomo Poretti", firstAppearance: "Collaborazione teatrale e televisiva", firstYear: "Anni 1990", grammaticalNumber: "plural"
  }),
  "medioman": entry([
    "Medioman e un supereroe comico interpretato da Fabio De Luigi nei programmi della Gialappa's Band, costruito come parodia dell'eroe infallibile.",
    "Interviene in problemi quotidiani o assurdi con poteri e soluzioni volutamente mediocri, facendo del divario fra posa e risultato il centro della gag.",
    "Il personaggio appartiene ai segmenti televisivi di Mai dire... e va distinto sia dall'attore sia dagli altri ruoli comici di De Luigi.",
    "Le apparizioni vengono ordinate per programma e periodo televisivo; non viene inventata una continuita narrativa oltre gli sketch."
  ], [wikipediaIt("Mai_dire_Domenica/Luned%C3%AC/Marted%C3%AC"), source("GialappaShow · sito ufficiale TV8", "https://www.tv8.it/show/tv8-gialappashow", "official"), wikidata("Q3851996")])
};
