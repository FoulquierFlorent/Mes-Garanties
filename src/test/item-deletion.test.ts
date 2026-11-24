import { describe, it, expect, vi, beforeEach } from "vitest";

const listMock = vi.fn();
const removeMock = vi.fn();
const deleteEqMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        list: listMock,
        remove: removeMock,
      }),
    },
    from: () => ({
      delete: () => ({
        eq: deleteEqMock,
      }),
    }),
  },
}));

import { deleteItemWithFiles } from "@/lib/item-deletion";

describe("deleteItemWithFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supprime les fichiers des dossiers receipts et item-photos avant la ligne en base", async () => {
    listMock
      .mockResolvedValueOnce({ data: [{ name: "facture.pdf" }, { name: "facture.pdf.ocr.txt" }, { name: ".emptyFolderPlaceholder" }], error: null })
      .mockResolvedValueOnce({ data: [{ name: "photo.jpg" }], error: null });
    removeMock.mockResolvedValue({ error: null });
    deleteEqMock.mockResolvedValue({ error: null });

    const res = await deleteItemWithFiles("item-123");

    expect(res).toEqual({ deleted: true, fileCleanupWarning: false });
    expect(removeMock).toHaveBeenNthCalledWith(1, ["item-123/facture.pdf", "item-123/facture.pdf.ocr.txt"]);
    expect(removeMock).toHaveBeenNthCalledWith(2, ["item-123/photo.jpg"]);
    expect(deleteEqMock).toHaveBeenCalledWith("id", "item-123");
  });

  it("signale un avertissement sans bloquer la suppression de l'objet si le stockage échoue", async () => {
    listMock.mockResolvedValue({ data: null, error: new Error("storage error") });
    deleteEqMock.mockResolvedValue({ error: null });

    const res = await deleteItemWithFiles("item-456");

    expect(res).toEqual({ deleted: true, fileCleanupWarning: true });
    expect(deleteEqMock).toHaveBeenCalledWith("id", "item-456");
  });
});