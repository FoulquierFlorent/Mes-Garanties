export type AppPlatform = "web" | "android" | "ios";

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function getCapacitorGlobal(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/**
 * Detects whether the app is running in a standard browser ("web")
 * or inside a native Capacitor container ("android" | "ios").
 * Safe during SSR (returns "web").
 */
export function getPlatform(): AppPlatform {
  const cap = getCapacitorGlobal();
  if (!cap?.isNativePlatform?.()) return "web";
  const platform = cap.getPlatform?.();
  if (platform === "android" || platform === "ios") return platform;
  return "web";
}

export function isNativeApp(): boolean {
  return getPlatform() !== "web";
}

export function isAndroidNative(): boolean {
  return getPlatform() === "android";
}

export function isIosNative(): boolean {
  return getPlatform() === "ios";
}

export function supportsWebShareFiles(file?: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;
  if (!file) return true;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}