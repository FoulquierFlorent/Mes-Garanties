import { describe, it, expect } from "vitest";
import { supportSchema, isSupportRateLimited, SUPPORT_EMAIL } from "@/lib/support";
import { TEMPLATES } from "@/lib/email-templates/registry";

const ok = { name: "Jeanne", email: "j@ex.com", category: "Réclamation", subject: "Souci", message: "Bonjour, un problème." };
describe("support", () => {
  it("sends support requests to the official address", () => { expect(TEMPLATES["support-request"]?.to).toBe("mesgaranties.support@gmail.com"); expect(SUPPORT_EMAIL).toBe("mesgaranties.support@gmail.com"); });
  it("accepts a valid request", () => expect(supportSchema.safeParse(ok).success).toBe(true));
  it("rejects unknown category", () => expect(supportSchema.safeParse({ ...ok, category: "Spam" }).success).toBe(false));
  it("rejects filled honeypot", () => expect(supportSchema.safeParse({ ...ok, website: "x" }).success).toBe(false));
  it("limits to 3 per hour", () => { expect(isSupportRateLimited(2)).toBe(false); expect(isSupportRateLimited(3)).toBe(true); });
});
