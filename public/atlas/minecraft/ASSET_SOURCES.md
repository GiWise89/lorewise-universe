# Minecraft guide asset map

Questi asset sono preparati per la futura guida Minecraft. Ogni immagine ha una destinazione editoriale distinta: non va riutilizzata in altre sezioni della stessa guida.

## Immagini ufficiali

| File | Uso previsto | Fonte ufficiale |
| --- | --- | --- |
| `official/cover-building.png` | Copertina e introduzione alla costruzione | https://www.minecraft.net/en-us/about-minecraft |
| `official/survival-night.png` | Prima notte, rifugio e creature ostili | https://www.minecraft.net/en-us/about-minecraft |
| `official/exploration-biomes.png` | Biomi, orientamento ed esplorazione | https://www.minecraft.net/en-us/about-minecraft |
| `official/mining-cavern.png` | Miniere, grotte, illuminazione e pericoli | https://www.minecraft.net/en-us/about-minecraft |
| `official/multiplayer-portal.png` | Portali, viaggio tra dimensioni e gioco condiviso | https://www.minecraft.net/en-us/about-minecraft |
| `official/redstone-pistons.jpg` | Fondamenti di Redstone e pistoni | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/redstone-crafter.jpg` | Automazione, Crafter e circuiti avanzati | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/ender-dragon-finale.jpeg` | End, cristalli e scontro con il Drago | https://www.minecraft.net/en-us/article/minecraft-1-21-pre-release-2 |
| `official/ruined-portal-bats.jpg` | Preparazione e sicurezza del portale | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/nether-blazes.jpg` | Fortezze, blaze ed esplorazione del Nether | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/village-pots.jpg` | Crafting, contenitori e organizzazione | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/trial-combat.jpg` | Combattimento e gestione dei gruppi ostili | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/trial-parkour.jpg` | Movimento, cadute e percorsi sicuri | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-3 |
| `official/armor-trims.jpg` | Equipaggiamento, forgia e finiture | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-19-4 |
| `official/sniffer-torchflowers.jpg` | Coltivazione e risorse rinnovabili | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-19-4 |
| `official/desert-village.jpg` | Villaggi, abitanti e scambi | https://www.minecraft.net/en-us/article/minecraft-java-edition-1-19-4 |

Le immagini sono state scaricate dai domini ufficiali `minecraft.net` e `images.ctfassets.net` collegati dalle pagine Minecraft. I 16 file sono tutti diversi per hash SHA-256 e assegnati a un solo capitolo. La maggior parte misura 3840 x 2160; le altre restano tra 1170 x 500 e 2958 x 1664.

## Icone degli switch

`guide-section-icons-v1.png` e una tavola originale 3 x 2 generata con ImageGen. Ordine, da sinistra a destra:

1. Sopravvivi
2. Scava e crea
3. Coltiva ed esplora
4. Potenzia l'equipaggiamento
5. Affronta le dimensioni
6. Costruisci e condividi

La tavola misura 1536 x 1024. Il fondale atmosferico fa parte dell'illustrazione: le sei celle dovranno essere ritagliate tramite `background-position` o `object-position` quando la guida verra implementata.

## Prompt ImageGen

```text
Use case: stylized-concept
Asset type: 3-by-2 sprite atlas for six website section-switch icons
Primary request: Create six original voxel-sandbox fantasy UI icons in one perfectly aligned 3-column by 2-row sheet.
Scene/backdrop: genuinely transparent background; each square cell isolated with generous transparent padding.
Subjects, reading left-to-right:
Top row: (1) first-night survival — tiny block shelter, torch, wooden sword; (2) mining and crafting — angular pickaxe, ore cube, simple crafting-grid motif; (3) farming and exploration — wheat bundle, compass, tiny block village.
Bottom row: (4) equipment and enchantment — faceted cyan armor and sword, glowing book and potion; (5) Nether and End progression — fiery rectangular portal, purple end-eye crystal and blocky dragon-wing silhouette; (6) building, redstone and multiplayer — red circuit dust, piston block and two connected construction blocks.
Style/medium: polished original 3D voxel game UI icons, crisp pixel-stepped silhouettes, subtle bevels, soft ambient occlusion, premium but readable at 72–96 px.
Composition/framing: exactly equal square cells, centered subjects, no overlaps between cells, consistent camera angle and scale.
Color palette: grass green, earth brown, stone gray, torch amber, ore cyan, redstone red, Nether orange, End purple.
Constraints: actual alpha transparency; no text; no numbers; no logos; no watermark; no official game characters; no copying official item textures pixel-for-pixel; no extra icons; exactly six icons.
Avoid: photorealism, painterly brushwork, rounded cartoon blobs, busy backgrounds, borders touching the canvas.
```

ImageGen non ha rispettato il requisito alpha e ha prodotto un fondale atmosferico opaco. Il risultato e stato mantenuto perche le sei aree risultano coerenti, distinguibili e adatte a essere usate come illustrazioni complete degli switch; non va descritto come trasparente.
