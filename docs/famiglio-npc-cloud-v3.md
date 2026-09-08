# NPC distinti e nuvole — anteprima locale

## Campagna

20 identità grafiche distinte, una per livello. Nessuna rotazione cromatica.
Sorgente: `tamagochi asset/Fantasy RPG monster pack (by Franuka).zip`, la stessa famiglia grafica degli asset dei famigli.

1. Grin: Goblin
2. Murka: Lizardfolk
3. Skarn: Skeleton
4. Vorga: Orc
5. Kaien: Ronin
6. Rei: Samurai
7. Jinra: Tengu
8. Shirok: Oni
9. Elyra: Dryad
10. Maled: Wizard
11. Sivra: Medusa
12. Orun: Paladin
13. Draeven: AnubisWarrior
14. Khar: Ogre
15. Vael: Efreet
16. Mordrek: DeathKnight
17. Nhal: Vampire
18. Sevrath: Lich
19. Azrakar: Demon
20. Morvane: Planetar

Gli atlas nuovi sono in `public/famiglio/rebuild/combat/campaign/npcs/distinct-v3/`, manifest incluso. Sei sequenze per personaggio, otto frame temporali per sequenza. Le sequenze ricompongono animazioni originali (idle, attacco, cammino/volo, colpo, morte), non sono sei gesti disegnati ex novo. Cheer/victory combinano i frame disponibili; la sconfitta si ferma sull'ultimo frame. Le quattro righe nei sorgenti indicano DIREZIONI, non emozioni: viene utilizzata la direzione frontale. Scala intera, bounding box comune a tutte le azioni, nessun taglio di pixel opachi.

Pagina locale: `/famiglio/anteprima-npc`, non disponibile in produzione. Mostra tutti i 20 personaggi e permette di scegliere una sequenza comune. Le immagini precedenti sono conservate.

## Nuvole

Sei sprite cloud originali dal pacchetto GandalfHardcore già disponibile in `Documents/asset game`. Nuvole da 150 a 260 unità, mobili, fragili dopo 900 ms di contatto, percorso alto facoltativo con gemme +4. Tengu/Jinra ogni sette piattaforme, preavviso di 1100 ms, contatto costa una vita, protezione di 1800 ms e nessuna penalità ripetuta dallo stesso ostacolo. Sempre tre vite e nessun timer finale.

La geometria è testata separatamente dai pericoli: il pilota automatico dei test non sa scegliere quando evitare un nemico o una piattaforma fragile. Test dedicati verificano questi pericoli. Nessuna prova visiva su dispositivo reale dichiarata.

## Tentativi ImageGen non integrati

Usato il generatore immagini integrato, non CLI. Due risultati per Grin conservavano uno sfondo opaco, quindi non sono stati collegati al gioco. Le bozze sono in `output/imagegen/campaign-npc-drafts/`. Non sono presentate come asset finali trasparenti.

Prompt 1: Production game sprite sheet for Nexus Pet. One tiny green goblin scavenger with large pointed ears, brown hood, patched dark teal tunic and satchel. Chunky 16-bit pixel art, 32x40-pixel-style chibi, 16 colors, square pixels, readable eyes, no smooth or painted rendering. Transparent PNG, 4 columns x 6 rows with fixed cell layout, full body and common baseline. Four articulated frames per row: idle blinking/breathing; command pointing; cheer raising arms; anger clenching fist; victory smiling arms overhead; defeat kneeling head down. No grid, text, overlaps, cutoffs or changing costume.

Prompt 2: Edit only the background of that 4x6 atlas. Remove every brown/green background, glow and shadow; use real transparent alpha. Preserve all 24 goblins, outlines, skin, costume, anatomy, positions and dimensions. No crop, halo, ground shadow or painted checkerboard.

La decisione di usare gli asset originali invece delle bozze è stata comunicata durante il lavoro. Nessuna pubblicazione effettuata.

Verifica finale: 431 test Famigli superati; TypeScript senza errori; HTTP 200 per la pagina anteprima NPC e la Casa con minigiochi. Controllata la tavola dei 20 sprite. Non eseguita una verifica interattiva mobile/browser.
