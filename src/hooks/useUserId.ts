import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setId(data.session?.user.id ?? null);
    });
    return () => {
      active = false;
    };
  }, []);
  return id;
}
