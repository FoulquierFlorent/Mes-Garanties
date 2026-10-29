import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("garanties sur la page de l'objet", () => {
  afterEach(cleanup);

  it("affiche la garantie légale avec la garantie magasin et la garantie de marque", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);
    const section = screen.getByRole("heading", { name: "Garanties" }).closest("section") as HTMLElement;

    const rows = Array.from(section.querySelectorAll("p")).map((p) => p.textContent);
    expect(rows).toContain("Garantie légale · 2 ans · jusqu’au 15 janvier 2027");
    expect(rows).toContain("Garantie magasin · 1 an · jusqu’au 15 janvier 2026");
    expect(rows).toContain("Garantie de marque · 3 ans · jusqu’au 15 janvier 2028");

    const legalRow = Array.from(section.querySelectorAll("p")).find((p) => p.textContent?.startsWith("Garantie légale ·")) as HTMLElement;
    expect(legalRow.querySelector("span.bg-warranty-legal")).not.toBeNull();
    expect(section.querySelector("span.bg-warranty-store")).not.toBeNull();
    expect(section.querySelector("span.bg-warranty-brand")).not.toBeNull();
  });

  it("permet de modifier la garantie légale depuis la page de l'objet", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);
    const trigger = screen.getByLabelText("Garantie légale");
    expect(trigger.textContent).toContain("2 ans");
  });
});
