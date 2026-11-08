import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendAccountTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.auth.getUser();
    const user = data.user;
    if (error || !user || user.id !== context.userId || !user.email || !user.email_confirmed_at) {
      return { sent: false, error: "Votre compte doit avoir une adresse e-mail vérifiée." };
    }
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const result = await sendTemplateEmail("test-email", user.email, {
        idempotencyKey: `test-email-${user.id}-${Math.floor(Date.now() / 60_000)}`,
      });
      return result.sent
        ? { sent: true, error: null }
        : { sent: false, error: "Cette adresse ne reçoit plus les e-mails de Mes garanties (désabonnement ou blocage)." };
    } catch (error) {
      const { EmailAPIError } = await import("@lovable.dev/email-js");
      if (error instanceof EmailAPIError) {
        if (error.status === 429) return { sent: false, error: `Veuillez réessayer dans ${error.retryAfterSeconds ?? 60} secondes.` };
        if (error.code === "domain_not_verified" || error.code === "emails_disabled") {
          return { sent: false, error: "L’envoi d’e-mails n’est pas disponible actuellement." };
        }
      }
      return { sent: false, error: "L’e-mail n’a pas pu être envoyé. Réessayez plus tard." };
    }
  });