import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(async (_path: string, _file: Blob) => ({ error: null })),
  download: vi.fn(async (_path: string) => ({ data: null })),
  recognize: vi.fn(async (_photo: Blob) => ({ data: { text: "Magasin Exemple\nTotal 42,50 EUR" } })),
  terminate: vi.fn(async () => {}),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }), useQuery: () => ({ data: [] }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: () => mocks } } }));
vi.mock("tesseract.js", () => ({ createWorker: async () => ({ recognize: mocks.recognize, terminate: mocks.terminate }) }));
import { Receipts } from "@/components/Receipts";

describe("lecture et classement du ticket", () => {
  afterEach(cleanup);
  it("conserve la photo et le texte lu dans le dossier du même objet", async () => {
    const { container } = render(<Receipts itemId="objet-partage" />);
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error("Missing upload input");
    const photo = new File(["photo"], "ticket.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [photo] } });
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(2));
    const photoPath = mocks.upload.mock.calls[0]?.[0];
    const textPath = mocks.upload.mock.calls[1]?.[0];
    expect(photoPath).toMatch(/^objet-partage\/\d+-ticket\.jpg$/);
    expect(textPath).toBe(`${photoPath}.ocr.txt`);
    expect(mocks.recognize).toHaveBeenCalledWith(photo);
    await waitFor(() => expect(mocks.terminate).toHaveBeenCalled());
  });
});