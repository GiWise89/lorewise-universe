import installer from "@/data/games/windows-installer.json";

export const GAME_INSTALLER_MIN_BYTES = 1024 * 1024;
export const GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES = 150 * 1024 * 1024;

export const verifiedWindowsInstaller = {
  ...installer,
  signatureStatus: "Non firmato · avviso Windows obbligatorio",
  scanStatus: "Scansione Microsoft Defender da completare",
  runtimeStatus: "Installazione, avvio desktop e disinstallazione da verificare",
  updateStatus: "Prima distribuzione · aggiornamento automatico non ancora collaudabile",
} as const;

export const gameInstallerUploadPolicy = {
  directUploadMaxBytes: GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES,
  directUploadMaxLabel: "150 MB",
  oversizedAction: "Trasferimento privato R2 esterno richiesto: il file definitivo supera il limite HTTP",
} as const;

export function isDirectGameInstallerUpload(size: number) {
  return size >= GAME_INSTALLER_MIN_BYTES && size <= GAME_INSTALLER_DIRECT_UPLOAD_MAX_BYTES;
}
