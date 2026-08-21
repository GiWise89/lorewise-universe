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
  status: "available",
  minimumSystem: "Android 7.0 o successivo",
  connection: "Connessione internet richiesta",
  publishedAt: "21 agosto 2026",
  fileSize: "13.52 MB",
  sha256: "b54fd19d531af7bb4fd868fcdf88c0dcf79f83bf728c7bbba6cb0f03438046f1",
  downloadHref: "/downloads/android/LoreWise-Universe-0.3.0.apk",
};

export const appReleaseStatusLabels: Record<AppReleaseStatus, string> = {
  verification: "Build in verifica",
  available: "Beta Android disponibile",
  suspended: "Download sospeso",
};
