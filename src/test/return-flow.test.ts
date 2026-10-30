import { describe, expect, it } from "vitest";
import { canShowReturnTracking, savedReplacementLetter } from "@/lib/return-flow";

describe("conditions du suivi de retour", () => {
  it("exige une lettre rédigée même si un renvoi existe", () => {
    expect(canShowReturnTracking(null, "2026-10-30")).toBe(false);
    expect(canShowReturnTracking({ text: "" }, "2026-10-30")).toBe(false);
  });
  it("exige un renvoi effectué même si la lettre existe", () => {
    expect(canShowReturnTracking({ text: "Demande de remplacement" }, null)).toBe(false);
  });
  it("autorise le suivi avec lettre et renvoi effectué", () => {
    expect(canShowReturnTracking({ text: "Demande de remplacement" }, "2026-10-30")).toBe(true);
  });
  it("restitue la lettre enregistrée pour la retrouver après rechargement", () => {
    expect(savedReplacementLetter({ text: "Lettre", senderName: "Florent", senderAddress: "Adresse", problem: "hs", details: "Panne" })).toEqual({ text: "Lettre", senderName: "Florent", senderAddress: "Adresse", problem: "hs", details: "Panne" });
  });
});