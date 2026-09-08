# Salto tra le nuvole — asset e implementazione

Generatore immagini integrato (non CLI), asset originali conservati. Nessuna nuvola, gemma o icona disegnata con CSS: CSS usato soltanto per layout e posizionamento dei PNG. Cartella finale: `public/famiglio/rebuild/effects/`.

## minigame-jump-bg-v1.png

Use case: stylized-concept. Genuine coarse 16-bit SNES videogame pixel art, visible square pixel clusters, limited cyan lavender peach cream palette, no smooth painting, no realism, no vector shapes, no text or watermark. Landscape 3:2 background for a side-view cloud jumping game. Dreamy bright sky at dawn above the clouds, distant floating islands at edges, tiny distant stars. Spacious quiet playable center, no foreground platforms, no characters. Fully composed image with no crop.

## minigame-jump-cloud-v1.png

Use case: stylized-concept. Genuine coarse 16-bit SNES videogame pixel art, visible square pixel clusters, limited cyan lavender peach cream palette, no smooth painting, no realism, no vector shapes, no text or watermark. One wide fluffy cloud platform sprite for a side-view platformer. Horizontal cream white top with a flat walkable ledge, cyan and lavender shaded underside. Cloud fills about 90 percent of width, walkable upper surface at 30 percent of image height. Aspect ratio 3:1, transparent background, fully visible with a little padding. Crisp low resolution pixel design.

## minigame-jump-gem-v1.png

Use case: stylized-concept. Genuine coarse 16-bit SNES videogame pixel art, visible square pixel clusters, limited cyan lavender peach cream palette, no smooth painting, no realism, no vector shapes, no text or watermark. One collectible bright turquoise faceted gem sprite, strong dark indigo pixel outline and white pixel highlights. Centered, fully visible, transparent background, simple readable 24x24 pixel sprite enlarged, no frame.

## minigame-jump-icon-v1.png

Use case: stylized-concept. Genuine coarse 16-bit SNES videogame pixel art, visible square pixel clusters, limited cyan lavender peach cream palette, no smooth painting, no realism, no vector shapes, no text or watermark. Square game selection icon: three fluffy small cloud platforms rising diagonally and one turquoise collectible gem above the highest platform. Clear side-view platform jumping concept, no character, transparent background, centered and fully visible, 48x48 pixel aesthetic enlarged.

## Gameplay e audio

Nuovo identificatore `jump`: non eredita i record di Ritmo del Legame, preserva il premio giornaliero già riscosso. Tre tentativi, 40 secondi, accelerazione 130–190 unità/s; +1 per nuova nuvola e +2 per gemma. Salto con input anticipato e tolleranza di 100 ms dopo il bordo. Test di raggiungibilità su 20 percorsi.

Musichetta chiptune originale in tonalità maggiore, sintetizzata con Web Audio, volume contenuto. Quattro altezze riconoscibili per le rune (Do, Mi, Sol, Do alto), suoni per luce, raccolte, errori e salto. Audio fermato in pausa, pagina nascosta e chiusura del gioco. Tasto audio in ogni gioco.

Acchiappa-oggetti: cacca rimossa sia dal motore sia dalla spiegazione; stelle e spine restano. La logica storica di Ritmo è conservata ma non esposta nella selezione.
