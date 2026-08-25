import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function select(items, order) {
  return order.map((index) => items[index]);
}

async function steamScreenshots(appId, count) {
  const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=it&l=italian`);
  if (!response.ok) throw new Error(`Steam ${appId}: HTTP ${response.status}`);
  const payload = await response.json();
  return payload[String(appId)].data.screenshots.slice(0, count).map((shot) => shot.path_full);
}

const hogwarts = [
  ...Array.from({ length: 14 }, (_, index) => `https://cdn-hogwartslegacy.warnerbrosgames.com/media/screen-${String(index + 1).padStart(2, "0")}.jpg`),
  "https://cdn-hogwartslegacy.warnerbrosgames.com/media/hogwarts-legacy-wallpaper.jpg",
  "https://cdn-hogwartslegacy.warnerbrosgames.com/media/gameplay-showcase-i-t.jpg",
];

const zeldaStore = ["05b3d8e8c74beaa43a7714c275a7ad06018ed069bd6bd3f923442b9ac16fdc49","1c786a296ab9c1f28ff509723f621311b7525d0c773ae314622b02c03bf27b5b","490ccb15d914eabada74b34de895e9061c7917d7f75782bc934a528fb77ea4be","54e87e1c41d21f32e74c61ad9c18c0a2688800e939d9d5ab97182304b9c37591","ca80e4d9f7ddc2971daea8d9b9144c42dbdf2245c3546f41b94a740067bd42a0","ec907a9568fb27177faf87288e98cee15f4fc4f0ff575ab39b150b3c6efe0350","fb30eab428df3fc993b41c76e20f72e4d76d49734d17d31996b5ab61c414b117"].map((hash) => `https://assets.nintendo.com/image/upload/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000063714/${hash}`);
const zeldaCreate = `https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/Microsites/zelda-tears-of-the-kingdom/pmp/microsite_features_create`;
const zeldaDiscover = `https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/Microsites/zelda-tears-of-the-kingdom/pmp/microsite_features_discover`;
const zeldaExplore = `https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/Microsites/zelda-tears-of-the-kingdom/pmp/microsite_features_explore`;
// Ordine editoriale: versioni, isola, Ultramano, Compositor, Ascensus/Reverto,
// combattimento, archi, tre livelli, torri, santuari, congegni, cucina,
// armature, veicoli, fenomeni regionali, finale.
const zelda = [zeldaStore[0], zeldaStore[4], zeldaCreate, zeldaStore[3], zeldaStore[3], zeldaStore[2], zeldaStore[2], zeldaExplore, zeldaStore[0], zeldaStore[1], zeldaCreate, zeldaDiscover, zeldaStore[2], zeldaStore[5], zeldaStore[1], zeldaStore[0]];

// Retained as a verified official-source fallback if Steam screenshots become unavailable.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _sims = [
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/brand-refresh-assets/images/2019/07/ts4-hero-media-new-page-7x2-xl.jpg.adapt.crop7x2.1920w.jpg",
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/gp10/videos/2021/05/1359b148-8bbd-ab6e-94d1-8eed346972d1.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/gp10/videos/2021/05/4126f66b-e303-5ce2-5340-c9271851b02a.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
  ...["4d01dc66-0af6-3db8-7925-4fd9c04a49a9","77b3440f-8e9c-0d47-7262-299746eabef9","a83800a0-59a4-3e7d-ff11-ac8c5c701059","cc27458f-2b9e-529e-aa2f-342760259419","dd1b4ce4-3b59-4383-db22-d37ffbdb7886","9d8b1174-6948-7db1-db08-be0ba1401413","bb14084a-c2e2-edb4-816b-798a1dfda463","c387fcb8-8ef0-8020-e5ac-08e86b2dab66"].map((id) => `https://media.contentapi.ea.com/content/dam/eacom/SIMS/PC/videos/${id === "9d8b1174-6948-7db1-db08-be0ba1401413" ? "2019/02" : id === "bb14084a-c2e2-edb4-816b-798a1dfda463" ? "2019/03" : id === "c387fcb8-8ef0-8020-e5ac-08e86b2dab66" ? "2019/06" : id === "4d01dc66-0af6-3db8-7925-4fd9c04a49a9" ? "2018/11" : "2019/01"}/${id}.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg`),
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/the-sims-4-cottage-living/videos/2021/06/32e13a98-f78a-3590-f0de-694a911f97c3.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/the-sims-4-cottage-living/videos/2021/06/a33ac2d4-922a-a6e8-2d71-0d97425da5f1.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/the-sims-4-discover-university/videos/2019/10/b970e53a-d79b-8e3e-c889-accb3fc44ad2.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/the-sims-4-eco-living/videos/2020/05/60ae401d-26f6-b632-84a6-df778c4327c0.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
  "https://media.contentapi.ea.com/content/dam/eacom/SIMS/the-sims-4-high-school-years/videos/2022/06/e72b0574-7d74-5aa1-f2f1-be115bf56c1a.youtube/subassets/poster.jpg.adapt.crop16x9.431p.jpg",
];

const rdrPlayStation = ["FREE_CONTENT2xdDEeTPXhKgM3mqi53l/PREVIEW_SCREENSHOT1_166081.jpg","FREE_CONTENToZlCoShC2j15o82YyWYd/PREVIEW_SCREENSHOT2_166081.jpg","FREE_CONTENTPkRWha1p8XekBjvSs2jd/PREVIEW_SCREENSHOT3_166081.jpg","FREE_CONTENTxyyRex1B6WQIughYFrcQ/PREVIEW_SCREENSHOT4_166081.jpg","FREE_CONTENTNUnS6JI3rQg5ELQyhpej/PREVIEW_SCREENSHOT5_166081.jpg","FREE_CONTENT6360cGXTPL8vg7J1iBU1/PREVIEW_SCREENSHOT6_166081.jpg","FREE_CONTENT66dehxycKqgS4Mhiabti/PREVIEW_SCREENSHOT7_166081.jpg","FREE_CONTENTHGtjr9cnSmOKjo4nN4EF/PREVIEW_SCREENSHOT8_166081.jpg","FREE_CONTENTxMGjvWfhU2fx4VJIgUP1/PREVIEW_SCREENSHOT9_166081.jpg","FREE_CONTENTvJKvL7yfxIr782YEPFC1/PREVIEW_SCREENSHOT10_166081.jpg"].map((item) => `https://image.api.playstation.com/cdn/UP1004/CUSA03041_00/${item}`);

// Retained as verified official-source fallbacks if Steam screenshots become unavailable.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _monsterCapcom = ["news_25_02_27_NOWSpv-story.jpg","news_25_03_31_0_dr.jpg","news_25_04_02_arena_quests.jpg","news_25_04_03_update_information.jpg","news_25_06_27_Spotlight.jpg","news_25_09_24_tu3.jpg"].map((name) => `https://www.monsterhunter.com/wilds/assets/img/news/${name}`);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _diabloBlizzard = [
  "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0bb40718dbb3974d/68e42bb9acfe3159a54e3730/d4-npe_story-launch-trailer_enus_960.webp?format=webp",
  "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt35cd6a15cfcf2d36/68f69edca1fb43c1c0082513/d4-npe_expansive-open-world_960.webp?format=webp",
  "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt35f620a8f3d7f48b/68f69f0aa1fb435dfb082519/d4-npe_legendary-gear_960.webp?format=webp",
  "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt53584f9bb87a6a9c/69376f0a627d4425415eb5f1/DIA_DIV_X2_paladin_class_trailer_thumbnail_1920x1080_LL02.png?format=webp",
  "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt569aca7e8c1261b5/68e6e4e4a36ff6516e32ba31/d4-npe_developer-showcase-trailer_enus_1920.webp?format=webp",
  "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt6f534533dea05f2e/693734d62575e191eb416271/DIA_DIV_X2_cinematic_trailer_thumbnail_1920x1080_LL01.png?format=webp",
];

const pokopiaStore = ["2045c3f67f865d333b1995562ad6b2894473b8a869e4c8efa01572539ec86019","3265e8eea231c87a7c9ff87890c235d25f7f21079fab68f3761dbd0bba922b04","5ceb12f1763cc8525f4a9092b4e0736287adbf65431934140ba579dbfec26c44","6c8214bd886f2c4c04e511a30a6627c7dc2f4934398707bfd497f61c51d5559c","ba24cf48fef976afa00230c5005f526c0dc5acaac260c99d378bd7d4d806e68f","ccb2d70f7ad6878b78d366898a0f0baf94a2d3350b76725c88b591453a797502","ccd630dbe73fa9c7c5c1ed471c4e81eda6f4ee4515d3f1a2f88514635941a8b2"].map((hash) => `https://assets.nintendo.com/image/upload/q_auto:best/f_auto/dpr_2.0/store/software/switch2/70010000107421/${hash}`);
const pokopia = [...pokopiaStore, ...["Switch2_PP_PMP_ALittleHelp_H264_V1-fallback","Switch2_PP_PMP_CraftObjects_H264_V1-fallback","Switch2_PP_PMP_GrowCrops_H264_V1-fallback","Switch2_PP_PMP_MakeComfySpaces_H264_V1-fallback"].map((name) => `https://assets.nintendo.com/image/upload/f_auto,q_auto/Marketing/pmp_pokopia/gameplay-craft/${name}`), "https://assets.nintendo.com/image/upload/f_auto,q_auto/Marketing/pmp_pokopia/story/screenshot-story-1-2x", "https://assets.nintendo.com/image/upload/f_auto,q_auto/Marketing/pmp_pokopia/story/screenshot-story-2-2x", "https://assets.nintendo.com/image/upload/f_auto,q_auto/Marketing/pmp_pokopia/dlc/dlc-bubbly-basin-pokemon-2x", "https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.5/ncom/en_US/articles/2025/catch-a-cozy-new-video-about-pokemon-pokopia/2250x1266_Pokemon_Pokopia_Key_Visual-_3_1", "https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.5/ncom/en_US/articles/2026/heres-how-to-prepare-for-the-new-pokemon-pokopia-content-coming-aug-5/2250x1266_PokopiaTips_EN"];

async function downloadImage(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function installGuide(slug, urls, background) {
  if (urls.length < 16) throw new Error(`${slug}: servono 16 immagini, trovate ${urls.length}`);
  const dataPath = path.join(root, "data", `${slug}-guide.json`);
  const guide = JSON.parse(await readFile(dataPath, "utf8"));
  const chapterRoot = path.join(root, "public", "atlas", slug, "chapters");
  await mkdir(chapterRoot, { recursive: true });
  const converted = [];
  for (let index = 0; index < 16; index += 1) {
    const input = await downloadImage(urls[index]);
    const output = await sharp(input).resize(1600, 900, { fit: "contain", background }).webp({ quality: 86, effort: 5 }).toBuffer();
    const filename = `${String(index + 1).padStart(2, "0")}-${guide.chapters[index].id}.webp`;
    await writeFile(path.join(chapterRoot, filename), output);
    guide.chapters[index].images[0].alt = `Immagine ufficiale di ${guide.game} associata al capitolo ${guide.chapters[index].label}`;
    guide.chapters[index].images[0].caption = `${guide.chapters[index].label} · immagine dal sito ufficiale, mostrata integralmente`;
    guide.chapters[index].images[0].sourceUrl = urls[index];
    converted.push(output);
  }
  await writeFile(path.join(root, "public", "atlas", slug, "cover.webp"), converted[0]);
  guide.cover.alt = `Immagine ufficiale usata per la copertina editoriale di ${guide.game}`;
  guide.cover.caption = `${guide.game} · immagine dal sito ufficiale, mostrata integralmente`;
  guide.cover.sourceUrl = urls[0];
  await writeFile(dataPath, `${JSON.stringify(guide, null, 2)}\n`, "utf8");
  console.log(`${guide.game}: 16 immagini da siti ufficiali scaricate e ottimizzate.`);
}

const simsGameplay = await steamScreenshots(1222670, 16);
const rdrPool = [...rdrPlayStation, ...(await steamScreenshots(1174180, 5))];
const monsterGameplay = await steamScreenshots(2246340, 10);
const diabloGameplay = await steamScreenshots(2344520, 10);

// Ogni permutazione segue esattamente l'argomento dei sedici capitoli.
const curatedHogwarts = select(hogwarts, [15, 1, 8, 4, 9, 12, 3, 6, 7, 0, 5, 14, 11, 2, 10, 13]);
const curatedSims = select(simsGameplay, [0, 2, 2, 1, 0, 0, 2, 0, 3, 3, 0, 1, 3, 2, 0, 0]);
const rdr = select(rdrPool, [14, 1, 2, 9, 4, 3, 10, 7, 8, 10, 0, 6, 12, 13, 5, 14]);
const monster = select(monsterGameplay, [2, 7, 6, 1, 4, 0, 8, 9, 2, 1, 7, 6, 8, 5, 3, 0]);
const diablo = select(diabloGameplay, [8, 1, 2, 7, 4, 5, 6, 9, 8, 9, 3, 2, 7, 0, 4, 0]);
const curatedPokopia = select(pokopia, [0, 1, 11, 3, 4, 6, 9, 7, 8, 12, 2, 10, 1, 2, 0, 12]);

await installGuide("hogwarts-legacy", curatedHogwarts, "#08101d");
await installGuide("zelda-tears-of-the-kingdom", zelda, "#0b2430");
await installGuide("the-sims-4", curatedSims, "#092738");
await installGuide("red-dead-redemption-2", rdr, "#160d0b");
await installGuide("monster-hunter-wilds", monster, "#0b1b19");
await installGuide("diablo-iv", diablo, "#10090b");
await installGuide("pokemon-pokopia", curatedPokopia, "#0d2c37");
