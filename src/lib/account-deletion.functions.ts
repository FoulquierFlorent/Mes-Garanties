import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DELETE_CONFIRMATION_WORD, planAccountDeletion } from "@/lib/account-deletion";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { confirmation: string }) => ({ confirmation: String(input?.confirmation ?? "") }))
  .handler(async ({ context, data }) => {
    if (data.confirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_WORD) {
      return { deleted: false, error: `Tapez ${DELETE_CONFIRMATION_WORD} pour confirmer.` };
    }
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data: memberships, error: mErr } = await supabaseAdmin.from("household_members").select("household_id").eq("user_id", userId);
      if (mErr) throw mErr;
      const householdIds = (memberships ?? []).map((m) => m.household_id);
      const shared = new Set<string>();
      if (householdIds.length) {
        const { data: others, error } = await supabaseAdmin.from("household_members").select("household_id").in("household_id", householdIds).neq("user_id", userId);
        if (error) throw error;
        for (const o of others ?? []) shared.add(o.household_id);
      }
      const { data: items, error: iErr } = await supabaseAdmin.from("items").select("id,user_id,household_id").eq("user_id", userId);
      if (iErr) throw iErr;
      const plan = planAccountDeletion(userId, items ?? [], shared);

      for (const id of plan.deleteItemIds) {
        for (const bucket of ["receipts", "item-photos"]) {
          const { data: files } = await supabaseAdmin.storage.from(bucket).list(id, { limit: 1000 });
          const paths = (files ?? []).map((f) => `${id}/${f.name}`);
          if (paths.length) await supabaseAdmin.storage.from(bucket).remove(paths);
        }
      }
      if (plan.deleteItemIds.length) {
        const { error } = await supabaseAdmin.from("items").delete().in("id", plan.deleteItemIds);
        if (error) throw error;
      }
      await supabaseAdmin.from("member_profiles").delete().eq("user_id", userId);
      await supabaseAdmin.from("household_members").delete().eq("user_id", userId);
      const empty = householdIds.filter((h) => !shared.has(h));
      if (empty.length) {
        await supabaseAdmin.from("household_invitations").delete().in("household_id", empty);
        await supabaseAdmin.from("households").delete().in("id", empty);
      }
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authErr) throw authErr;
      return { deleted: true, error: null, keptSharedCount: plan.keptSharedCount };
    } catch (e) {
      console.error("delete account failed", e);
      return { deleted: false, error: "La suppression n’a pas pu aboutir. Réessayez plus tard." };
    }
  });
