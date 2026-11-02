import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
vi.mock("@/components/Receipts", () => ({ Receipts: () => "Factures et tickets" }));
vi.mock("@/components/ReceiptSummary", () => ({ ReceiptSummary: () => "Résumé du ticket" }));
vi.mock("@/components/ItemPhotos", () => ({ ItemPhotos: () => null, PhotoPicker: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }) },
}));
import { Route } from "@/routes/_authenticated/objet.$id";

function pageText() {
  return (document.body.textContent ?? "");
}

describe("fiche objet allégée", () => {
  afterEach(cleanup);

  it("garde l'essentiel visible et range justificatifs et démarches hors de vue", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);

    expect(screen.getByRole("heading", { name: "Garanties" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Descriptif de l’objet" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prix" })).toBeInTheDocument();
    const rows = Array.from(document.querySelectorAll("p")).map((p) => p.textContent);
    expect(rows).toContain("Garantie légale · 2 ans · jusqu’au 15 janvier 2027");

    expect(pageText()).not.toContain("Factures et tickets");
    expect(pageText()).not.toContain("Lettre de demande de remplacement");
    expect(pageText()).not.toContain("Suivi du retour");
  });

  it("montre les factures et le résumé quand on ouvre la rubrique", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: /Factures, tickets et résumé/ }));

    expect(screen.getByText("Factures et tickets")).toBeInTheDocument();
    expect(screen.getByText("Résumé du ticket")).toBeInTheDocument();
  });

  it("montre la lettre et le signalement quand on ouvre les démarches", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Signaler un problème" }));

    expect(screen.getByText("Lettre de demande de remplacement")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dysfonctionnement" })).toBeInTheDocument();
  });

  it("referme une rubrique déjà ouverte", () => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);

    const trigger = screen.getByRole("button", { name: /Factures, tickets et résumé/ });
    fireEvent.click(trigger);
    expect(screen.getByText("Factures et tickets")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("Factures et tickets")).toBeNull();
  });
});
