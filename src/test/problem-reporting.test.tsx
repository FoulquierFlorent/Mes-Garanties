import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const { letterSpy } = vi.hoisted(() => ({ letterSpy: vi.fn(() => "") }));
vi.mock("@tanstack/react-query", () => ({
  queryOptions: (options: unknown) => options,
  useSuspenseQuery: () => ({ data: [{ id: "shared-item", name: "Lave-linge", category: "Électroménager", purchase_date: "2025-01-15", warranty_months: 24, return_status: "none" }] }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: () => ({ data: [] }),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({ options, useParams: () => ({ id: "shared-item" }) }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/Receipts", () => ({ Receipts: () => null }));
vi.mock("@/components/ItemPhotos", () => ({ ItemPhotos: () => null, PhotoPicker: () => null }));
vi.mock("@/lib/letter", () => ({ buildLetter: letterSpy }));
import { Route } from "@/routes/_authenticated/objet.$id";

describe("signalement depuis un objet", () => {
  afterEach(cleanup);
  beforeEach(() => { letterSpy.mockClear(); });
  it.each([
    ["Dysfonctionnement", "panne"],
    ["Objet détérioré ou cassé", "casse"],
    ["Ne fonctionne plus", "hs"],
  ])("transmet %s à la rédaction de la lettre", (choice, problem) => {
    const Page = Route.options.component as ComponentType;
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Signaler un problème" }));
    fireEvent.click(screen.getByRole("button", { name: choice }));
    expect(letterSpy).toHaveBeenLastCalledWith(expect.objectContaining({ itemName: "Lave-linge", problem }));
  });
});