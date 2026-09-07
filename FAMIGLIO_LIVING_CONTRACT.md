# Contratto dei Famigli vivi

Ogni Famiglio inserito nel Nexus deve sembrare vivo anche quando il giocatore non impartisce comandi.

## Comportamento obbligatorio

- Cammina soltanto mentre cambia realmente posizione; una volta arrivato passa subito a una posa ferma.
- Alterna autonomamente esplorazione, osservazione, seduta, pulizia personale e riposo.
- Le scelte autonome tengono conto dei bisogni: poca energia favorisce il riposo, poca igiene favorisce la pulizia.
- Non ripete sempre la stessa azione e conserva la propria posizione tra un comportamento e il successivo.
- Il riposo autonomo usa una posa calma senza `Z`; le `Z` appartengono soltanto al comando esplicito `Fai riposare`.
- Un comando del giocatore interrompe immediatamente il comportamento autonomo e ha sempre la precedenza.
- Oggetti e bersagli sono fissi nella stanza: è il Famiglio a raggiungerli.
- Fame, noia e bisogno d'affetto portano il Famiglio verso il relativo punto della stanza e mostrano un segnale pixel-art discreto; stanchezza e scarsa igiene producono riposo calmo e pulizia personale.
- Velocità, frequenza di esplorazione, durata delle soste e comportamento preferito dipendono dalla specie: gli otto Famigli iniziali non condividono una personalità generica.
- L'autonomia esprime un bisogno ma non lo soddisfa da sola: le statistiche cambiano soltanto per il tempo o per un'azione consapevole del giocatore.

## Contratto grafico obbligatorio

Prima di aggiungere una nuova specie devono essere verificati sprite coerenti per: `idle`, `walk`, `sit`, `groom`, `sleep` e per tutte le azioni interattive supportate. Identità, palette, accessori, scala e direzione artistica non possono cambiare fra le sequenze.

- `walk` deve mostrare un ciclo laterale 2D completo di almeno quattro fotogrammi distinti. Il verso sinistro nasce dal ribaltamento dello stesso ciclo destro, senza cambiare identità o proporzioni.
- Lo spostamento avviene soltanto mentre il ciclo di cammino è attivo: non sono ammessi scivolamento, pattinata o traslazione in posa ferma.
- `sit`, `groom`, `feed`, `play`, `clean`, `care`, `sleep` e `sleep-calm` devono avere pose realmente disegnate per l'azione; sono vietate rotazioni o deformazioni automatiche della posa ferma.
- Tutti i fotogrammi poggiano sulla stessa linea del pavimento. Nessuna zampa, testa, coda, ala o altra parte del corpo può toccare o oltrepassare il bordo del fotogramma.
- La scala è definita per specie e deve rispettare proporzioni naturali relative: un animale grande non può apparire più piccolo di una specie minuta senza una ragione narrativa esplicita.
- Ciotola, gioco, prodotto di cura e lettino hanno punti d'interazione fissi. Il Famiglio cammina fino al punto prima di eseguire l'azione.
- L'oggetto standard illustrato nei fotogrammi e l'eventuale oggetto speciale del mercato sono alternative: non vengono mai disegnati insieme.
- In scena può comparire una sola istanza dell'oggetto usato: mai due ciotole, due palle o altri duplicati.
- Gli atlanti del Famiglio restano privi di ciotole, palle e strumenti: l'unico oggetto interattivo viene disegnato separatamente, rimane nello stesso punto per tutta l'azione e non può lampeggiare o sparire tra due fotogrammi.
- Gli oggetti interattivi sono disegnati davanti al Famiglio. Il lettino è l'unica eccezione di profondità: viene disegnato dietro e il Famiglio riposa coricato e centrato al suo interno.
- La linea anatomica delle zampe coincide con la linea di appoggio della stanza e conserva un margine trasparente nel fotogramma: nessun corpo può apparire interrato nel pavimento.
- Ogni Famiglio possiede una sola identità grafica canonica: fermo, camminata, azioni, anteprima del mercato, scheda informativa e bundle derivano tutti dallo stesso atlante rifinito. Non è ammesso alternare sprite legacy e sprite rifiniti dello stesso animale.
- Il contenuto della ciotola comincia a consumarsi soltanto quando il Famiglio ha concluso l'avvicinamento e ha iniziato davvero a mangiare.
- Durante il sonno il centro visibile del corpo coincide con il centro interno del lettino, indipendentemente dalle dimensioni o dalla postura della specie.
- Ogni fotogramma finale deve avere alfa netta e nessun componente isolato minuscolo: aloni, quadretti, punti chiari o residui del fondale di generazione non sono ammessi, senza eliminare ali, code, zampe o altri elementi anatomici reali.
- Ogni atlante deve superare il controllo automatico di bordi, base a terra, fotogrammi distinti e riuso di sequenze, seguito da controllo visivo desktop e mobile.

Le animazioni sono eseguite nel Canvas; non sono ammesse animazioni CSS per il Famiglio.

## Contratto Tamagotchi

- I cinque bisogni continuano a cambiare con il tempo, anche tra una visita e la successiva, entro un limite sicuro di ventiquattro ore.
- Umore e comportamento autonomo derivano dai bisogni reali: fame, stanchezza e scarsa igiene hanno conseguenze visibili.
- Ogni giorno propone una routine composta dalle cinque cure fondamentali, senza obbligare a ripetere clic inutili.
- Le cure assegnano esperienza di legame; la crescita passa da Cucciolo a Giovane e Adulto senza sostituire il disegno del Famiglio, variando soltanto la scala.
- Azioni inadatte hanno conseguenze coerenti: nutrire un Famiglio già sazio o forzarlo a giocare quando è sfinito produce un beneficio ridotto e una reazione esplicita.
- Bisogni, stanza, esperienza, stadio, routine e ultimo esito vengono salvati insieme all'identità già scelta; i vecchi salvataggi vengono migrati senza perdere il Famiglio.
