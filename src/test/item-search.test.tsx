import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const { items } = vi.hoisted(() => ({
  items: [
    {
      id: "i1",
      user_id: "u1",
      name: "Lave-linge", brand: "Bosch",
      category: "Électroménager",
      purchase_date: "2025-01-15",
      warranty_months: 24,
      store_warranty_years: 1,
      brand_warranty_years: 3,
      alerts: ["1m"],
      return_status: "none",
      household_id: null,
    },
    { id: "i2", user_id: "u1", name: "Vélo", category: "Sport", store: "Decathlon", purchase_date: "2025-01-15", warranty_months: 24, alerts: [], return_status: "none", household_id: null },
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

describe("recherche d'objets", () => {
  afterEach(cleanup);
  it("filtre par marque, magasin et affiche un message si rien ne correspond", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);
    const input = screen.getByLabelText("Rechercher un objet");
    fireEvent.change(input, { target: { value: "decathlon" } });
    expect(screen.getByText("Vélo")).toBeTruthy();
    expect(screen.queryByText("Lave-linge")).toBeNull();
    fireEvent.change(input, { target: { value: "bosch" } });
    expect(screen.getByText("Lave-linge")).toBeTruthy();
    expect(screen.queryByText("Vélo")).toBeNull();
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText(/Aucun objet ne correspond/)).toBeTruthy();
  });
});
