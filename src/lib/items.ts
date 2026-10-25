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
