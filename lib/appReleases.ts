export type AppReleaseStatus = "verification" | "available" | "suspended";

export type AppRelease = {
  platform: "Android";
  format: "APK";
  version: string;
  versionCode: number;
  status: AppReleaseStatus;
  minimumSystem: string;
  connection: string;
  publishedAt: string | null;
  fileSize: string | null;
  sha256: string | null;
  downloadHref: string | null;
};

export const lorewiseAndroidRelease: AppRelease = {
  platform: "Android",
  format: "APK",
  version: "1.1.1",
  versionCode: 4,
  status: "available",
  minimumSystem: "Android 8.0 o successivo",
  connection: "Connessione internet richiesta",
  publishedAt: "2 settembre 2026",
  fileSize: "162 KB",
  sha256: "78e80f2c6dc7d5403a29cc5cd24e3b60bd2249682feaa5760ce68263bcc0605b",
  downloadHref: "/downloads/Famiglio-del-Nexus-Android-1.1.1.apk",
};

export const appReleaseStatusLabels: Record<AppReleaseStatus, string> = {
  verification: "COMING SOON",
  available: "APK Android pronta",
  suspended: "Download sospeso",
};
