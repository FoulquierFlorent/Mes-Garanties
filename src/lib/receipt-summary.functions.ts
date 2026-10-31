import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Résume les tickets et factures lus (texte OCR) d'un objet, puis enregistre le résumé sur la fiche. */
export const summarizeReceipts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.itemId)) throw new Error("Objet invalide");
    return d;
  })
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: item } = await sb.from("items").select("id, name, brand, store, purchase_date").eq("id", data.itemId).maybeSingle();
    if (!item) return { summary: null, error: "Objet introuvable" };

    const { data: files } = await sb.storage.from("receipts").list(data.itemId);
    const txt = (files ?? []).filter((f) => f.name.endsWith(".ocr.txt"));
    const texts: string[] = [];
    for (const f of txt) {
      const { data: blob } = await sb.storage.from("receipts").download(`${data.itemId}/${f.name}`);
      const t = blob ? (await blob.text()).trim() : "";
      if (t) texts.push(`--- ${f.name.replace(/\.ocr\.txt$/, "")} ---\n${t.slice(0, 6000)}`);
    }
    if (!texts.length) return { summary: null, error: "Aucun ticket lu pour cet objet. Ajoutez une photo de ticket ou relancez la lecture." };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { summary: null, error: "Service de résumé non configuré" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: "Tu résumes des tickets de caisse et factures (texte OCR parfois imparfait) en français, en 3 à 6 puces courtes : magasin, date d'achat, article(s) et prix, total, moyen de paiement, numéro de facture ou mentions de garantie si présents. N'invente rien ; écris « non lisible » si une info manque. Pas d'introduction.",
        input: `Objet : ${item.name}${item.brand ? ` (${item.brand})` : ""}, acheté le ${item.purchase_date}${item.store ? ` chez ${item.store}` : ""}.\n\n${texts.join("\n\n")}`,
      }),
    });
    if (!res.ok || !res.body) {
      console.error("AI gateway", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { summary: null, error: "Trop de demandes, réessayez dans un instant." };
      if (res.status === 402) return { summary: null, error: "Crédits IA épuisés." };
      return { summary: null, error: "Résumé indisponible pour le moment." };
    }

    let out = "", buf = "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n");
      buf = parts.pop() ?? "";
      for (const line of parts) {
        if (!line.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === "response.output_text.delta") out += ev.delta;
        } catch { /* ligne partielle ou [DONE] */ }
      }
    }
    const summary = out.trim();
    if (!summary) return { summary: null, error: "Résumé vide, réessayez." };
    await sb.from("items").update({ receipt_summary: summary }).eq("id", data.itemId);
    return { summary, error: null };
  });
