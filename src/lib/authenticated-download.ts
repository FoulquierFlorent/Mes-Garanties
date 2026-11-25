import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, supportsWebShareFiles } from "@/lib/platform";

export type NativeFileDownloader = (blob: Blob, filename: string, title?: string) => Promise<void>;

let nativeFileDownloader: NativeFileDownloader | null = null;

/**
 * Allows the Capacitor mobile layer (Step 2: Filesystem + Share plugins)
 * to handle PDF, CSV and ZIP exports natively.
 */
export function registerNativeFileDownloader(handler: NativeFileDownloader | null): void {
  nativeFileDownloader = handler;
}

export async function fetchAuthenticatedExport(path: string): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("auth_required");
  const response = await fetch(path, { headers: { Authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? (response.status === 403 ? "plan_required" : "export_failed"));
  }
  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function saveOrShareBlob(
  blob: Blob,
  filename: string,
  options?: { title?: string },
): Promise<"native" | "share" | "download"> {
  if (isNativeApp() && nativeFileDownloader) {
    await nativeFileDownloader(blob, filename, options?.title);
    return "native";
  }

  if (isNativeApp() && typeof File !== "undefined") {
    const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
    if (supportsWebShareFiles(file)) {
      try {
        await navigator.share({ files: [file], title: options?.title ?? filename });
        return "share";
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return "share";
        }
      }
    }
  }

  downloadBlob(blob, filename);
  return "download";
}
