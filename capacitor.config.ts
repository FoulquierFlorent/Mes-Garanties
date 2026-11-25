import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mesgaranties.app",
  appName: "Mes Garanties",
  webDir: "capacitor-fallback",
  server: {
    url: "https://mesgaranties.com",
    cleartext: false,
    allowNavigation: ["mesgaranties.com", "www.mesgaranties.com"],
    errorPath: "offline.html",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#faf7f2",
      launchShowDuration: 1500,
      launchAutoHide: true,
      showSpinner: false,
      androidScaleType: "CENTER_INSIDE",
    },
  },
};

export default config;