import { strToU8, zipSync } from "fflate";
import { VIP_DOWNLOAD_LIBRARY } from "../data/vip-downloads.ts";
import { getVipDownload, type VipMediaId } from "./vipZone.ts";

export type VipDownloadSource = { mediaId: VipMediaId; archiveName: string };
export type VipDownloadPackage = {
  id: string;
  title: string;
  edition: string;
  version: string;
  downloadName: string;
  description: string;
  sources: readonly VipDownloadSource[];
};

const items = VIP_DOWNLOAD_LIBRARY.collections.flatMap((collection) => collection.items.map((item) => ({ collection, item })));
const sourceFor = (item: (typeof items)[number]["item"]) => {
  const media = getVipDownload(item.downloadAsset);
  if (!media) throw new Error(`Il file VIP ${item.downloadAsset} non e autorizzato al download.`);
  return { mediaId: item.downloadAsset as VipMediaId, archiveName: media.downloadName };
};

const individualPackages = Object.fromEntries(items.map(({ collection, item }) => [item.packageId, {
  id: item.packageId,
  title: item.title,
  edition: collection.subtitle,
  version: "1.0.0",
  downloadName: `lorewise-vip-${item.packageId}.zip`,
  description: `${item.title} in alta definizione con documentazione e verifica d'integrita.`,
  sources: [sourceFor(item)],
} satisfies VipDownloadPackage]));

const collectionPackages = Object.fromEntries(VIP_DOWNLOAD_LIBRARY.collections.map((collection) => [collection.bundle.packageId, {
  id: collection.bundle.packageId,
  title: `${collection.title} - raccolta completa`,
  edition: collection.subtitle,
  version: "1.0.0",
  downloadName: `lorewise-vip-${collection.id}-raccolta-completa.zip`,
  description: `${collection.items.length} sfondi originali in alta definizione con documentazione e verifica d'integrita.`,
  sources: collection.items.map(sourceFor),
} satisfies VipDownloadPackage]));

export const VIP_DOWNLOAD_PACKAGES = {
  ...individualPackages,
  ...collectionPackages,
} as const;

export function getVipDownloadPackage(id: string | null | undefined): VipDownloadPackage | null {
  return id && id in VIP_DOWNLOAD_PACKAGES ? VIP_DOWNLOAD_PACKAGES[id as keyof typeof VIP_DOWNLOAD_PACKAGES] : null;
}

function readmeFor(downloadPackage: VipDownloadPackage) {
  const listedFiles = downloadPackage.sources.map((source) => `- ${source.archiveName}`).join("\n");
  return `LOREWISE VIP — ${downloadPackage.title}\n\nEdizione: ${downloadPackage.edition}\nVersione pacchetto: ${downloadPackage.version}\n\nCONTENUTO\n${listedFiles}\n- CONDIZIONI-USO-PERSONALE.txt\n- MANIFEST-SHA256.json\n\nQuesto pacchetto è stato preparato automaticamente dall'archivio privato LoreWise dopo la verifica di un Universe Pass attivo.\n\nPer controllare l'integrità dei file puoi confrontare le impronte SHA-256 con quelle presenti nel manifesto.\n\n© GiWise Studio — LoreWise Universe\n`;
}

const personalUseTerms = `CONDIZIONI D'USO PERSONALE — LOREWISE VIP\n\nI file inclusi sono opere originali GiWise Studio e restano protetti dal diritto d'autore.\n\nÈ consentito:\n- usare gli sfondi sui propri dispositivi personali;\n- conservare una copia privata di sicurezza.\n\nNon è consentito:\n- vendere, regalare o redistribuire i file;\n- pubblicare o caricare i file originali su siti, social, archivi o servizi di condivisione;\n- modificare i file per rivenderli o presentarli come propri;\n- usare i file per prodotti, pubblicità o altre attività commerciali senza autorizzazione scritta.\n\nL'accesso tramite Universe Pass non trasferisce la proprietà dell'opera né i diritti di sfruttamento commerciale.\n\n© GiWise Studio — LoreWise Universe\n`;

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function createVipDownloadArchive(downloadPackage: VipDownloadPackage, sourceFiles: ReadonlyMap<string, Uint8Array>) {
  const entries: Record<string, Uint8Array> = {};
  const files: Array<{ name: string; mediaId: string; bytes: number; sha256: string }> = [];
  for (const source of downloadPackage.sources) {
    const bytes = sourceFiles.get(source.mediaId);
    if (!bytes) throw new Error(`Manca il file VIP richiesto: ${source.mediaId}.`);
    entries[source.archiveName] = bytes;
    files.push({ name: source.archiveName, mediaId: source.mediaId, bytes: bytes.byteLength, sha256: await sha256(bytes) });
  }
  const manifest = {
    schemaVersion: 1,
    packageId: downloadPackage.id,
    title: downloadPackage.title,
    edition: downloadPackage.edition,
    version: downloadPackage.version,
    copyright: "© GiWise Studio — LoreWise Universe",
    license: "Uso personale",
    files,
  };
  entries["LEGGIMI.txt"] = strToU8(readmeFor(downloadPackage));
  entries["CONDIZIONI-USO-PERSONALE.txt"] = strToU8(personalUseTerms);
  entries["MANIFEST-SHA256.json"] = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);
  return { archive: zipSync(entries, { level: 0 }), manifest };
}
