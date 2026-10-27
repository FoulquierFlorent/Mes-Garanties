import { beforeEach, describe, expect, it, vi } from "vitest";
const { upload, from } = vi.hoisted(() => ({ upload: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from } } }));
import { uploadItemPhotos } from "./item-photos";
describe("photos facultatives", () => {
  beforeEach(() => { upload.mockReset(); from.mockReset(); from.mockReturnValue({ upload }); });
  it("permet d'enregistrer un objet sans photo", async () => {
    expect(await uploadItemPhotos("item-1", [])).toEqual([]);
    expect(upload).not.toHaveBeenCalled();
  });
  it("classe chaque photo dans le dossier privé de l'objet", async () => {
    upload.mockResolvedValue({ error: null });
    const photo = new File(["photo"], "objet.png", { type: "image/png" });
    expect(await uploadItemPhotos("item-1", [photo])).toEqual([]);
    expect(from).toHaveBeenCalledWith("item-photos");
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^item-1\/.+-objet\.png$/), photo);
  });
  it("conserve seulement les photos échouées pour une nouvelle tentative", async () => {
    upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error("failed") });
    const a = new File(["a"], "a.png"), b = new File(["b"], "b.png");
    expect(await uploadItemPhotos("item-1", [a, b])).toEqual([b]);
  });
});