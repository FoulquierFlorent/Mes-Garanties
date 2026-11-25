import { lovable } from "@/integrations/lovable/index";
import { isNativeApp, type AppPlatform } from "@/lib/platform";

export type OAuthProvider = "google" | "lovable";

export interface OAuthResult {
  error?: unknown;
  redirected?: boolean;
}

export type NativeOAuthHandler = (
  provider: OAuthProvider,
  platform: Exclude<AppPlatform, "web">,
) => Promise<OAuthResult>;

let nativeOAuthHandler: NativeOAuthHandler | null = null;

/**
 * Allows the Capacitor mobile layer (Step 2) to register an official native OAuth
 * handler (e.g. Chrome Custom Tabs / ASWebAuthenticationSession or native Google Sign-In)
 * without altering web authentication.
 */
export function registerNativeOAuthHandler(handler: NativeOAuthHandler | null): void {
  nativeOAuthHandler = handler;
}

/**
 * Signs in with Google or Lovable.
 * - On web: uses Lovable Cloud managed OAuth directly (unchanged behavior).
 * - On native Android/iOS: delegates to the registered native handler when available.
 */
export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<OAuthResult> {
  if (isNativeApp() && nativeOAuthHandler) {
    const capPlatform = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.();
    if (capPlatform === "android" || capPlatform === "ios") {
      return nativeOAuthHandler(provider, capPlatform);
    }
  }

  return lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });
}