import { describe, expect, it } from "vitest";
import { planAccountDeletion } from "@/lib/account-deletion";

describe("suppression du compte", () => {
  const items = [
    { id: "perso", user_id: "u", household_id: null },
    { id: "partage", user_id: "u", household_id: "h1" },
    { id: "seul", user_id: "u", household_id: "h2" },
    { id: "autre", user_id: "v", household_id: "h1" },
  ];
  it("garde les objets d'un foyer partagé et efface les objets personnels", () => {
    const r = planAccountDeletion("u", items, new Set(["h1"]));
    expect(r.deleteItemIds.sort()).toEqual(["perso", "seul"]);
    expect(r.keptSharedCount).toBe(1);
  });
  it("ne touche jamais aux objets d'un autre membre", () => {
    expect(planAccountDeletion("u", items, new Set()).deleteItemIds).not.toContain("autre");
  });
});
