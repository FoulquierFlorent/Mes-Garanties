import { createServerFn } from "@tanstack/react-start";
import { supportSchema, isSupportRateLimited } from "@/lib/support";

export const sendSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => supportSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website) return { sent: false, error: "Envoi refusé." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabaseAdmin.from("support_requests").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
    if (isSupportRateLimited(count ?? 0)) return { sent: false, error: "Trop de demandes envoyées. Réessayez dans une heure." };
    const { data: row, error } = await supabaseAdmin.from("support_requests")
      .insert({ name: data.name, email, category: data.category, subject: data.subject, message: data.message })
      .select("id").single();
    if (error || !row) return { sent: false, error: "Votre demande n’a pas pu être enregistrée. Réessayez plus tard." };
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const r = await sendTemplateEmail("support-request", "", {
        templateData: { ...data, email, requestId: row.id },
        replyTo: email,
        idempotencyKey: `support-request-${row.id}`,
      });
      if (!r.sent) return { sent: false, error: "L’envoi a échoué. Écrivez-nous directement par e-mail." };
      await supabaseAdmin.from("support_requests").update({ email_sent: true }).eq("id", row.id);
      return { sent: true, error: null };
    } catch (e) {
      console.error("support email failed", e);
      return { sent: false, error: "L’envoi a échoué. Écrivez-nous directement par e-mail." };
    }
  });
