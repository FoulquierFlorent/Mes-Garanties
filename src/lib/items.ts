import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Item = Tables<"items">;

export const itemsQuery = queryOptions({
  queryKey: ["items"],
  queryFn: async () => {
    const { data, error } = await supabase.from("items").select("*").order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const fmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const CATEGORIES = ["Électronique", "Électroménager", "Meuble", "Sport", "Enfant", "Jeux", "Accessoires", "Vêtements", "Bricolage", "Autre"];

export const householdQuery = queryOptions({
  queryKey: ["household"],
  queryFn: async () => {
    const { data: m, error } = await supabase.from("household_members").select("household_id, households(id, name, invite_code)").limit(1).maybeSingle();
    if (error) throw error;
    if (!m) return null;
    const { data: members } = await supabase.from("household_members").select("user_id, email, display_name").eq("household_id", m.household_id);
    return { ...(m.households as { id: string; name: string; invite_code: string }), members: members ?? [] };
  },
});

export const RETURN_LABELS: Record<string, string> = {
  none: "Aucun retour",
  preparing: "En préparation",
  sent: "Envoyé",
  repair: "En réparation",
  replaced: "Remplacé",
  refunded: "Remboursé",
  refused: "Refusé",
};
