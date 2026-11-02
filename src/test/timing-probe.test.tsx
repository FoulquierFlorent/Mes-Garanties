import { cleanup, render } from "@testing-library/react";
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
  useQuery: () => ({ data: [] }),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({ options, useParams: () => ({ id: "shared-item" }) }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/Receipts", () => ({ Receipts: () => null }));
vi.mock("@/components/ItemPhotos", () => ({ ItemPhotos: () => null, PhotoPicker: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }) },
}));
import { Route } from "@/routes/_authenticated/objet.$id";

describe("mesure", () => {
  afterEach(cleanup);
  it("chronomètre le rendu", () => {
    const Page = Route.options.component as ComponentType;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      const { unmount } = render(<Page />);
      const t1 = performance.now();
      unmount();
      console.log(`rendu ${i + 1}: ${(t1 - t0).toFixed(0)} ms`);
    }
    expect(true).toBe(true);
  });
});
