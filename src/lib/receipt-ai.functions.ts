import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES } from "@/lib/items";
import { sanitizeAiReceipt } from "@/lib/receipt-ai";

const nullable = (type: string) => ({ type: [type, "null"] });
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "brand", "store", "purchase_date", "order_number", "order_date", "price", "category"],
  properties: {
    name: nullable("string"), brand: nullable("string"), store: nullable("string"),
    purchase_date: nullable("string"), order_number: nullable("string"), order_date: nullable("string"),
    price: nullable("number"), category: nullable("string"),
  },
};

/** Lit une photo de ticket (ou une facture PDF) avec l'IA et renvoie les champs détectés, sans rien enregistrer. */
export const extractReceiptWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dataUrl: string; filename: string }) => {
    if (typeof d.dataUrl !== "string" || !/^data:(image\/(png|jpeg|webp|gif)|application\/pdf);base64,/.test(d.dataUrl)) throw new Error("Fichier non pris en charge");
    if (d.dataUrl.length > 8_000_000) throw new Error("Fichier trop lourd");
    return { dataUrl: d.dataUrl, filename: String(d.filename || "facture.pdf").slice(0, 100) };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { fields: null, error: "Lecture intelligente non configurée." };
    const isPdf = data.dataUrl.startsWith("data:application/pdf");
    const media = isPdf
      ? { type: "input_file", filename: data.filename, file_data: data.dataUrl }
      : { type: "input_image", image_url: data.dataUrl };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: `Tu lis un ticket de caisse ou une facture française. Extrais l'article principal acheté. name : nom court et clair de l'objet en français (ex. « Lave-linge », « Casque audio »). brand : marque de l'objet. store : enseigne. purchase_date et order_date : format AAAA-MM-JJ. order_number : n° de facture, de commande ou de ticket. price : prix TTC de l'article principal en euros (ou total si un seul article). category : une valeur exacte parmi ${CATEGORIES.join(", ")}. Mets null pour toute information absente ou illisible ; n'invente rien.`,
        text: { format: { type: "json_schema", name: "ticket", strict: true, schema } },
        input: [{ role: "user", content: [{ type: "input_text", text: "Voici le justificatif." }, media] }],
      }),
    });
    if (!res.ok || !res.body) {
      console.error("AI gateway", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { fields: null, error: "Trop de demandes, réessayez dans un instant." };
      if (res.status === 402) return { fields: null, error: "Crédits IA épuisés." };
      return { fields: null, error: "Lecture intelligente indisponible pour le moment." };
    }
    let out = "", buf = "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === "response.output_text.delta") out += ev.delta;
        } catch { /* ligne partielle */ }
      }
    }
    try {
      return { fields: sanitizeAiReceipt(JSON.parse(out), CATEGORIES), error: null };
    } catch {
      return { fields: null, error: "Le justificatif n'a pas pu être lu." };
    }
  });
