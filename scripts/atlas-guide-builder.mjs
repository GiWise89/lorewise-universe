import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const positions = ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%"];

function split(value) {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function scenarios(value) {
  return split(value).map((item) => {
    const [problem, answer] = item.split("=>").map((part) => part.trim());
    return { problem, answer };
  });
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function wrappedLines(value, max = 28) {
  const words = value.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function chapterSvg(guide, chapter, index) {
  const lines = wrappedLines(chapter[2]);
  const title = lines.map((line, lineIndex) => `<text x="120" y="${390 + lineIndex * 86}" fill="#fff8e8" font-family="Georgia, serif" font-size="68" font-weight="700">${escapeXml(line)}</text>`).join("");
  const rings = Array.from({ length: 7 }, (_, ringIndex) => `<circle cx="${1260 + (ringIndex % 2) * 70}" cy="${180 + ringIndex * 95}" r="${48 + ringIndex * 8}" fill="none" stroke="${guide.palette.accent}" stroke-opacity="${0.12 + ringIndex * 0.035}" stroke-width="3"/>`).join("");
  return `<svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${guide.palette.dark}"/><stop offset=".58" stop-color="${guide.palette.mid}"/><stop offset="1" stop-color="${guide.palette.deep}"/></linearGradient><pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="#fff" stroke-opacity=".045"/></pattern></defs><rect width="1600" height="900" fill="url(#bg)"/><rect width="1600" height="900" fill="url(#grid)"/>${rings}<path d="M105 160H1040" stroke="${guide.palette.accent}" stroke-width="4"/><text x="120" y="125" fill="${guide.palette.accent}" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="7">LOREWISE UNIVERSE · ATLANTE DEI GIOCHI</text><text x="120" y="255" fill="#fff" fill-opacity=".68" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="4">CAPITOLO ${String(index + 1).padStart(2, "0")} · ${escapeXml(chapter[1].toUpperCase())}</text>${title}<circle cx="1330" cy="450" r="155" fill="${guide.palette.accent}" fill-opacity=".12" stroke="${guide.palette.accent}" stroke-width="5"/><text x="1330" y="485" text-anchor="middle" fill="${guide.palette.accent}" font-family="Georgia, serif" font-size="112" font-weight="700">${String(index + 1).padStart(2, "0")}</text><text x="120" y="825" fill="#fff" fill-opacity=".58" font-family="Arial, sans-serif" font-size="24">${escapeXml(guide.game)} · guida editoriale indipendente</text></svg>`;
}

function coverSvg(guide) {
  const lines = wrappedLines(guide.title, 24);
  const title = lines.map((line, index) => `<text x="120" y="${360 + index * 92}" fill="#fff8e8" font-family="Georgia, serif" font-size="78" font-weight="700">${escapeXml(line)}</text>`).join("");
  return `<svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="halo"><stop stop-color="${guide.palette.accent}" stop-opacity=".6"/><stop offset="1" stop-color="${guide.palette.accent}" stop-opacity="0"/></radialGradient><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${guide.palette.dark}"/><stop offset=".55" stop-color="${guide.palette.mid}"/><stop offset="1" stop-color="${guide.palette.deep}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#bg)"/><circle cx="1260" cy="430" r="430" fill="url(#halo)"/><path d="M1040 120l300 180-80 350-360 90-170-310z" fill="none" stroke="${guide.palette.accent}" stroke-opacity=".48" stroke-width="7"/><path d="M1110 210l170 105-50 205-210 55-95-180z" fill="${guide.palette.accent}" fill-opacity=".1" stroke="${guide.palette.accent}" stroke-width="3"/><text x="120" y="130" fill="${guide.palette.accent}" font-family="Arial, sans-serif" font-size="26" font-weight="900" letter-spacing="8">LOREWISE UNIVERSE · GUIDA PREMIUM</text><text x="120" y="245" fill="#fff" fill-opacity=".72" font-family="Arial, sans-serif" font-size="31" font-weight="700">${escapeXml(guide.game)}</text>${title}<text x="120" y="790" fill="#fff" fill-opacity=".68" font-family="Arial, sans-serif" font-size="25">16 capitoli · 48 schede operative · spoiler separati</text><rect x="120" y="820" width="520" height="5" fill="${guide.palette.accent}"/></svg>`;
}

function spriteSvg(guide) {
  return `<svg width="1320" height="880" xmlns="http://www.w3.org/2000/svg">${guide.sections.map((section, index) => {
    const x = (index % 3) * 440;
    const y = Math.floor(index / 3) * 440;
    const initials = section[1].split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
    return `<g transform="translate(${x} ${y})"><rect width="440" height="440" fill="${index % 2 ? guide.palette.mid : guide.palette.dark}"/><circle cx="220" cy="195" r="122" fill="${guide.palette.accent}" fill-opacity=".13" stroke="${guide.palette.accent}" stroke-width="7"/><path d="M95 330H345" stroke="${guide.palette.accent}" stroke-width="4"/><text x="220" y="232" text-anchor="middle" fill="${guide.palette.accent}" font-family="Georgia, serif" font-size="98" font-weight="700">${escapeXml(initials)}</text><text x="220" y="378" text-anchor="middle" fill="#fff8e8" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapeXml(section[1].toUpperCase())}</text></g>`;
  }).join("")}</svg>`;
}

function makeChapter(guide, chapter, index) {
  const [id, label, title, introduction, stepString, tipString, scenarioString, spoiler = "No spoiler"] = chapter;
  return {
    id,
    number: String(index + 1).padStart(2, "0"),
    label,
    estimatedRead: "13–17 min",
    spoiler,
    title,
    introduction,
    images: [{
      src: `/atlas/${guide.slug}/chapters/${String(index + 1).padStart(2, "0")}-${id}.webp`,
      alt: `Tavola editoriale LoreWise dedicata a ${label.toLowerCase()} in ${guide.game}`,
      caption: `${label} · procedura, decisioni e diagnosi senza tagliare l’immagine`,
    }],
    blocks: [
      { label: "Percorso", title: "Procedura consigliata", text: `Affronta ${label.toLowerCase()} come una sequenza verificabile: prepara le risorse, prova una scelta alla volta e conserva un punto di ritorno.`, steps: split(stepString) },
      { label: "Metodo", title: "Decisioni che fanno la differenza", text: `Questi controlli mantengono leggibile il capitolo “${title}” anche quando il gioco offre molte possibilità contemporaneamente.`, tips: split(tipString) },
      { label: "Diagnosi", title: "Se qualcosa non funziona", text: "Individua il problema osservabile prima di cambiare difficoltà, configurazione o obiettivo.", scenarios: scenarios(scenarioString), warning: "Le indicazioni variabili vanno confrontate con la versione e la piattaforma dichiarate nelle fonti della guida." },
    ],
  };
}

function makeGuide(guide) {
  const chapters = guide.chapters.map((chapter, index) => makeChapter(guide, chapter, index));
  return {
    id: `${guide.slug}-complete-guide-01`,
    slug: guide.slug,
    code: guide.code,
    game: guide.game,
    title: guide.title,
    subtitle: guide.subtitle,
    description: `Sedici capitoli e quarantotto schede operative dedicate a ${guide.game}: ${guide.description}. La guida privilegia procedure verificabili, accessibilità, spoiler separati e scelte sostenibili.`,
    versionLabel: guide.versionLabel,
    updatedAt: "24 agosto 2026",
    vipFrom: guide.vipFrom,
    publicAt: guide.publicAt,
    theme: "atlas",
    cover: { src: `/atlas/${guide.slug}/cover.webp`, alt: `Copertina editoriale LoreWise della guida di ${guide.game}`, caption: `${guide.game} · quaderno operativo dell’Atlante dei Giochi` },
    storeUrl: guide.storeUrl,
    storeLabel: guide.storeLabel,
    ...(guide.living ? { livingGuide: guide.living } : {}),
    chapters,
      sections: guide.sections.map((section, index) => ({
        id: section[0], label: section[1], summary: section[2],
        icon: chapters.find((chapter) => chapter.id === section[3][0])?.images[0] ?? chapters[index].images[0],
        generatedIcon: {
          src: `/atlas/${guide.slug}/section-icons-imagegen-v1/${String(index + 1).padStart(2, "0")}-${section[0]}.webp`,
          alt: `Icona originale della sezione ${section[1]}`,
          caption: `${section[1]} · icona tematica generata con ImageGen`,
        },
        iconSprite: { src: `/atlas/${guide.slug}/guide-section-icons-v1.webp`, position: positions[index] },
      chapterIds: section[3],
    })),
    sources: guide.sources.map(([label, href]) => ({ label, href })),
  };
}

export async function buildAtlasGuides(guides) {
  for (const guide of guides) {
    const built = makeGuide(guide);
    const dataPath = path.join(root, "data", `${guide.slug}-guide.json`);
    let existing = null;
    try { existing = JSON.parse(await readFile(dataPath, "utf8")); } catch {}
    const hasOfficialImages = Boolean(existing?.chapters?.length === 16 && existing.chapters.every((chapter) => chapter.images?.[0]?.sourceUrl));
    if (hasOfficialImages) {
      built.cover = existing.cover;
      built.chapters = built.chapters.map((chapter, index) => ({ ...chapter, images: existing.chapters[index].images }));
    }
    const assetRoot = path.join(root, "public", "atlas", guide.slug);
    const chapterRoot = path.join(assetRoot, "chapters");
    await mkdir(chapterRoot, { recursive: true });
    if (!hasOfficialImages) {
      await sharp(Buffer.from(coverSvg(guide))).webp({ quality: 88, effort: 5 }).toFile(path.join(assetRoot, "cover.webp"));
      await sharp(Buffer.from(spriteSvg(guide))).webp({ quality: 88, effort: 5 }).toFile(path.join(assetRoot, "guide-section-icons-v1.webp"));
      for (let index = 0; index < guide.chapters.length; index += 1) {
        const chapter = guide.chapters[index];
        await sharp(Buffer.from(chapterSvg(guide, chapter, index))).webp({ quality: 86, effort: 5 }).toFile(path.join(chapterRoot, `${String(index + 1).padStart(2, "0")}-${chapter[0]}.webp`));
      }
    }
    await writeFile(dataPath, `${JSON.stringify(built, null, 2)}\n`, "utf8");
    console.log(`${guide.game}: 16 capitoli, 48 schede e ${hasOfficialImages ? "risorse ufficiali preservate" : "18 risorse WebP generate"}.`);
  }
}
