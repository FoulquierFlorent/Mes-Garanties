import { describe, expect, it } from "vitest";
import { memberBorderClass, memberDotClass } from "@/lib/members";

describe("couleur de chaque membre du foyer", () => {
  it("donne toujours la même couleur au même membre", () => {
    expect(memberBorderClass("u1")).toBe(memberBorderClass("u1"));
    expect(memberDotClass("u1")).toBe(memberDotClass("u1"));
    expect(memberDotClass("u1").replace("bg-", "border-")).toBe(memberBorderClass("u1"));
  });

  it("utilise une couleur de membre", () => {
    expect(memberBorderClass("u1")).toMatch(/^border-member-[1-6]$/);
    expect(memberDotClass("u1")).toMatch(/^bg-member-[1-6]$/);
  });

  it("donne une couleur neutre quand le membre est inconnu", () => {
    expect(memberBorderClass(null)).toBe("border-border");
    expect(memberDotClass(undefined)).toBe("bg-muted-foreground");
  });

  it("répartit plusieurs membres sur plusieurs couleurs", () => {
    const colors = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => memberBorderClass(`user-${s}`)));
    expect(colors.size).toBeGreaterThan(1);
  });
});
