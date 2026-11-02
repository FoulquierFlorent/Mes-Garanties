import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const { household, items } = vi.hoisted(() => ({
  household: {
    id: "h1",
    name: "Maison",
    invite_code: "AB12CD",
    members: [
      { user_id: "u1", email: "jane@example.fr", display_name: "Jane" },
      { user_id: "u2", email: "bob@example.fr", display_name: "Bob" },
    ],
  },
  items: [
    { id: "i1", user_id: "u1", name: "Lave-linge", category: "Électroménager", purchase_date: "2025-01-15", warranty_months: 24, alerts: ["1m"], return_status: "none", household_id: "h1" },
    { id: "i2", user_id: "u2", name: "Vélo", category: "Sport", purchase_date: "2025-06-01", warranty_months: 24, alerts: ["1m"], return_status: "none", household_id: "h1" },
  ],
}));

vi.mock("@tanstack/react-query", () => ({
  queryOptions: (options: unknown) => options,
  useSuspenseQuery: (options: { queryKey: string[] }) => ({ data: options.queryKey[0] === "items" ? items : household }),
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

import { Route as FoyerRoute } from "@/routes/_authenticated/foyer";
import { Route as AppRoute } from "@/routes/_authenticated/app";

describe("prénoms des membres du foyer", () => {
  afterEach(cleanup);

  it("liste les membres par prénom sans montrer d'e-mail", () => {
    const Page = FoyerRoute.options.component as ComponentType;
    render(<Page />);
    expect(screen.getByText("Bob")).not.toBeNull();
    expect((screen.getByLabelText("Votre prénom") as HTMLInputElement).value).toBe("Jane");
    expect(screen.queryByText(/@/)).toBeNull();
  });

  it("signale qui a ajouté un objet par son prénom, jamais par son e-mail", () => {
    const Page = AppRoute.options.component as ComponentType;
    render(<Page />);
    expect(screen.getByText(/ajouté par Bob/)).not.toBeNull();
    expect(screen.queryAllByText(/ajouté par/).length).toBe(1);
    expect(screen.queryByText(/@/)).toBeNull();
  });
});
