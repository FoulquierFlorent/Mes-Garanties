import { createFileRoute } from "@tanstack/react-router";
import { EmailAPIError } from "@lovable.dev/email-js";
import { z } from "zod";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { daysLeft } from "@/lib/warranty";
import { dueWarrantyAlerts, emailAlertLeadLabel, normalizeEmailAlertLead, warrantyEmailIdempotencyKey, type EmailWarrantyItem } from "@/lib/warranty-email";

const bodySchema = z.object({ kind: z.literal("daily") }).strict();
const emailSchema = z.string().email().max(254);
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/public/jobs/send-warranty-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        let input: unknown;
        try { input = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
        const parsed = bodySchema.safeParse(input);
        if (!parsed.success) return json({ error: "invalid_request" }, 400);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const [{ data: members, error: membersError }, { data: items, error: itemsError }] = await Promise.all([
            supabaseAdmin.from("household_members").select("user_id, household_id, email, display_name, email_alert_lead").eq("email_alerts_enabled", true),
            supabaseAdmin.from("items").select("id, name, household_id, purchase_date, warranty_months, store_warranty_years, brand_warranty_years, constructor_warranty_years, extension_warranty_years, repair_warranty_years").not("household_id", "is", null),
          ]);
          if (membersError || itemsError) return json({ error: "read_failed" }, 500);

          const itemsByHousehold = new Map<string, EmailWarrantyItem[]>();
          for (const item of (items ?? []) as EmailWarrantyItem[]) {
            if (!item.household_id) continue;
            const group = itemsByHousehold.get(item.household_id) ?? [];
            group.push(item);
            itemsByHousehold.set(item.household_id, group);
          }

          const today = new Date().toISOString().slice(0, 10);
          let due = 0;
          let sent = 0;
          let suppressed = 0;
          let failed = 0;

          for (const member of members ?? []) {
            const email = member.email ? emailSchema.safeParse(member.email) : null;
            if (!email?.success) continue;
            const lead = normalizeEmailAlertLead(member.email_alert_lead);
            const alerts = dueWarrantyAlerts(itemsByHousehold.get(member.household_id) ?? [], lead, today);

            for (const alert of alerts) {
              due += 1;
              try {
                const result = await sendTemplateEmail("warranty-expiration-reminder", email.data, {
                  templateData: {
                    memberName: member.display_name?.trim() || "Membre",
                    itemName: alert.itemName,
                    itemUrl: `https://mesgaranties.com/objet/${alert.itemId}`,
                    leadLabel: emailAlertLeadLabel(lead),
                    warranties: alert.warranties.map((warranty) => ({
                      label: warranty.label,
                      endDate: formatDate(warranty.end),
                      daysLeft: daysLeft(warranty.end, today),
                    })),
                  },
                  idempotencyKey: warrantyEmailIdempotencyKey(member.user_id, alert.itemId, lead, today),
                });
                if (result.sent) sent += 1;
                else suppressed += 1;
              } catch (error) {
                if (error instanceof EmailAPIError && error.code === "domain_not_verified") {
                  return json({ error: "domain_not_verified" }, 503);
                }
                if (error instanceof EmailAPIError && error.status === 429) {
                  return json({ error: "rate_limited", retryAfterSeconds: error.retryAfterSeconds ?? 60 }, 429);
                }
                failed += 1;
                console.error("Warranty reminder send failed", error instanceof EmailAPIError ? error.code : "unknown_error");
              }
            }
          }

          return json({ success: failed === 0, due, sent, suppressed, failed });
        } catch (error) {
          console.error("Warranty reminder job failed", error instanceof Error ? error.name : "unknown_error");
          return json({ error: "job_failed" }, 500);
        }
      },
    },
  },
});
