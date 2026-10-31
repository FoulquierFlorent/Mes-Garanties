import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const { items } = vi.hoisted(() => ({
  items: [
    {
      id: "i1",
      user_id: "u1",
      name: "Lave-linge",
      category: "Électroménager",
      purchase_date: "2025-01-15",
      warranty_months: 24,
      store_warranty_years: 1,
      brand_warranty_years: 3,
      alerts: ["1m"],
      return_status: "none",
      household_id: null,
    },
  ],
}));

vi.mock("@tanstack/react-query", () => ({
  queryOptions: (options: unknown) => options,
  useSuspenseQuery: (options: { queryKey: string[] }) => ({ data: options.queryKey[0] === "items" ? items : null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/hooks/useUserId", () => ({ useUserId: () => "u1" }));
vi.mock("@/components/ItemPhotos", () => ({ PhotoPicker: () => null, ItemPhotos: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      delete: () => ({ eq: () => Promise.resolve({}) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));

import { Route } from "@/routes/_authenticated/app";

function warrantyRows() {
  const row = screen.getByText("Lave-linge").closest("li") as HTMLElement;
  return Array.from(row.querySelectorAll("p")).filter((p) => /Garantie (légale|magasin|de marque)/.test(p.textContent ?? ""));
}

describe("garanties dans la liste des objets", () => {
  afterEach(cleanup);

  it("affiche les trois garanties l'une sous l'autre, chacune avec sa couleur", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);

    const rows = warrantyRows();
    expect(rows.map((r) => (r.textContent ?? "").match(/Garantie (?:légale|magasin|de marque)/)?.[0])).toEqual([
      "Garantie légale",
      "Garantie magasin",
      "Garantie de marque",
    ]);

    const legal = rows.find((r) => r.textContent?.startsWith("Garantie légale")) as HTMLElement;
    const store = rows.find((r) => r.textContent?.startsWith("Garantie magasin")) as HTMLElement;
    const brand = rows.find((r) => r.textContent?.startsWith("Garantie de marque")) as HTMLElement;
    expect(legal.querySelector("span.bg-warranty-legal")).not.toBeNull();
    expect(store.querySelector("span.bg-warranty-store")).not.toBeNull();
    expect(brand.querySelector("span.bg-warranty-brand")).not.toBeNull();
  });

  it("donne la date de fin et le statut avec les jours restants pour chaque garantie", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);

    const rows = warrantyRows();
    const texts = rows.map((r) => r.textContent ?? "");
    expect(texts.find((t) => t.startsWith("Garantie légale"))).toMatch(/jusqu’au 15 janvier 2027\s*(Bientôt|Active|Expirée)/);
    expect(texts.find((t) => t.startsWith("Garantie magasin"))).toMatch(/jusqu’au 15 janvier 2026\s*Expirée/);
    expect(texts.find((t) => t.startsWith("Garantie de marque"))).toMatch(/jusqu’au 15 janvier 2028\s*Active · \d+ j/);
  });
});
