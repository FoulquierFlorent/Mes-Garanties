import { isNativeApp } from "@/lib/platform";
import { registerNativeFileDownloader } from "@/lib/authenticated-download";
import { registerNativeOAuthHandler } from "@/lib/mobile-auth";

let initialized = false;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Initializes native Capacitor integrations on Android and iOS only.
 * No-op on standard web browsers.
 */
export async function initCapacitorBridge(): Promise<void> {
  if (initialized || !isNativeApp()) return;
  initialized = true;

  const [{ App }, { Browser }, { Directory, Filesystem }, { Share }, { SplashScreen }] = await Promise.all([
    import("@capacitor/app"),
    import("@capacitor/browser"),
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
    import("@capacitor/splash-screen"),
  ]);

  // 1. Native PDF, CSV, ZIP export via Filesystem (Cache) + native Share sheet
  registerNativeFileDownloader(async (blob, filename, title) => {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const base64Data = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: safeName,
      data: base64Data,
      directory: Directory.Cache,
    });
    await Share.share({
      title: title ?? safeName,
      url: written.uri,
      dialogTitle: title ?? "Enregistrer ou partager le fichier",
    });
  });

  // 2. Secure native OAuth via system browser (Chrome Custom Tabs / ASWebAuthenticationSession)
  // Avoids Google's disallowed_useragent block inside embedded WebViews.
  registerNativeOAuthHandler(async (provider) => {
    const redirectUri = encodeURIComponent(window.location.origin);
    const initiateUrl = `${window.location.origin}/~oauth/initiate?provider=${encodeURIComponent(provider)}&redirect_uri=${redirectUri}`;
    await Browser.open({ url: initiateUrl, presentationStyle: "popover" });
    return { redirected: true, error: null };
  });

  // 3. Android hardware back button handling
  await App.addListener("backButton", ({ canGoBack }) => {
    const rootPaths = new Set(["/", "/calendrier", "/app", "/auth"]);
    if (canGoBack && !rootPaths.has(window.location.pathname)) {
      window.history.back();
    } else {
      void App.exitApp();
    }
  });

  // 4. Close system browser when returning via App Link
  await App.addListener("appUrlOpen", () => {
    void Browser.close().catch(() => {});
  });

  await SplashScreen.hide().catch(() => {});
}