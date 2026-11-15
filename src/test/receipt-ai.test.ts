import { describe, it, expect } from "vitest";
import { sanitizeAiReceipt } from "@/lib/receipt-ai";

describe("sanitizeAiReceipt", () => {
  it("keeps valid fields and formats the price", () => {
    expect(sanitizeAiReceipt({ name: "Lave-linge", store: "Darty", purchase_date: "2026-03-14", price: 499.9, category: "Électroménager", brand: null }, ["Électroménager"]))
      .toEqual({ name: "Lave-linge", store: "Darty", purchase_date: "2026-03-14", price: "499.90", category: "Électroménager" });
  });
  it("drops invalid dates, unknown categories and non-positive prices", () => {
    expect(sanitizeAiReceipt({ purchase_date: "2026-02-31", order_date: "14/03/2026", category: "Bidule", price: 0 }, ["Sport"])).toEqual({});
  });
});
