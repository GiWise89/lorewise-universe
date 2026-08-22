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
  version: "0.3.0",
  versionCode: 4,
  status: "verification",
  minimumSystem: "Android 7.0 o successivo",
  connection: "Connessione internet richiesta",
  publishedAt: null,
  fileSize: null,
  sha256: null,
  downloadHref: null,
};

export const appReleaseStatusLabels: Record<AppReleaseStatus, string> = {
  verification: "COMING SOON",
  available: "Beta Android disponibile",
  suspended: "Download sospeso",
};
