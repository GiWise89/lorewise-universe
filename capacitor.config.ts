import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.LOREWISE_ANDROID_SERVER_URL?.trim() || "https://lorewisenexus.it";
const usesLocalHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.giwise.lorewiseuniverse",
  appName: "LoreWise Universe",
  webDir: "android-shell",
  backgroundColor: "#0b0a09",
  server: {
    url: serverUrl,
    cleartext: usesLocalHttp,
    androidScheme: "https",
    errorPath: "offline.html",
  },
  android: {
    allowMixedContent: usesLocalHttp,
    backgroundColor: "#0b0a09",
  },
};

export default config;
