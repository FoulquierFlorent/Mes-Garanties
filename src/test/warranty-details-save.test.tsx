import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Item } from "@/lib/items";
const { update, upload } = vi.hoisted(() => ({ update: vi.fn(), upload: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ queryOptions: (options: unknown) => options, useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@/lib/receipt-upload", () => ({ uploadReceipt: upload }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ update: (patch: unknown) => { update(patch); return { eq: () => Promise.resolve({ error: null }) }; } }) } }));
import { ItemWarrantyDetails } from "@/components/ItemWarrantyDetails";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("annuler une modification conserve les données enregistrées", () => {
  const item = { id: "objet", purchase_date: "2026-01-15", warranty_months: 24, store_warranty_years: 2, warranty_details: { store: { provider: "Magasin A", start_date: "2026-02-01" } } } as unknown as Item;
  render(<ItemWarrantyDetails item={item} />);
  fireEvent.click(screen.getByRole("button", { name: /Modifier les informations/ }));
  fireEvent.change(screen.getByLabelText("Fournisseur"), { target: { value: "À abandonner" } });
  fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
  fireEvent.click(screen.getByRole("button", { name: /Modifier les informations/ }));
  expect(screen.getByLabelText("Fournisseur")).toHaveValue("Magasin A");
  expect(update).not.toHaveBeenCalled();
});
it("affiche les vices cachés sans fabriquer de garantie de conformité expirée", () => {
  const item = { id: "objet", purchase_date: "2026-01-15", warranty_months: 0, warranty_details: { purchase_context: { country: "france", seller: "particulier", condition: "occasion" }, vices_caches: { discovery_date: "2026-11-20" } } } as unknown as Item;
  render(<ItemWarrantyDetails item={item} />);
  expect(screen.getByRole("heading", { name: "Garantie des vices cachés" })).toBeInTheDocument();
  expect(screen.getByText("À vérifier")).toBeInTheDocument();
  expect(screen.getByText(/Découverte du vice/).parentElement).toHaveTextContent("20 novembre 2026");
  expect(screen.queryByText("Expirée")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Garantie légale de conformité" })).toBeNull();
});

it("enregistre l’assurance casse ou vol sans effacer les autres garanties", async () => {
  const item = { id: "objet", purchase_date: "2026-01-15", warranty_months: 24, warranty_details: { store: { provider: "Magasin A" } } } as unknown as Item;
  render(<ItemWarrantyDetails item={item} />);
  fireEvent.click(screen.getByRole("button", { name: "Ajouter l’assurance" }));
  fireEvent.change(screen.getByLabelText("Numéro de contrat"), { target: { value: "ASSUR-2026-042" } });
  fireEvent.change(screen.getByLabelText("Début de couverture"), { target: { value: "2026-01-15" } });
  fireEvent.change(screen.getByLabelText("Fin de couverture"), { target: { value: "2028-01-15" } });
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer l’assurance" }));
  await waitFor(() => expect(update).toHaveBeenCalledWith({ warranty_details: { store: { provider: "Magasin A" }, damage_theft_insurance: { contract_number: "ASSUR-2026-042", start_date: "2026-01-15", end_date: "2028-01-15" } } }));
});

it("refuse une fin de couverture antérieure au début", async () => {
  const item = { id: "objet", purchase_date: "2026-01-15", warranty_months: 24, warranty_details: {} } as unknown as Item;
  render(<ItemWarrantyDetails item={item} />);
  fireEvent.click(screen.getByRole("button", { name: "Ajouter l’assurance" }));
  fireEvent.change(screen.getByLabelText("Début de couverture"), { target: { value: "2026-02-02" } });
  fireEvent.change(screen.getByLabelText("Fin de couverture"), { target: { value: "2026-02-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer l’assurance" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("La fin de couverture doit être postérieure ou égale à sa date de début.");
  expect(update).not.toHaveBeenCalled();
});

it("enregistre fournisseur, début et conditions sans effacer le contrat ni les autres garanties", async () => {
  const item = { id: "objet", purchase_date: "2026-01-15", warranty_months: 24, store_warranty_years: 2, warranty_details: { store: { provider: "Magasin A", contract_file: "contrat.pdf" }, brand: { provider: "Marque B", conditions: "Pièces" } } } as unknown as Item;
  render(<ItemWarrantyDetails item={item} />);
  fireEvent.click(screen.getByRole("button", { name: /Modifier les informations/ }));
  fireEvent.change(screen.getByLabelText("Fournisseur"), { target: { value: "Magasin C" } });
  fireEvent.change(screen.getByLabelText("Date de début"), { target: { value: "2026-02-01" } });
  fireEvent.change(screen.getByLabelText("Conditions particulières"), { target: { value: "Pièces et main-d’œuvre" } });
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer les informations" }));
  await waitFor(() => expect(update).toHaveBeenCalledWith({ warranty_details: { store: { provider: "Magasin C", start_date: "2026-02-01", conditions: "Pièces et main-d’œuvre", contract_file: "contrat.pdf" }, brand: { provider: "Marque B", conditions: "Pièces" } } }));
});