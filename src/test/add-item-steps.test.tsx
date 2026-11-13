import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

vi.mock("@tanstack/react-query", () => ({
  queryOptions: (options: unknown) => options,
  useSuspenseQuery: (options: { queryKey: string[] }) => ({ data: options.queryKey[0] === "items" ? [] : null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/hooks/useUserId", () => ({ useUserId: () => "u1" }));
vi.mock("@/components/ItemPhotos", () => ({ PhotoPicker: () => null, ItemPhotos: () => null }));
vi.mock("@/components/ReceiptScanner", () => ({ ReceiptScanner: () => "Scanner un ticket" }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ delete: () => ({ eq: () => Promise.resolve({}) }) }),
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));
import { Route } from "@/routes/_authenticated/app";

function openDialog() {
  const Page = Route.options.component as ComponentType;
  render(<Page />);
  fireEvent.click(screen.getByRole("button", { name: "Ajouter un objet" }));
}

describe("ajout d'un objet en deux temps", () => {
  afterEach(cleanup);

  it("demande d'abord le ticket, le nom et la date d'achat", () => {
    openDialog();

    expect(screen.getByText("Scanner un ticket")).toBeInTheDocument();
    expect(screen.getByText("Nom")).toBeInTheDocument();
    expect(screen.getByText("Date d'achat")).toBeInTheDocument();
    expect(screen.getByText(/Garantie légale proposée : 2 ans/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ajout manuel" })).toBeInTheDocument();
  });

  it("garde les détails facultatifs hors de vue jusqu'à ce qu'on les ouvre", () => {
    openDialog();

    expect(screen.queryByText("Garantie magasin")).toBeNull();
    expect(screen.queryByText("Marque")).toBeNull();
    expect(screen.queryByText("Prix (€, facultatif)")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /informations complémentaires/ }));

    expect(screen.getByText("Garanties supplémentaires")).toBeInTheDocument();
    expect(screen.getByText("Marque")).toBeInTheDocument();
    expect(screen.getByText("Prix (€, facultatif)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Réparation" })).toBeInTheDocument();
  });
});
