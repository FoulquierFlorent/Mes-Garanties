import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

vi.mock("@tanstack/react-query", () => ({
  queryOptions: (options: unknown) => options,
  useSuspenseQuery: () => ({
    data: [
      {
        id: "shared-item",
        name: "Lave-linge",
        category: "Électroménager",
        purchase_date: "2025-01-15",
        warranty_months: 24,
        store_warranty_years: 1,
        brand_warranty_years: 3,
        return_status: "none",
      },
    ],
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({ options, useParams: () => ({ id: "shared-item" }) }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/Receipts", () => ({ Receipts: () => null }));
vi.mock("@/components/ItemPhotos", () => ({ ItemPhotos: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }) },
}));
import { Route } from "@/routes/_authenticated/objet.$id";

describe("debug", () => {
  it("prints rows", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);
    const section = screen.getByRole("heading", { name: "Garanties" }).closest("section") as HTMLElement;
    console.log("ROWS:" + JSON.stringify(Array.from(section.querySelectorAll("p")).map((p) => p.textContent)));
    expect(true).toBe(true);
  });
});
