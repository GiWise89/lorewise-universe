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
  version: "1.1.0",
  versionCode: 3,
  status: "available",
  minimumSystem: "Android 8.0 o successivo",
  connection: "Connessione internet richiesta",
  publishedAt: "2 settembre 2026",
  fileSize: "162 KB",
  sha256: "4ce0f05425a2f3de3d09b4e5709a1c1c97b797e3905771d3f5c0cb25568a077d",
  downloadHref: "/downloads/Famiglio-del-Nexus-Android-1.1.0.apk",
};

export const appReleaseStatusLabels: Record<AppReleaseStatus, string> = {
  verification: "COMING SOON",
  available: "APK Android pronta",
  suspended: "Download sospeso",
};
