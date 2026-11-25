import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlatform, isAndroidNative, isIosNative, isNativeApp } from "@/lib/platform";
import { registerNativeFileDownloader, saveOrShareBlob } from "@/lib/authenticated-download";
import { registerNativeOAuthHandler, signInWithOAuthProvider } from "@/lib/mobile-auth";
import { lovable } from "@/integrations/lovable/index";

function setCapacitorMock(mock?: { isNativePlatform: () => boolean; getPlatform: () => string }) {
  const win = window as unknown as { Capacitor?: typeof mock };
  if (mock) {
    win.Capacitor = mock;
  } else {
    delete win.Capacitor;
  }
}

afterEach(() => {
  setCapacitorMock(undefined);
  registerNativeFileDownloader(null);
  registerNativeOAuthHandler(null);
  vi.restoreAllMocks();
});

describe("platform detection", () => {
  it("defaults to web when Capacitor is absent", () => {
    expect(getPlatform()).toBe("web");
    expect(isNativeApp()).toBe(false);
    expect(isAndroidNative()).toBe(false);
    expect(isIosNative()).toBe(false);
  });

  it("detects native Android and iOS when Capacitor bridge is present", () => {
    setCapacitorMock({ isNativePlatform: () => true, getPlatform: () => "android" });
    expect(getPlatform()).toBe("android");
    expect(isNativeApp()).toBe(true);
    expect(isAndroidNative()).toBe(true);
    expect(isIosNative()).toBe(false);

    setCapacitorMock({ isNativePlatform: () => true, getPlatform: () => "ios" });
    expect(getPlatform()).toBe("ios");
    expect(isNativeApp()).toBe(true);
    expect(isIosNative()).toBe(true);
  });
});

describe("saveOrShareBlob", () => {
  it("uses standard browser download on web", async () => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const mode = await saveOrShareBlob(new Blob(["a,b"], { type: "text/csv" }), "export.csv");
    expect(mode).toBe("download");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("delegates to registered native downloader on Android/iOS", async () => {
    setCapacitorMock({ isNativePlatform: () => true, getPlatform: () => "android" });
    const nativeHandler = vi.fn(async () => {});
    registerNativeFileDownloader(nativeHandler);

    const blob = new Blob(["pdf-bytes"], { type: "application/pdf" });
    const mode = await saveOrShareBlob(blob, "dossier.pdf", { title: "Dossier assurance" });
    expect(mode).toBe("native");
    expect(nativeHandler).toHaveBeenCalledWith(blob, "dossier.pdf", "Dossier assurance");
  });
});

describe("signInWithOAuthProvider", () => {
  it("uses Lovable managed OAuth on web", async () => {
    const spy = vi.spyOn(lovable.auth, "signInWithOAuth").mockResolvedValue({ redirected: true, error: null });
    const res = await signInWithOAuthProvider("google");
    expect(spy).toHaveBeenCalledWith("google", { redirect_uri: window.location.origin });
    expect(res).toEqual({ redirected: true, error: null });
  });

  it("delegates to registered native OAuth handler on mobile", async () => {
    setCapacitorMock({ isNativePlatform: () => true, getPlatform: () => "ios" });
    const nativeOAuth = vi.fn(async () => ({ redirected: false }));
    registerNativeOAuthHandler(nativeOAuth);

    const res = await signInWithOAuthProvider("google");
    expect(nativeOAuth).toHaveBeenCalledWith("google", "ios");
    expect(res).toEqual({ redirected: false });
  });
});