import type { Json } from "@/integrations/supabase/types";

export function savedReplacementLetter(value: Json | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value['text'] !== "string" || !value['text'].trim()) return null;
  return {
    text: value['text'],
    senderName: typeof value['senderName'] === "string" ? value['senderName'] : "",
    senderAddress: typeof value['senderAddress'] === "string" ? value['senderAddress'] : "",
    problem: value['problem'] === "casse" || value['problem'] === "hs" ? value['problem'] : "panne" as const,
    details: typeof value['details'] === "string" ? value['details'] : "",
    warrantyType: value['warrantyType'] === "store" || value['warrantyType'] === "brand" ? value['warrantyType'] : "base" as const,
  };
}

export function canShowReturnTracking(letter: Json | undefined, sentDate: string | null | undefined) {
  return savedReplacementLetter(letter) !== null && Boolean(sentDate);
}