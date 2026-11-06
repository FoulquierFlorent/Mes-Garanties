import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Item } from "@/lib/items";
import { canExportInsurance, PLAN_LABELS, type PlanId } from "@/lib/plans";
import { filterItemsByPeriod, insuranceFileName, makeInsurancePdf, type ReceiptFile } from "@/lib/insurance-pdf";
import { buildAccountingCsv, makeReceiptsZip, type AccountingEntry, type ZipReceipt } from "@/lib/accounting-export";

const typeSchema = z.enum(["assurance-pdf", "justificatifs-zip", "comptable-csv"]);
const periodSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).refine((value) => Boolean(value.from) === Boolean(value.to));

function json(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function fileResponse(blob: Blob, filename: string) {
  return new Response(blob, {
    headers: {
      "Content-Type": blob.type,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function authenticatedClient(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  if (token.split(".").length !== 3) return null;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configuration du service indisponible");
  const supabase = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        if (init?.headers) new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims.sub) return null;
  return supabase;
}

function periodLabel(from: string | null, to: string | null): string {
  if (!from || !to) return "Toutes les dates";
  if (from.endsWith("-01-01") && to.endsWith("-12-31") && from.slice(0, 4) === to.slice(0, 4)) return `Année ${from.slice(0, 4)}`;
  const format = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" });
  return `Du ${format(from)} au ${format(to)}`;
}

export const Route = createFileRoute("/api/exports/$type")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const parsedType = typeSchema.safeParse(params.type);
          if (!parsedType.success) return json("export_inconnu", 404);
          const type = parsedType.data;
          const url = new URL(request.url);
          const parsedPeriod = periodSchema.safeParse({ from: url.searchParams.get("from"), to: url.searchParams.get("to") });
          if (!parsedPeriod.success) return json("periode_invalide", 400);
          const { from, to } = parsedPeriod.data;
          const supabase = await authenticatedClient(request);
          if (!supabase) return json("authentification_requise", 401);

          const { data: membership, error: membershipError } = await supabase
            .from("household_members")
            .select("household_id, households(id, name, plan)")
            .limit(1)
            .maybeSingle();
          if (membershipError || !membership?.households) return json("foyer_requis", 403);
          const household = membership.households as unknown as { id: string; name: string; plan: PlanId };
          const allowed = type === "assurance-pdf" ? canExportInsurance(household.plan) : household.plan === "titane";
          if (!allowed) return json("offre_insuffisante", 403);

          const [{ data: itemData, error: itemsError }, { data: memberData, error: membersError }] = await Promise.all([
            supabase.from("items").select("*").eq("household_id", household.id).order("purchase_date", { ascending: false }),
            supabase.from("household_members").select("user_id, display_name").eq("household_id", household.id),
          ]);
          if (itemsError || membersError) return json("lecture_impossible", 500);
          const allItems = (itemData ?? []) as Item[];
          const items = filterItemsByPeriod(allItems, from, to);
          const names = Object.fromEntries((memberData ?? []).map((member) => [member.user_id, member.display_name?.trim() || "Membre"]));
          const today = new Date().toISOString().slice(0, 10);
          const label = periodLabel(from, to);

          if (type === "comptable-csv") {
            const entries: AccountingEntry[] = [];
            for (const item of items) {
              const { data: files, error } = await supabase.storage.from("receipts").list(item.id);
              if (error) return json("justificatifs_inaccessibles", 500);
              const receiptNames = (files ?? []).filter((file) => file.name !== ".emptyFolderPlaceholder" && !file.name.endsWith(".ocr.txt")).map((file) => file.name);
              entries.push({ item, memberName: names[item.user_id] ?? "Membre", receiptNames });
            }
            const blob = new Blob([buildAccountingCsv(entries)], { type: "text/csv;charset=utf-8" });
            return fileResponse(blob, `export-comptable-titane-${today}.csv`);
          }

          const receipts: ZipReceipt[] = [];
          for (const item of items) {
            const { data: files, error } = await supabase.storage.from("receipts").list(item.id);
            if (error) return json("justificatifs_inaccessibles", 500);
            for (const file of files ?? []) {
              if (file.name === ".emptyFolderPlaceholder" || file.name.endsWith(".ocr.txt")) continue;
              const { data: blob, error: downloadError } = await supabase.storage.from("receipts").download(`${item.id}/${file.name}`);
              if (downloadError || !blob) return json("justificatif_inaccessible", 500);
              receipts.push({ itemId: item.id, itemName: item.name, name: file.name, blob });
            }
          }

          if (type === "justificatifs-zip") {
            return fileResponse(await makeReceiptsZip(receipts), `justificatifs-titane-${today}.zip`);
          }

          const insuranceReceipts: ReceiptFile[] = receipts.map((receipt) => ({
            itemId: receipt.itemId,
            name: receipt.name,
            blob: receipt.blob,
          }));
          const pdf = await makeInsurancePdf({ owner: household.name, items, names, today, receipts: insuranceReceipts, periodLabel: label });
          return fileResponse(pdf, insuranceFileName(PLAN_LABELS[household.plan], label, today));
        } catch (error) {
          console.error("Export failed", error);
          return json("export_impossible", 500);
        }
      },
    },
  },
});
